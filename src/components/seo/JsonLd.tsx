import type { Provider } from "@/lib/data/schemas";

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Peptides Nearby",
    url: "https://peptidesnearby.com",
    description:
      "Find peptide therapy clinics, compounding pharmacies, and wellness centers near you.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://peptidesnearby.com/states",
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function medicalBusinessJsonLd(provider: Provider) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type":
      provider.type === "pharmacy" ? "Pharmacy" : "MedicalBusiness",
    name: provider.name,
    description: provider.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: provider.address.street,
      addressLocality: provider.address.city,
      addressRegion: provider.address.stateCode,
      postalCode: provider.address.zip,
      addressCountry: "US",
    },
  };

  if (provider.phone) schema.telephone = provider.phone;
  if (provider.website) schema.url = provider.website;
  if (provider.address.lat && provider.address.lng) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: provider.address.lat,
      longitude: provider.address.lng,
    };
  }

  return schema;
}

export function itemListJsonLd(
  items: { name: string; url: string }[],
  listName: string,
  description: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
