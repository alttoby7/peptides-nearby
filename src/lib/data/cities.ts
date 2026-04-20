import { CitySchema, type City } from "./schemas";
import citiesData from "./cities.json";

const cities: City[] = (citiesData as unknown[]).map((c) =>
  CitySchema.parse(c)
);

export function getAllCities(): City[] {
  return cities;
}

export function getCityBySlug(slug: string, stateCode: string): City | undefined {
  return cities.find((c) => c.slug === slug && c.stateCode === stateCode);
}

export function getCityBySlugAndStateSlug(citySlug: string, stateSlug: string): City | undefined {
  return cities.find((c) => c.slug === citySlug && c.stateSlug === stateSlug);
}

export function getCitiesByState(stateCode: string): City[] {
  return cities.filter((c) => c.stateCode === stateCode);
}

export function getCitiesByStateSlug(stateSlug: string): City[] {
  return cities.filter((c) => c.stateSlug === stateSlug);
}

export function getTopCities(count = 10): City[] {
  return [...cities]
    .sort((a, b) => b.providerCount - a.providerCount)
    .slice(0, count);
}

export function getCitiesWithProviders(): City[] {
  return cities.filter((c) => c.providerCount > 0);
}
