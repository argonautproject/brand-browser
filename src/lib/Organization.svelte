<script>
  let { organization, db } = $props();
  let maxAddress = 3;
  let allAddress = $state(false);
</script>

<div class="card">
  {#if organization.extension}
    {#each organization.extension as ext}
      {#if ext.url === "http://hl7.org/fhir/StructureDefinition/organization-brand"}
        {#each ext.extension.filter((e) => e.url === "brandLogo") as logo}
          <div class="card-logo">
            <img src={logo.valueUrl} alt="Organization Logo" />
          </div>
        {/each}
      {/if}
    {/each}
  {/if}

  <div class="card-content">
    <h2>{organization?.name}</h2>

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

    {#each organization.extension.filter((e) => e.url === "http://hl7.org/fhir/StructureDefinition/organization-portal") as ext}
      <div class="portal-info">
        <h3>
          Portal
          {#if ext.extension.find((e) => e.url === "portalName").valueString !== organization?.name}
            ({ext.extension.find((e) => e.url === "portalName").valueString})
          {/if}
        </h3>

        {#each ext?.extension.filter((e) => e.url === "portalUrl") as e}
          <a href={e?.valueUrl} target="_blank"> Log In </a>
        {:else}
          Missing Portal URL
        {/each}

        {#each ext.extension.filter((e) => e.url === "portalEndpoint") as endpoint}
          <p>
            FHIR: {db[endpoint.valueReference.reference]?.address ||
              endpoint.valueReference.reference}
          </p>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .card {
    border: 1px solid lightgray;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 1em;
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
</style>
