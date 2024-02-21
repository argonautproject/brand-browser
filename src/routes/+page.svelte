<script>
  import getBrandStore from "$lib/brands.svelte";
  import Organization from "$lib/Organization.svelte";

  let searchBoxText = $state("");


  let brandStore = getBrandStore({ PAGE_SIZE: 20 });
  
  $effect(() => {
    // get the q= search param if any, to populate search box
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) searchBoxText = q;
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

<h1>SMART User Access Brands Browser
<a style="text-decoration: none;" href="./config">⚙️</a>

</h1> 
<input class="search" autofocus type="text" placeholder="search" bind:value={searchBoxText} />

{#if brandStore.loading}
 Loading brand bundles... 
{/if}
<div class="cards">
{#each brandStore.hits as org}
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