/**
 * The initial listing-review scope is deliberately limited to the three
 * Scottsdale practices selected for the proof-first pilot. Keeping this list
 * explicit prevents a trust copy experiment from silently expanding across
 * the directory.
 */
const SCOTTSDALE_FOUNDING_PROFILE_SLUGS = new Set([
  "re-wellness-scottsdale-az",
  "natural-radiance-med-spa-llc-scottsdale-az",
  "4ever-young-med-spa-and-wellness-center-scottsdale-scottsdale-az",
]);

export function isScottsdaleFoundingProfile(slug: string): boolean {
  return SCOTTSDALE_FOUNDING_PROFILE_SLUGS.has(slug);
}
