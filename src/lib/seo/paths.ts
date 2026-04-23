/**
 * Canonical URL path builders.
 *
 * Every state/city/telehealth URL construction MUST go through this module.
 * Direct `slugify(state)` calls elsewhere are banned by the validate-build gate.
 *
 * All paths returned here are root-relative (no host). Use canonical() from
 * ./canonical.ts when you need the full www-prefixed URL.
 */

import { stateSlugFromAny } from "@/lib/geo/states";

function slugifyCity(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** /alabama — null if state unresolvable */
export function stateUrl(stateRaw: string | null | undefined): string | null {
  const slug = stateSlugFromAny(stateRaw);
  if (!slug) return null;
  return `/${slug}`;
}

/** /alabama/birmingham — null if state unresolvable */
export function cityUrl(
  stateRaw: string | null | undefined,
  cityRawOrSlug: string
): string | null {
  const stateSlug = stateSlugFromAny(stateRaw);
  if (!stateSlug) return null;
  const citySlug = cityRawOrSlug.includes(" ")
    ? slugifyCity(cityRawOrSlug)
    : cityRawOrSlug.toLowerCase();
  return `/${stateSlug}/${citySlug}`;
}

/** /telehealth/alabama — null if state unresolvable */
export function telehealthStateUrl(stateRaw: string | null | undefined): string | null {
  const slug = stateSlugFromAny(stateRaw);
  if (!slug) return null;
  return `/telehealth/${slug}`;
}

/** /telehealth/peptides/bpc-157 */
export function telehealthPeptideUrl(peptideSlug: string): string {
  return `/telehealth/peptides/${peptideSlug}`;
}

/** /providers/example-clinic */
export function providerUrl(providerSlug: string): string {
  return `/providers/${providerSlug}`;
}

/** /providers/example-clinic/claim (noindex, internal-only) */
export function providerClaimUrl(providerSlug: string): string {
  return `/providers/${providerSlug}/claim`;
}

/** /peptides/bpc-157 */
export function peptideUrl(peptideSlug: string): string {
  return `/peptides/${peptideSlug}`;
}

/** /goals/weight-loss */
export function goalUrl(goalSlug: string): string {
  return `/goals/${goalSlug}`;
}

/** /blog/article-slug */
export function blogPostUrl(postSlug: string): string {
  return `/blog/${postSlug}`;
}

// Static route constants (single source of truth for canonical paths)
export const STATIC_ROUTES = {
  home: "/",
  states: "/states",
  clinics: "/clinics",
  pharmacies: "/pharmacies",
  wellnessCenters: "/wellness-centers",
  blog: "/blog",
  telehealth: "/telehealth",
  compare: "/compare",
  search: "/search",
  about: "/about",
  privacy: "/privacy",
  terms: "/terms",
  submit: "/submit",
  map: "/map",
} as const;
