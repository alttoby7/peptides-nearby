/**
 * Batch geocode providers that have no lat/lng in their address.
 *
 * Uses Google Places Text Search API (same key as GOOGLE_PLACES_API_KEY).
 * Reads/writes data/raw/providers.json directly.
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=... npx tsx scripts/geocode-providers.ts
 *
 * Options:
 *   --dry-run        Show what would be geocoded without making API calls
 *   --limit N        Only geocode the first N providers (for testing)
 *   --city-fallback  Re-attempt failed providers with city-level geocoding
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const PROVIDERS_PATH = resolve(ROOT, "data/raw/providers.json");
const FAILURES_PATH = resolve(ROOT, "data/geocoding-failures.json");

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error("Missing GOOGLE_PLACES_API_KEY");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const CITY_FALLBACK = process.argv.includes("--city-fallback");
const limitIdx = process.argv.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1], 10) : Infinity;

const RATE_LIMIT_MS = 50; // ~20 QPS to be conservative with Places API

const VALID_STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC","PR","VI","GU","AS","MP",
]);

interface Address {
  street: string;
  city: string;
  state: string;
  stateCode: string;
  zip: string;
  lat?: number;
  lng?: number;
}

interface Provider {
  slug: string;
  name: string;
  address: Address;
  [key: string]: unknown;
}

interface PlacesResponse {
  places?: Array<{
    location: { latitude: number; longitude: number };
  }>;
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask": "places.location",
    },
    body: JSON.stringify({ textQuery: query }),
  });

  if (!res.ok) {
    console.error(`  HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return null;
  }

  const data = (await res.json()) as PlacesResponse;

  if (!data.places || data.places.length === 0) {
    return null;
  }

  return {
    lat: data.places[0].location.latitude,
    lng: data.places[0].location.longitude,
  };
}

function buildAddressString(addr: Address, cityOnly: boolean): string {
  if (cityOnly) {
    return `${addr.city}, ${addr.stateCode}`;
  }
  const parts: string[] = [];
  const street = addr.street.trim();
  const isRealStreet = /^\d/.test(street) || /\b(st|ave|blvd|rd|dr|ln|way|ct|pl|pkwy|hwy)\b/i.test(street);
  if (isRealStreet && street.length > 3) {
    parts.push(street);
  }
  parts.push(addr.city);
  parts.push(addr.stateCode);
  if (addr.zip && addr.zip.length >= 5) {
    parts.push(addr.zip);
  }
  return parts.join(", ");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const providers: Provider[] = JSON.parse(readFileSync(PROVIDERS_PATH, "utf-8"));
  const needsGeocoding = providers.filter(
    (p) => (p.address.lat == null || p.address.lng == null) && VALID_STATE_CODES.has(p.address.stateCode)
  );
  const skippedInvalidState = providers.filter(
    (p) => (p.address.lat == null || p.address.lng == null) && !VALID_STATE_CODES.has(p.address.stateCode)
  ).length;
  const toProcess = needsGeocoding.slice(0, LIMIT);

  console.log(`Total providers: ${providers.length}`);
  console.log(`Need geocoding: ${needsGeocoding.length}`);
  console.log(`Skipped (invalid state code): ${skippedInvalidState}`);
  console.log(`Will process: ${toProcess.length}${DRY_RUN ? " (dry run)" : ""}`);

  if (DRY_RUN) {
    for (const p of toProcess.slice(0, 20)) {
      console.log(`  ${p.slug}: ${buildAddressString(p.address, false)}`);
    }
    if (toProcess.length > 20) console.log(`  ... and ${toProcess.length - 20} more`);
    return;
  }

  const failures: Array<{ slug: string; address: string; reason: string }> = [];
  let success = 0;
  let cityFallbackCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const p = toProcess[i];
    const addressStr = buildAddressString(p.address, false);

    if ((i + 1) % 100 === 0 || i === 0) {
      console.log(`[${i + 1}/${toProcess.length}] Geocoding... (${success} success so far)`);
    }

    let result = await geocode(addressStr);

    if (!result && CITY_FALLBACK) {
      const cityStr = buildAddressString(p.address, true);
      result = await geocode(cityStr);
      if (result) cityFallbackCount++;
    }

    if (result) {
      const original = providers.find((op) => op.slug === p.slug);
      if (original) {
        original.address.lat = result.lat;
        original.address.lng = result.lng;
      }
      success++;
    } else {
      failures.push({ slug: p.slug, address: addressStr, reason: "geocoding_failed" });
    }

    await sleep(RATE_LIMIT_MS);

    // Save progress every 500 providers
    if ((i + 1) % 500 === 0) {
      writeFileSync(PROVIDERS_PATH, JSON.stringify(providers, null, 2) + "\n");
      console.log(`  [checkpoint] Saved progress at ${i + 1}/${toProcess.length}`);
    }
  }

  writeFileSync(PROVIDERS_PATH, JSON.stringify(providers, null, 2) + "\n");
  console.log(`\nUpdated ${PROVIDERS_PATH}`);

  if (failures.length > 0) {
    writeFileSync(FAILURES_PATH, JSON.stringify(failures, null, 2) + "\n");
    console.log(`Wrote ${failures.length} failures to ${FAILURES_PATH}`);
  }

  console.log(`\n--- Geocoding Summary ---`);
  console.log(`Success: ${success}/${toProcess.length} (${((success / toProcess.length) * 100).toFixed(1)}%)`);
  if (cityFallbackCount > 0) console.log(`City-level fallback: ${cityFallbackCount}`);
  console.log(`Failures: ${failures.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
