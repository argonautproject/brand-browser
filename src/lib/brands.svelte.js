import _ from "lodash";
import { untrack } from "svelte";

async function fetchBundleAsResourceMap(source) {
  const bundleResponse = await fetch(source);
  const bundle = await bundleResponse.json();

  // ensure that all references are resolved to full URLs
  const resourceMap = _.chain(bundle.entry)
    .map((r) => {
      const baseUrl = r.fullUrl.replace(
        new RegExp(r.resource.resourceType + "/" + r.resource.id + "$"),
        ""
      );

      const fixReferences = (obj) => {
        if (obj === null || typeof obj !== "object") {
          return obj;
        }

        if (_.isArray(obj)) {
          return obj.map(fixReferences);
        }

        return _.mapValues(obj, (v, k) => {
          if (
            k === "reference" &&
            typeof v === "string" &&
            v.indexOf("http") !== 0
          ) {
            return baseUrl + v;
          } else {
            return fixReferences(v);
          }
        });
      };

      return [r.fullUrl, fixReferences(r.resource)];
    })
    .filter(
      (r) =>
        r[1].resourceType === "Endpoint" ||
        r[1]?.partOf ||
        r[1]?.extension.some(
          (e) =>
            e.url ===
              "http://hl7.org/fhir/StructureDefinition/organization-portal" &&
            e.extension?.some((e) => e.url === "portalEndpoint")
        )
    )
    .fromPairs()
    .value();

  function getPortals(resourceMap, id) {
    const r = resourceMap[id];
    const portals = (r.extension || []).filter(
      (e) =>
        e.url === "http://hl7.org/fhir/StructureDefinition/organization-portal"
    );
    return portals;
  }

  function getPortalEndpoints(portals) {
    return new Set(
      (Array.isArray(portals) ? portals : [portals]).flatMap((p) =>
        p.extension
          ?.filter((e) => e.url === "portalEndpoint")
          .map((e) => e.valueReference.reference)
      )
    );
  }

  function minus(a, b) {
    return new Set([...a].filter((x) => !b.has(x)));
  }

  // push down the parent portals to the child, if they offer additional endpoints
  _(resourceMap).forEach((r, id) => {
    if (r.resourceType === "Organization" && r.partOf) {
      const myPortals = getPortals(resourceMap, id);
      const myEndpoints = getPortalEndpoints(myPortals);
      const parentPortals = getPortals(resourceMap, r.partOf.reference);
      const portalsToInherit = parentPortals.filter(
        (pp) => minus(getPortalEndpoints(pp), myEndpoints).size > 0
      );
      for (const p of portalsToInherit) {
        if (!r.extension) r.extension = [];
        r.extension.push(JSON.parse(JSON.stringify(p)));
      }
    }
  });

  return resourceMap;
}

/**
 * @param {string} source
 */
export default function brands(
  { PAGE_SIZE = 10, searchBoxText = "" } = { PAGE_SIZE: 10 }
) {
  let resources = $state({});
  let hits = $state([]);
  let textIndex = [];

  let load = async function (source) {
    const newResources = await fetchBundleAsResourceMap(source);
    resources = { ...resources, ...newResources };
    textIndex = _(resources)
      .toPairs()
      .sortBy(([k, v]) => v.name)
      .filter(([k, v]) => v.resourceType === "Organization")
      .map(([k, v]) => [
        k,
        `${v.name} ${v.alias?.join(" ")} ${v.address
          ?.map((a) => `${a.city || ""} ${a.state || ""}`)
          .join(" ")}`.toLowerCase(),
      ])
      .value();
  };

  /**
   * @param {string[]} bundleUrls
   */
  async function initialize(bundleUrls) {
    initialized = false;
    resources = {};
    hits = [];
    textIndex = [];
    if (bundleUrls.length === 0) {
      bundleUrls.push("https://joshuamandel.com/brand-browser/bundle.json");
    }
    try {
      await Promise.allSettled(bundleUrls.map(load));
    } finally {
      search({ query, force: true });
      initialized = true;
    }
  }

  let page = $state(0);
  let query = "UNINITIALIZED";
  let initialized = $state(false);

  function search({ query: qIn, force = false }) {
    const canonicalized = qIn.toLowerCase().trim();
    if (!force && canonicalized === query) return;
    page = -1;
    query = canonicalized;
    nextPage();
  }

  function nextPage() {
    let probes = query.toLowerCase().split(/\s/) || [];
    page++;
    let orgs = textIndex
      .filter(([k, o]) => probes.every((w) => o.includes(w)))
      .slice(0, (page + 1) * PAGE_SIZE);
    hits = orgs.map(([k]) => resources[k]);
  }

  return {
    initialize,
    get loading() {
      return !initialized;
    },
    load,
    get page() {
      return page;
    },
    get db() {
      return resources;
    },
    search,
    nextPage,
    get hits() {
      return hits;
    },
    get snapshot() {
      return {
        resourceType: "Bundle",
        type: "collection",
        timestamp: new Date().toISOString(),
        entry: _(resources)
          .toPairs()
          .map(([k, v]) => ({
            fullUrl: k,
            resource: v,
          }))
          .value(),
      };
    },
  };
}
