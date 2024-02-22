<script>
  import getBrandStore from "$lib/brands.svelte";
  import { setContext } from "svelte";

  let brandStore = getBrandStore({ PAGE_SIZE: 20 });
  setContext("brandStore", brandStore);

  const numResources = $derived.by(() => {
    const l = Object.keys(brandStore?.db || {}).length;
    if (l > 10000) {
      return `${(l / 1000).toFixed(0)}k`;
    } else {
      return l;
    }
  });

  function downloadBundleSnapshot() {
    const serializedJSON = JSON.stringify(brandStore.snapshot, null, 2);
    const blob = new Blob([serializedJSON], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brandStore.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }


</script>

<h1 style="margin: 1rem;">
  SMART User-Access Brands Browser

  {#if !brandStore?.loading}
    <span style="float:right">
      <a style="text-decoration: none;" href="./config">⚙️</a>
      <a
        style="text-decoration: none; cursor: pointer;"
        on:click={downloadBundleSnapshot}>💾 {numResources} resources</a
      ></span
    >
  {/if}
</h1>

<div style="margin: 1rem">
  <slot></slot>
</div>
<style>
    :global(body) {
        font-family: 'Roboto', sans-serif;
        margin: 0;
        padding: 0;
    }
</style>