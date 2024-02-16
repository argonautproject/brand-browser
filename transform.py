import json
import os
import sys
import urllib.parse

def load_json_content(file_name):
    with open(file_name, 'r') as file:
        return json.load(file)

def get_brand_https_url(url):
    """Parses a URL and returns the HTTPS URL for the brand's primary web presence.

    Args:
        url: The URL to parse.

    Returns:
        The HTTPS URL for the brand's primary web presence, or None if parsing fails.
    """

    try:
        parsed_url = urllib.parse.urlparse(url)
        scheme = 'https'  # Use 'https' as default if missing
        netloc = parsed_url.netloc.replace("www.", "")
        brand_url = urllib.parse.urlunparse((scheme, netloc, '', '', '', ''))

        return brand_url

    except ValueError:
        # Handle invalid URLs
        return None

def create_organization_adjusted(brand, portals_content):
    organization = {
        "resourceType": "Organization",
        "id": brand["id"],
        "name": brand.get("name"),
        "active": True,
        "type": [{"coding": [{"system": "http://hl7.org/fhir/organization-type", "code": "prov", "display": "Healthcare Provider"}]}],
        "telecom": [],
        "address": [],
        "extension": [],
        "identifier": []
    }

    if brand.get("brand_website"):
        brand_website = brand.get("brand_website")
        if brand_website.startswith("http:"):
            brand_website = "https:" + brand_website[5:]
        baseurl = get_brand_https_url(brand_website)
        if baseurl:
            organization["identifier"].append({"system": "urn:ietf:rfc:3986", "value": baseurl})
        organization["telecom"].append({"system": "url", "value": brand_website})
    for loc in brand.get("locations", []):
        address = {}
        if "line" in loc:
            address["line"] = loc["line"]
        if "city" in loc:
            address["city"] = loc["city"]
        if "state" in loc:
            address["state"] = loc["state"]
        if "postal_code" in loc:
            address["postalCode"] = loc["postal_code"]
        if "country" in loc:
            address["country"] = loc["country"]
        if address:
            organization["address"].append(address)
    if "logo" in brand:
        organization["extension"].append({
            "url": "http://hl7.org/fhir/StructureDefinition/organization-brand",
            "extension": [{"url": "brandLogo", "valueUrl": brand["logo"]}]
        })

    known_systems = ["http://hl7.org/fhir/sid/us-npi"]
    for bid in brand.get("identifiers", []):
        if bid["use"] == "ext-platform-id":
            organization["extension"].append({
                "url": "https://smarthealthit.org/ehr-vendor-name",
                "valueString": bid["system"]
            })
        if bid["system"] in known_systems:
            organization["identifier"].append({
                "system": bid["system"],
                "value": bid["value"]
            })

    for portal_id in brand.get("portal_ids", []):
        portal = portals_content.get(portal_id, {})
        if portal:
            portal_extension = {
                "url": "http://hl7.org/fhir/StructureDefinition/organization-portal",
                "extension": []
            }
            if "name" in portal:
                portal_extension["extension"].append({"url": "portalName", "valueString": portal["name"]})
            if portal.get("portal_website"):
                portal_extension["extension"].append({"url": "portalUrl", "valueUrl": portal["portal_website"]})
            if "logo" in portal:
                portal_extension["extension"].append({"url": "portalLogo", "valueUrl": portal["logo"]})
            if "description" in portal:
                portal_extension["extension"].append({"url": "portalDescription", "valueMarkdown": portal["description"]})
            for endpoint_id in portal.get("endpoint_ids", []):
                portal_extension["extension"].append({
                    "url": "portalEndpoint",
                    "valueReference": {"reference": f"Endpoint/{endpoint_id}"}
                })
            organization["extension"].append(portal_extension)
    if not organization["telecom"]:
        del organization["telecom"]
    if not organization["address"]:
        del organization["address"]
    if not organization["extension"]:
        del organization["extension"]
    if not organization["identifier"]:
        del organization["identifier"]
    if portal.get("endpoint_ids"):
        organization["endpoint"] = [{
                    "url": "portalEndpoint",
                    "valueReference": {"reference": f"Endpoint/{endpoint_id}"}
                } for  endpoint_id in portal.get("endpoint_ids")]


    return organization

def create_endpoint(endpoint):
    endpoint_resource = {
        "resourceType": "Endpoint",
        "id": endpoint["id"],
        "status": "active",
        "connectionType": {"system": "http://terminology.hl7.org/CodeSystem/endpoint-connection-type", "code": "hl7-fhir-rest"},
        "address": endpoint.get("url"),
        "payloadType": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/endpoint-payload-type", "code": "none"}]}],
        "contact": []
    }

    if endpoint.get("name"):
        endpoint_resource["name"] = endpoint.get("name")
    if endpoint.get("registration_endpoint"):
        endpoint_resource["contact"].append({"system": "url", "value": endpoint["registration_endpoint"]})

    return endpoint_resource

def main(directory_path):
    brands_content = load_json_content(os.path.join(directory_path, 'brands.json'))
    endpoints_content = load_json_content(os.path.join(directory_path, 'endpoints.json'))
    portals_content = load_json_content(os.path.join(directory_path, 'portals.json'))

    brand_bundle = {
        "resourceType": "Bundle",
        "id": "smart-patient-access-brand-bundle-form-fasten",
        "type": "collection",
        "timestamp": "2024-02-16T00:00:00Z",
        "entry": []
    }

    for brand_id, brand in brands_content.items():
        organization = create_organization_adjusted(brand, portals_content)
        brand_bundle["entry"].append({
            "fullUrl": f"https://jmandel.github.io/pab-from-fasten/Organization/{organization['id']}",
            "resource": organization
        })

    for endpoint_id, endpoint in endpoints_content.items():
        endpoint_resource = create_endpoint(endpoint)
        brand_bundle["entry"].append({
            "fullUrl": f"https://jmandel.github.io/pab-from-fasten/Endpoint/{endpoint_resource['id']}",
            "resource": endpoint_resource})

    print(json.dumps(brand_bundle, indent=2))

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <directory_path>")
        sys.exit(1)
    main(sys.argv[1])
