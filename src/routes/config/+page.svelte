<script>
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { getContext, untrack } from "svelte";
  /** @type {ReturnType<import('$lib/brands.svelte').default>} */
  let brandStore = getContext("brandStore");

  /** @type null | number*/
  let inboundBundle = $state(null);

  $effect(() => {
    /** @type {globalThis} */
    const opener = window.opener;
    if (!opener || opener === window) return;
    opener.postMessage("ready", "*");
    const receive = (e) => {
      if (e.data === "done") {
        window.removeEventListener("message", receive);
        goto(`./?inboundBundle=${inboundBundle}`);
        return;
      }
      inboundBundle = brandStore.register(e.data);
    };
    window.addEventListener("message", receive);
  });
</script>

Choose a data set:

<ul>
  {#if inboundBundle !== null}
    <li>
      <a href={`./?inboundBundle=${inboundBundle}`}
        >Bundle from external editor</a
      >
    </li>
  {/if}
  <li>
    <a
      href="./?bundle=https://build.fhir.org/ig/HL7/smart-app-launch/Bundle-example1.json&bundle=https://build.fhir.org/ig/HL7/smart-app-launch/Bundle-example2.json&bundle=https://build.fhir.org/ig/HL7/smart-app-launch/Bundle-example3.json&bundle=https://build.fhir.org/ig/HL7/smart-app-launch/Bundle-example4.json"
      >SMART 2.2 spec examples (13)</a
    >
  </li>
  <ul>
    <li>
      <a
        href="./?bundle=https://build.fhir.org/ig/HL7/smart-app-launch/Bundle-example1.json"
        >Lab with locations nationwide
      </a>
    </li>
    <li>
      <a
        href="./?bundle=https://build.fhir.org/ig/HL7/smart-app-launch/Bundle-example2.json"
        >Regional health system with independently branded affiliates
      </a>
    </li>

    <li>
      <a
        href="./?bundle=https://build.fhir.org/ig/HL7/smart-app-launch/Bundle-example3.json"
        >One brand featuring diffeerent EHR portals for different
        sub-populations
      </a>
    </li>

    <li>
      <a
        href="./?bundle=https://build.fhir.org/ig/HL7/smart-app-launch/Bundle-example4.json"
      >
        Two co-equal brands with a shared portal</a
      >
    </li>
  </ul>
  <li>
    <a href="./?bundle=https://brand-browser.argo.run/bundle.json&q=pediatrics"
      >Fasten US Directory (31k)</a
    >
  </li>
</ul>
