import { StateSchema, type State } from "./schemas";
import statesData from "./states.json";

const states: State[] = (statesData as unknown[]).map((s) =>
  StateSchema.parse(s)
);

export function getAllStates(): State[] {
  return states;
}

export function getStateBySlug(slug: string): State | undefined {
  return states.find((s) => s.slug === slug);
}

export function getStateByCode(code: string): State | undefined {
  return states.find((s) => s.code === code);
}

export function getStateSlugs(): string[] {
  return states.map((s) => s.slug);
}

export function getStatesWithProviders(): State[] {
  return states.filter((s) => s.providerCount > 0);
}
