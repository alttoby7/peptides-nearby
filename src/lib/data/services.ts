import { ServiceSchema, type Service } from "./schemas";
import servicesData from "./services.json";

const services: Service[] = (servicesData as unknown[]).map((s) =>
  ServiceSchema.parse(s)
);

export function getAllServices(): Service[] {
  return services;
}

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function getServiceSlugs(): string[] {
  return services.map((s) => s.slug);
}

export function getServicesWithProviders(): Service[] {
  return services.filter((s) => s.providerCount > 0);
}
