<script>
  import Organization from "$lib/Organization.svelte";
  import * as nav from "$app/navigation";
  import { page } from "$app/stores";

  import { getContext, untrack } from "svelte";
  /** @type {ReturnType<import('$lib/brands.svelte').default>} */
  let brandStore = getContext("brandStore");

  let searchBoxText = $state("");

  $effect(() => {
    untrack(async function () {
      const b = $page.url.searchParams.getAll("bundle");
      if ($page.url.searchParams.has("inboundBundle")) {
        brandStore.initialize({inline: [parseInt($page.url.searchParams.get("inboundBundle"))]});
      } else if (b.length){
        brandStore.initialize({bundleUrls: b});
      } else {
        nav.goto("./config")
      }
      const q = $page.url.searchParams.get("q");
      if (q) searchBoxText = q;
    });
  });

  $effect(() => {
    const newP = new URLSearchParams(window.location.search);
    if (searchBoxText !== newP.get("q")) {
      newP.set("q", searchBoxText);
      nav.goto("?" + newP.toString(),{replaceState: true})
    }
  });

  $effect(() => {
    brandStore.search({
      query: searchBoxText,
    });
  });

  $effect(() => {
    const onScroll = () => {
      if (
        2 * window.innerHeight + window.scrollY >=
        document.body.offsetHeight
      ) {
        brandStore.nextPage();
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  });
</script>

<input
  class="search"
  autofocus
  type="text"
  placeholder="search (alt + /)"
  bind:value={searchBoxText}
/>

{#if brandStore?.loading}
  Loading brand bundles...
{/if}
<div class="cards">
  {#each brandStore?.hits || [] as org}
    <Organization organization={org} db={brandStore.db} />
  {/each}
</div>

<style>
  .cards {
    display: flex;
    flex-wrap: wrap;
    justify-content: left;
    gap: 1em;
    margin: 1em;
    width: calc(100% - 2em);
  }

  input.search {
    box-sizing: border-box;
    width: calc(100% - 2em);
    padding: 0.5em;
    margin: 1em;
  }
</style>
