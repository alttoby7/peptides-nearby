import { ProviderSchema, type Provider } from "./schemas";
import providersData from "./providers.json";

const providers: Provider[] = (providersData as unknown[]).map((p) =>
  ProviderSchema.parse(p)
);

export function getAllProviders(): Provider[] {
  return providers;
}

export function getProviderBySlug(slug: string): Provider | undefined {
  return providers.find((p) => p.slug === slug);
}

export function getProvidersByCity(citySlug: string, stateCode: string): Provider[] {
  return providers.filter(
    (p) =>
      p.address.city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === citySlug &&
      p.address.stateCode === stateCode
  );
}

export function getProvidersByState(stateCode: string): Provider[] {
  return providers.filter((p) => p.address.stateCode === stateCode);
}

export function getProvidersByType(type: Provider["type"]): Provider[] {
  return providers.filter((p) => p.type === type);
}

export function getProvidersByService(serviceSlug: string): Provider[] {
  return providers.filter((p) =>
    [...p.services, ...p.peptides].some(
      (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === serviceSlug
    )
  );
}

export function getProviderSlugs(): string[] {
  // Must return at least one slug for Next.js static export
  const slugs = providers.map((p) => p.slug);
  return slugs.length > 0 ? slugs : ["_placeholder"];
}

export function getFeaturedProviders(): Provider[] {
  return providers.filter((p) => p.featured);
}
