<script>
  import getBrands from "$lib/brands.svelte";
  import Organization from "$lib/Organization.svelte";
  import _ from "lodash";

  let searchBoxText = $state("");
  let store = $state({});
  let page = $state(0);

  let lastSearchText = searchBoxText;
  $effect(() => {
    if (searchBoxText !== lastSearchText) {
      page = 0;
      lastSearchText = searchBoxText;
    }
  });

  let hits = $derived.by(() => {
    const PAGE_SIZE = 10;
    return (
      store.search?.({
        query: searchBoxText,
        offset: 0,
        limit: PAGE_SIZE * (page + 1),
      }) || []
    );
  });

  $effect(() => {
    // detect scroll near bottom of page
    const onScroll = () => {
      if (
        2 * window.innerHeight + window.scrollY >=
        document.body.offsetHeight
      ) {
        page++;
      }
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  });

  $effect(async () => {
    store = await getBrands(
        // use a ?bundle=https://   param if present or default to joshuamandel
        new URLSearchParams(window.location.search).get("bundle") || "https://joshuamandel.com/pab-from-fasten/bundle.json"
    );
    console.log("Assigned db");
  });
</script>

<h1>SMART User Access Brands</h1>

<input type="text" placeholder="search" bind:value={searchBoxText} />

{#each hits as org}
  <Organization organization={org} db={store.resources} />
{/each}
