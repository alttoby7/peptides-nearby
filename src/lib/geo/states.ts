/**
 * Canonical source of truth for US state identity: code, name, slug.
 *
 * All URL construction involving states MUST resolve through this module.
 * Do not call slugify() on raw state strings elsewhere in the codebase.
 *
 * The validate-build gate greps for `slugify(.*state.*)` outside this file
 * and src/lib/seo/paths.ts; direct calls cause a build failure.
 */

export type StateCode =
  | "AL" | "AK" | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "FL" | "GA"
  | "HI" | "ID" | "IL" | "IN" | "IA" | "KS" | "KY" | "LA" | "ME" | "MD"
  | "MA" | "MI" | "MN" | "MS" | "MO" | "MT" | "NE" | "NV" | "NH" | "NJ"
  | "NM" | "NY" | "NC" | "ND" | "OH" | "OK" | "OR" | "PA" | "RI" | "SC"
  | "SD" | "TN" | "TX" | "UT" | "VT" | "VA" | "WA" | "WV" | "WI" | "WY"
  | "DC" | "PR" | "VI" | "GU" | "AS" | "MP";

export interface StateRecord {
  code: StateCode;
  name: string;
  slug: string;
}

const RECORDS: StateRecord[] = [
  { code: "AL", name: "Alabama", slug: "alabama" },
  { code: "AK", name: "Alaska", slug: "alaska" },
  { code: "AZ", name: "Arizona", slug: "arizona" },
  { code: "AR", name: "Arkansas", slug: "arkansas" },
  { code: "CA", name: "California", slug: "california" },
  { code: "CO", name: "Colorado", slug: "colorado" },
  { code: "CT", name: "Connecticut", slug: "connecticut" },
  { code: "DE", name: "Delaware", slug: "delaware" },
  { code: "FL", name: "Florida", slug: "florida" },
  { code: "GA", name: "Georgia", slug: "georgia" },
  { code: "HI", name: "Hawaii", slug: "hawaii" },
  { code: "ID", name: "Idaho", slug: "idaho" },
  { code: "IL", name: "Illinois", slug: "illinois" },
  { code: "IN", name: "Indiana", slug: "indiana" },
  { code: "IA", name: "Iowa", slug: "iowa" },
  { code: "KS", name: "Kansas", slug: "kansas" },
  { code: "KY", name: "Kentucky", slug: "kentucky" },
  { code: "LA", name: "Louisiana", slug: "louisiana" },
  { code: "ME", name: "Maine", slug: "maine" },
  { code: "MD", name: "Maryland", slug: "maryland" },
  { code: "MA", name: "Massachusetts", slug: "massachusetts" },
  { code: "MI", name: "Michigan", slug: "michigan" },
  { code: "MN", name: "Minnesota", slug: "minnesota" },
  { code: "MS", name: "Mississippi", slug: "mississippi" },
  { code: "MO", name: "Missouri", slug: "missouri" },
  { code: "MT", name: "Montana", slug: "montana" },
  { code: "NE", name: "Nebraska", slug: "nebraska" },
  { code: "NV", name: "Nevada", slug: "nevada" },
  { code: "NH", name: "New Hampshire", slug: "new-hampshire" },
  { code: "NJ", name: "New Jersey", slug: "new-jersey" },
  { code: "NM", name: "New Mexico", slug: "new-mexico" },
  { code: "NY", name: "New York", slug: "new-york" },
  { code: "NC", name: "North Carolina", slug: "north-carolina" },
  { code: "ND", name: "North Dakota", slug: "north-dakota" },
  { code: "OH", name: "Ohio", slug: "ohio" },
  { code: "OK", name: "Oklahoma", slug: "oklahoma" },
  { code: "OR", name: "Oregon", slug: "oregon" },
  { code: "PA", name: "Pennsylvania", slug: "pennsylvania" },
  { code: "RI", name: "Rhode Island", slug: "rhode-island" },
  { code: "SC", name: "South Carolina", slug: "south-carolina" },
  { code: "SD", name: "South Dakota", slug: "south-dakota" },
  { code: "TN", name: "Tennessee", slug: "tennessee" },
  { code: "TX", name: "Texas", slug: "texas" },
  { code: "UT", name: "Utah", slug: "utah" },
  { code: "VT", name: "Vermont", slug: "vermont" },
  { code: "VA", name: "Virginia", slug: "virginia" },
  { code: "WA", name: "Washington", slug: "washington" },
  { code: "WV", name: "West Virginia", slug: "west-virginia" },
  { code: "WI", name: "Wisconsin", slug: "wisconsin" },
  { code: "WY", name: "Wyoming", slug: "wyoming" },
  { code: "DC", name: "District of Columbia", slug: "district-of-columbia" },
  { code: "PR", name: "Puerto Rico", slug: "puerto-rico" },
  { code: "VI", name: "U.S. Virgin Islands", slug: "us-virgin-islands" },
  { code: "GU", name: "Guam", slug: "guam" },
  { code: "AS", name: "American Samoa", slug: "american-samoa" },
  { code: "MP", name: "Northern Mariana Islands", slug: "northern-mariana-islands" },
];

export const STATE_CODES: readonly StateCode[] = RECORDS.map((r) => r.code);

export const STATE_CODE_TO_NAME: Record<StateCode, string> = Object.freeze(
  Object.fromEntries(RECORDS.map((r) => [r.code, r.name])) as Record<StateCode, string>
);

export const STATE_NAME_TO_SLUG: Record<string, string> = Object.freeze(
  Object.fromEntries(RECORDS.map((r) => [r.name.toLowerCase(), r.slug]))
);

export const STATE_SLUG_TO_CODE: Record<string, StateCode> = Object.freeze(
  Object.fromEntries(RECORDS.map((r) => [r.slug, r.code])) as Record<string, StateCode>
);

const CODE_SET = new Set<string>(RECORDS.map((r) => r.code));
const NAME_LOWER_TO_CODE = new Map<string, StateCode>(
  RECORDS.map((r) => [r.name.toLowerCase(), r.code])
);
const SLUG_TO_CODE = new Map<string, StateCode>(
  RECORDS.map((r) => [r.slug, r.code])
);

/**
 * Resolve any state representation (code, name, or slug) to the canonical slug.
 * Returns null if the input can't be mapped — callers should treat that as a
 * data-quality failure and log/exclude the record.
 */
export function stateSlugFromAny(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Try code first (uppercase, 2-letter)
  const upper = trimmed.toUpperCase();
  if (CODE_SET.has(upper)) {
    return RECORDS.find((r) => r.code === upper)!.slug;
  }

  // Try exact name match (case-insensitive)
  const lower = trimmed.toLowerCase();
  const byName = NAME_LOWER_TO_CODE.get(lower);
  if (byName) {
    return RECORDS.find((r) => r.code === byName)!.slug;
  }

  // Try slug match (e.g. "new-york", "district-of-columbia")
  const slugified = lower.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (SLUG_TO_CODE.has(slugified)) {
    return slugified;
  }

  return null;
}

export function stateCodeFromAny(raw: string | null | undefined): StateCode | null {
  const slug = stateSlugFromAny(raw);
  if (!slug) return null;
  return SLUG_TO_CODE.get(slug) ?? null;
}

export function stateNameFromAny(raw: string | null | undefined): string | null {
  const code = stateCodeFromAny(raw);
  if (!code) return null;
  return STATE_CODE_TO_NAME[code];
}

export function isValidStateCode(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return CODE_SET.has(raw.trim().toUpperCase());
}
