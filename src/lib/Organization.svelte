<script>
  let { organization, db } = $props();
  let maxAddress = 3;
  let allAddress = $state(false);
  function handleError(event) {
    event.target.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024'><path d='M0 0h1024v1024H0z' style='fill:%23eee'/><text x='40' y='170' style='font-size:150px'>broken img :/</text></svg>`;
  }

</script>

<div class="card">
  {#if organization.extension}
    {#each organization.extension as ext}
      {#if ext.url === "http://hl7.org/fhir/StructureDefinition/organization-brand"}
        {#each ext.extension.filter((e) => e.url === "brandLogo") as logo}
          <div class="card-logo">
            <img src={logo.valueUrl} alt="Organization Logo" on:error={handleError}/>
          </div>
        {/each}
      {/if}
    {/each}
  {/if}

  <div class="card-content">
    <h2>{organization?.name} {#if organization?.partOf} (<code>🧩.partOf</code>){/if}</h2>

    {#if organization.telecom}
      <a
        href={organization.telecom.find((t) => t.system === "url").value}
        target="_blank"
      >
        {organization.telecom.find((t) => t.system === "url").value}
      </a>
    {/if}

    {#each organization.address?.slice(0, allAddress ? Math.Infinity : maxAddress) as address, i}
      <address>
        {#if i > 0}
          <hr style="width: 20px; display: inline-block" />
        {/if}
        {#if address.line}
          <p>{address.line.join(", ")}</p>
        {/if}
        <p>
          {#if address.city}
            {address.city},
          {/if}
          {#if address.state}
            {address.state}
          {/if}
          {#if address.postalCode}
            {address.postalCode}
          {/if}
        </p>
        {#if !allAddress && i === maxAddress - 1 && organization.address.length > maxAddress}
          <p>
            ... and <button on:click={() => (allAddress = !allAddress)}>
              {organization.address.length - maxAddress} more
            </button>
          </p>
        {/if}
      </address>
    {/each}

    {#each organization.extension.filter((e) => e.url === "http://hl7.org/fhir/StructureDefinition/organization-portal") as portal}
      <div class="portal-info">
        {#each portal.extension.filter((e) => e.url === "portalLogo") as logo}
          <div class="card-logo">
            <img src={logo.valueUrl} alt="Portal Logo" on:error={handleError}/>
          </div>
        {/each}

        <h3>
          {#if portal.extension.find((e) => e.url === "portalName").valueString !== organization?.name}
            {portal.extension.find((e) => e.url === "portalName").valueString}
            {:else}
            Portal
          {/if}
        </h3>
        {#if portal.extension.find(e => e.url === "portalDescription")}
          <p class="portal-description">{portal.extension.find(e => e.url === "portalDescription").valueMarkdown}</p>
        {/if}

        {#each portal?.extension.filter((e) => e.url === "portalUrl") as e}
          <a href={e?.valueUrl} target="_blank"> Log In </a>
        {:else}
          <p class="missing">(Missing Portal URL)</p>
        {/each}

        {#each portal.extension.filter((e) => e.url === "portalEndpoint") as endpoint}
          <p>
            FHIR: {db[endpoint.valueReference.reference]?.address ||
              endpoint.valueReference.reference}
          </p>
        {:else}
          <p class="missing">(Missing FHIR Endpoint)</p>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .card {
    border: 1px solid lightgray;
    padding: 20px;
    min-width: 300px;
    flex-grow: 1;
    background-color: snow;
    /*shaadow now*/
    box-shadow: 0 0 3px 0px white;
    border-radius: 5px;
  }

  .card-logo img {
    max-width: 150px;
    max-height: 150px;
  }

  .portal-info {
    margin-top: 20px;
    border-top: 1px solid lightgray;
    padding-top: 15px;
  }

  .portal-description, .missing{
    font-style: italic;
  }

</style>
