<script>
  let { organization, db } = $props();
  let maxAddress = 3;
  let allAddress = $state(false);
  function handleError(event) {
    event.target.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024'><path d='M0 0h1024v1024H0z' style='fill:%23eee'/><text x='40' y='170' style='font-size:150px'>broken img :/</text></svg>`;
  }
</script>

<div class="card">
  <h2>
    {organization?.name}
    {#if organization?.partOf && db[organization.partOf.reference]?.extension?.find((e) => e.url === "http://hl7.org/fhir/StructureDefinition/organization-brand" || e.url === "http://hl7.org/fhir/StructureDefinition/organization-portal")}
      (<code>🧩.partOf</code>){/if}
  </h2>
  <div class="card-logo">
    {#if organization.extension}
      {#each organization.extension as ext}
        {#if ext.url === "http://hl7.org/fhir/StructureDefinition/organization-brand"}
          {#each ext.extension.filter((e) => e.url === "brandLogo") as logo}
            <img
              src={logo.valueUrl}
              alt="Organization Logo"
              on:error={handleError}
            />
          {/each}
        {/if}
      {/each}
    {/if}
  </div>

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

  <div class="pre-portals"></div>
  {#each organization.extension?.filter((e) => e.url === "http://hl7.org/fhir/StructureDefinition/organization-portal") as portal}
    <div class="portal-info">
      <h3>
        {#if ![organization?.name, undefined].includes(portal?.extension?.find((e) => e.url === "portalName")?.valueString)}
          {portal.extension?.find((e) => e.url === "portalName")?.valueString}
        {:else}
          Portal
        {/if}
      </h3>
      <div class="portal-logo">
        {#each portal.extension.filter((e) => e.url === "portalLogo") as logo}
          <img src={logo.valueUrl} alt="Portal Logo" on:error={handleError} />
        {/each}
      </div>

      {#each portal?.extension?.filter((e) => e.url === "portalUrl") as e}
        <a href={e?.valueUrl} target="_blank"> Log In </a>
      {:else}
        <p class="missing">(Missing Portal URL)</p>
      {/each}

      {#if portal?.extension?.find((e) => e.url === "portalDescription")}
        <p class="portal-description">
          {portal.extension.find((e) => e.url === "portalDescription")
            .valueMarkdown}
        </p>
      {/if}

      {#each portal.extension.filter((e) => e.url === "portalEndpoint") as endpoint}
        <p>
          FHIR Base URL: {db[endpoint.valueReference.reference]?.address ||
            endpoint.valueReference.reference}
        </p>
      {:else}
        <p class="missing">(Missing FHIR Endpoint)</p>
      {/each}
    </div>
  {/each}
</div>

<style>
  .card {
    border: 1px solid lightgray;
    padding: 20px;
    width: 400px;
    flex-grow: 1;
    background-color: snow;
    box-shadow: 0 0 3px 0px white;
    border-radius: 5px;
    overflow: hidden;
    overflow-wrap: break-all;
    display: flex;
    flex-direction: column;
  }
  @media (max-width: 600px) {
    .card {
      min-width: 90%;
    }
  }
  .card div.pre-portals {
    flex-grow: 1;
  }

  .card-logo {
    height: 150px;
  }
  .card-logo img {
    max-width: 150px;
    max-height: 150px;
  }

  .portal-info {
    margin-top: 20px;
    padding-left: 1em;
    margin-left: -1rem;
    border-left: 5px solid darkgray;
    height: 300px;
    margin-left: -1.3rem;
  }
  .portal-info h3 {
    margin-top: 0;
  }

  .portal-logo img {
    max-width: 100px;
    max-height: 100px;
    height: 66px;
  }

  .portal-logo {
    height: 66px;
  }

  .portal-description,
  .missing {
    font-style: italic;
  }

  address p {
    margin-top: 5px;
    margin-bottom: 5px;
  }

  .card a {
    margin-bottom: 1em;
    display: inline-block;
  }
</style>
