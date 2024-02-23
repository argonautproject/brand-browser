<script>
  import { goto } from "$app/navigation";
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

  // $effect register a listener for alt+slash
  $effect(() => {
    const onKeydown = (e) => {
      if (e.altKey) {
        if (e.key === "/") {
          e.preventDefault();
          goto("./config");
        }
        if (e.key === "d") {
          e.preventDefault();
          downloadBundleSnapshot();
        }

      }
    };
    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  });
</script>

<h1 style="margin: 1rem;">
  SMART Brands Browser

  {#if !brandStore?.loading}
    <span style="float:right; font-size: 1rem;">
      <a
        style="text-decoration: none;"
        href="./config"
        title={"Settings (alt + /)"}>⚙️</a
      >
      <a
        style="text-decoration: none; cursor: pointer;"
        title={"Download snapshot Bundle (alt + d)"}
        on:click={downloadBundleSnapshot}>💾 {numResources} resource{#if numResources !== 1}s{/if}</a
      ></span
    >
  {/if}
</h1>

<div style="margin: 1rem">
  <slot />
</div>

<style>
  :global(body) {
    font-family: "Roboto", sans-serif;
    margin: 0;
    padding: 0;
  }

  @media (max-width: 600px) {
    h1 {
      font-size: 1rem;
    }
  }
</style>
