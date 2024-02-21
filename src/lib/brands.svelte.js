import _ from "lodash";
import { untrack } from "svelte";

async function fetchBundleAsResourceMap(source) {
  const bundleResponse = await fetch(source);
  const bundle = await bundleResponse.json();
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
        r[1]?.extension.some(
          (e) =>
            e.url ===
              "http://hl7.org/fhir/StructureDefinition/organization-portal" &&
            e.extension?.some((e) => e.url === "portalEndpoint")
        )
    )
    .fromPairs()
    .value();

  return resourceMap;
}

/**
 * @param {string} source
 */
export default function brands(
  { PAGE_SIZE = 10, searchBoxText = "" } = { PAGE_SIZE: 10 }
) {
  console.log("Iniitlize brnds");
  let resources = $state({});
  let hits = $state([]);
  let textIndex = [];

  let load = async function (source) {
    resources = { ...resources, ...(await fetchBundleAsResourceMap(source)) };
    console.log("REdo res");
    // resources = await fetchBundleAsResourceMap(source);
    textIndex = 
      _(resources)
      .toPairs()
      .sortBy(([k,v]) => v.name)
      .filter(([k, v]) => v.resourceType === "Organization")
      .map(([k, v]) => [
          k,
          `${v.name} ${v.alias?.join(" ")} ${v.address
            ?.map((a) => `${a.city || ""} ${a.state || ""}`)
            .join(" ")}`.toLowerCase(),
      ])
      .value();
    search({ query: "" });
  };

  $effect(() => {
    untrack(() => {
      const bundleUrls = new URLSearchParams(window.location.search).getAll("bundle")
      if (bundleUrls.length === 0) {
        bundleUrls.push("https://joshuamandel.com/pab-viewer/bundle.json")
      };
      for (const b of bundleUrls) {
        load(b);
      }
    });
  });

  let page = $state(0);
  let query = "";

  function search({ query: qIn }) {
    untrack(() => {
      page = -1;
      query = qIn;
      nextPage();
    });
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
  };
}
