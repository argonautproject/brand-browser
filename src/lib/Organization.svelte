<script>
  let {organization, db} = $props();
</script>

<div class="card">
  {#if organization.extension}
    {#each organization.extension as ext}
      {#if ext.url === 'http://hl7.org/fhir/StructureDefinition/organization-brand'}
        <div class="card-logo">
          <img src={ext.extension.find(e => e.url === 'brandLogo').valueUrl} 
               alt="Organization Logo" />
        </div>
      {/if}
    {/each}
  {/if}

  <div class="card-content">
    <h2>{organization?.name}</h2>

    {#if organization.telecom}
      <p>
        <a href={organization.telecom.find(t => t.system === 'url').value}>
          {organization.telecom.find(t => t.system === 'url').value}
        </a>
      </p>
    {/if}

    {#if organization.address}
      <address>
        {#each organization.address as address, i}
            {#if i > 0}
            <hr style="width: 20px; display: inline-block"/>
            {/if}
        {#if address.line}
            <p>{address.line.join(', ')}</p>
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
        {/each}
      </address>
    {/if}

      {#each organization.extension.filter(e => e.url ===  'http://hl7.org/fhir/StructureDefinition/organization-portal') as ext}
          <div class="portal-info">
            <h3>Portal 
                {#if ext.extension.find(e => e.url === 'portalName').valueString !== organization?.name}
                  ({ext.extension.find(e => e.url === 'portalName').valueString})
                {/if}
            </h3>
            <a href={ext?.extension.find(e => e.url === 'portalUrl')?.valueUrl} 
               target="_blank">
                  Log In
            </a>
            {#each ext.extension.filter(e => e.url === 'portalEndpoint') as endpoint}
              <p>FHIR: {db[endpoint.valueReference.reference]?.address || endpoint.valueReference.reference}</p>
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 1em;
}

.card-logo img {
  max-width: 150px;
  max-height: 80px;
  margin-bottom: 15px;
}

.portal-info {
  margin-top: 20px;
  border-top: 1px solid lightgray;
  padding-top: 15px;
}
</style>
