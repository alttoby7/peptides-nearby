/**
 * Automated Provider Discovery Pipeline
 *
 * Sources:
 * 1. NPPES NPI Registry (free, public) — search for providers by taxonomy
 * 2. Google Places API (paid) — search for peptide clinics by location
 *
 * Output: Candidates inserted into Supabase as status: "pending" for editorial review.
 * This script NEVER auto-publishes. All candidates go through manual review.
 *
 * Usage:
 *   npx tsx scripts/discover-providers.ts --source npi --state TX
 *   npx tsx scripts/discover-providers.ts --source places --city "Austin, TX"
 *   npx tsx scripts/discover-providers.ts --source npi --all-states
 *
 * Environment:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — required
 *   GOOGLE_PLACES_API_KEY — required for --source places
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// NPPES taxonomy codes for relevant provider types
const TAXONOMY_CODES = [
  "207RE0101X", // Endocrinology
  "208000000X", // Pediatrics (some do peptide therapy)
  "207RR0500X", // Rheumatology
  "261QP0905X", // Pharmacy — Compounding
  "333600000X", // Pharmacy
  "207Q00000X", // Family Medicine
  "207R00000X", // Internal Medicine
  "174400000X", // Naturopathic Medicine
  "175F00000X", // Naturopathic Physician
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

interface DiscoveredProvider {
  name: string;
  type: "clinic" | "pharmacy" | "wellness-center";
  city: string;
  state: string;
  address: string;
  phone: string;
  website: string;
  source: string;
  sourceId: string;
}

// ─── NPPES NPI Registry ───────────────────────────────────

async function searchNPPES(stateCode: string): Promise<DiscoveredProvider[]> {
  const results: DiscoveredProvider[] = [];

  for (const taxonomy of TAXONOMY_CODES) {
    const url = new URL("https://npiregistry.cms.hhs.gov/api/");
    url.searchParams.set("version", "2.1");
    url.searchParams.set("taxonomy_description", "");
    url.searchParams.set("state", stateCode);
    url.searchParams.set("limit", "200");
    url.searchParams.set("enumeration_type", "NPI-2"); // Organizations only
    url.searchParams.set("taxonomy_code", taxonomy);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) continue;

      const data = await res.json();
      if (!data.results) continue;

      for (const npi of data.results) {
        const addr = npi.addresses?.find((a: { address_purpose: string }) => a.address_purpose === "LOCATION") || npi.addresses?.[0];
        if (!addr) continue;

        const orgName = npi.basic?.organization_name || npi.basic?.name || "";
        if (!orgName) continue;

        // Check if name suggests peptide/compounding relevance
        const nameLower = orgName.toLowerCase();
        const isRelevant =
          nameLower.includes("peptide") ||
          nameLower.includes("compound") ||
          nameLower.includes("wellness") ||
          nameLower.includes("regenerative") ||
          nameLower.includes("anti-aging") ||
          nameLower.includes("hormone") ||
          nameLower.includes("functional") ||
          nameLower.includes("integrative") ||
          nameLower.includes("medspa") ||
          nameLower.includes("med spa") ||
          taxonomy.startsWith("261QP"); // Compounding pharmacy

        if (!isRelevant) continue;

        const isPharmacy = taxonomy.startsWith("261Q") || taxonomy.startsWith("3336");
        const type = isPharmacy ? "pharmacy" as const : "clinic" as const;

        results.push({
          name: orgName,
          type,
          city: addr.city || "",
          state: addr.state || stateCode,
          address: `${addr.address_1 || ""} ${addr.address_2 || ""}`.trim(),
          phone: addr.telephone_number || "",
          website: "",
          source: "nppes",
          sourceId: npi.number?.toString() || "",
        });
      }
    } catch (err) {
      console.error(`NPPES error for ${stateCode}/${taxonomy}:`, err);
    }

    // Rate limit: NPPES allows ~20 req/sec
    await new Promise((r) => setTimeout(r, 100));
  }

  return results;
}

// ─── Google Places API ────────────────────────────────────

async function searchPlaces(location: string): Promise<DiscoveredProvider[]> {
  if (!GOOGLE_PLACES_KEY) {
    console.error("Missing GOOGLE_PLACES_API_KEY for Places search");
    return [];
  }

  const queries = [
    "peptide therapy clinic",
    "compounding pharmacy",
    "peptide wellness center",
    "regenerative medicine clinic",
    "hormone therapy clinic",
  ];

  const results: DiscoveredProvider[] = [];
  const seenPlaceIds = new Set<string>();

  for (const query of queries) {
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
      url.searchParams.set("query", `${query} in ${location}`);
      url.searchParams.set("key", GOOGLE_PLACES_KEY);

      const res = await fetch(url.toString());
      if (!res.ok) continue;

      const data = await res.json();
      if (!data.results) continue;

      for (const place of data.results) {
        if (seenPlaceIds.has(place.place_id)) continue;
        seenPlaceIds.add(place.place_id);

        const nameLower = (place.name || "").toLowerCase();
        const typesStr = (place.types || []).join(" ");

        let type: "clinic" | "pharmacy" | "wellness-center" = "clinic";
        if (typesStr.includes("pharmacy") || nameLower.includes("pharmacy") || nameLower.includes("compound")) {
          type = "pharmacy";
        } else if (nameLower.includes("wellness") || nameLower.includes("spa") || nameLower.includes("medspa")) {
          type = "wellness-center";
        }

        // Extract city/state from formatted_address
        const parts = (place.formatted_address || "").split(",").map((s: string) => s.trim());
        const city = parts[1] || "";
        const stateZip = parts[2] || "";
        const state = stateZip.split(" ")[0] || "";

        results.push({
          name: place.name || "",
          type,
          city,
          state,
          address: parts[0] || "",
          phone: "",
          website: "",
          source: "google-places",
          sourceId: place.place_id || "",
        });
      }
    } catch (err) {
      console.error(`Places error for "${query}" in ${location}:`, err);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  return results;
}

// ─── Dedup & Insert ───────────────────────────────────────

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function insertCandidates(candidates: DiscoveredProvider[]): Promise<number> {
  // Fetch existing slugs to avoid duplicates
  const { data: existing } = await supabase
    .from("providers")
    .select("slug, name");

  const existingSlugs = new Set((existing || []).map((p) => p.slug));
  const existingNames = new Set((existing || []).map((p) => p.name.toLowerCase()));

  // Also check pending submissions
  const { data: pendingSubs } = await supabase
    .from("provider_submissions")
    .select("name")
    .in("status", ["new", "reviewing"]);

  const pendingNames = new Set((pendingSubs || []).map((p) => p.name.toLowerCase()));

  let inserted = 0;

  for (const candidate of candidates) {
    const slug = slugify(candidate.name);
    const nameLower = candidate.name.toLowerCase();

    // Skip if already exists
    if (existingSlugs.has(slug) || existingNames.has(nameLower) || pendingNames.has(nameLower)) {
      continue;
    }

    const { error } = await supabase.from("provider_submissions").insert({
      name: candidate.name,
      type: candidate.type,
      city: candidate.city,
      state: candidate.state,
      address: candidate.address,
      phone: candidate.phone,
      website: candidate.website,
      services: "",
      status: "new",
      raw_payload: {
        source: candidate.source,
        sourceId: candidate.sourceId,
        discoveredAt: new Date().toISOString(),
        automated: true,
      },
    });

    if (error) {
      console.error(`Insert error for ${candidate.name}:`, error.message);
    } else {
      inserted++;
      existingNames.add(nameLower);
    }
  }

  return inserted;
}

// ─── CLI ──────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const sourceIdx = args.indexOf("--source");
  const stateIdx = args.indexOf("--state");
  const cityIdx = args.indexOf("--city");
  const allStates = args.includes("--all-states");

  const source = sourceIdx >= 0 ? args[sourceIdx + 1] : "npi";

  let candidates: DiscoveredProvider[] = [];

  if (source === "npi") {
    if (allStates) {
      for (const st of US_STATES) {
        console.log(`Searching NPPES for ${st}...`);
        const found = await searchNPPES(st);
        console.log(`  Found ${found.length} candidates`);
        candidates.push(...found);
      }
    } else {
      const state = stateIdx >= 0 ? args[stateIdx + 1] : "TX";
      console.log(`Searching NPPES for ${state}...`);
      candidates = await searchNPPES(state);
    }
  } else if (source === "places") {
    const city = cityIdx >= 0 ? args[cityIdx + 1] : "Austin, TX";
    console.log(`Searching Google Places for "${city}"...`);
    candidates = await searchPlaces(city);
  } else {
    console.error(`Unknown source: ${source}. Use "npi" or "places".`);
    process.exit(1);
  }

  console.log(`\nTotal candidates: ${candidates.length}`);

  if (candidates.length > 0) {
    const inserted = await insertCandidates(candidates);
    console.log(`Inserted ${inserted} new candidates (${candidates.length - inserted} duplicates skipped)`);
  }
}

main().catch(console.error);
