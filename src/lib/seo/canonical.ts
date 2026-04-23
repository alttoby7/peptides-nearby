/**
 * Canonical URL builder. Produces absolute www URLs for <link rel="canonical">.
 *
 * Site has no `trailingSlash` config in next.config.ts, so canonicals have no
 * trailing slash. Changing `trailingSlash` without updating this helper would
 * cause canonical/actual URL mismatch.
 */

const SITE = "https://www.peptidesnearby.com";

export function canonical(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  // Strip trailing slash except for root
  const stripped = normalized !== "/" && normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;
  return `${SITE}${stripped}`;
}

export const CANONICAL_HOST = SITE;
