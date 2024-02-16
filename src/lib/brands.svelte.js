import _ from 'lodash';

/**
 * @param {string} source
 */
export default async function brands(source,) {
    const bundleResponse  = await fetch(source);
    const bundle = await bundleResponse.json();

    const resources = _.chain(bundle.entry)
        .map(r => {
            // recurse on r.resource to find any ".reference" properties and re-write
            // relative URLs to full URLs with r.fullUrl (minus r.resourceType/r.id) as prefix
            const baseUrl =  r.fullUrl.replace(r.resource.resourceType + '/' + r.resource.id, '');

            const fixReferences = (obj) => {
                if (obj === null || typeof obj !== 'object') {
                    return obj;
                }

                if (_.isArray(obj)) {
                    return obj.map(fixReferences);
                }

                return _.mapValues(obj, (v, k) => {
                    if (k === 'reference' && typeof v === 'string' && v.indexOf('http') !== 0) {
                        return baseUrl + v;
                    } else {
                        return fixReferences(v);
                    }
                });
            };

            return [r.fullUrl, fixReferences(r.resource)]; ;
        })
        .filter(r =>
                 r[1].resourceType === 'Endpoint' ||
                 r[1]?.extension.some(
                    e => e.url === 'http://hl7.org/fhir/StructureDefinition/organization-portal' &&
                    e.extension?.some(e => e.url === 'portalEndpoint')))
        .fromPairs()
        .value();

    const textIndex = Object.fromEntries(
        Object
            .entries(resources)
            .filter(([k, v]) => v.resourceType === "Organization")
            .map(([k, v]) => [k, `${v.name} ${v.alias?.join(" ")} ${v.address?.map(a => `${a.city || ""} ${a.state || ""}`).join(' ')}`.toLowerCase()]));

    function search({query, offset, limit}) {
        let probes = query.toLowerCase().split(/\s/) || []
        let orgs = Object.entries(textIndex)
            .filter(([k, o]) => probes.every(w => o.includes(w)))
            .slice(offset, offset + limit)
        return orgs.map(([k]) => resources[k])
    }

    return {resources, search}
}