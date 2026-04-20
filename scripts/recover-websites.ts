#!/usr/bin/env npx tsx
/**
 * Recover website URLs for providers using Google Places API.
 * Works against local providers.json (no Supabase needed).
 *
 * Uses Places Text Search to find matching businesses by name + city,
 * then fetches Place Details for the website URL.
 *
 * Usage:
 *   npx tsx scripts/recover-websites.ts --batch data/recovery-batches/tier-a.json
 *   npx tsx scripts/recover-websites.ts --batch data/recovery-batches/tier-a.json --limit 50
 *   npx tsx scripts/recover-websites.ts --batch data/recovery-batches/tier-a.json --dry-run
 *
 * Environment:
 *   GOOGLE_PLACES_API_KEY — required
 */
import fs from "fs";

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!PLACES_KEY) {
  console.error("Missing GOOGLE_PLACES_API_KEY");
  process.exit(1);
}

interface Provider {
  slug: string;
  name: string;
  type: string;
  address: { street: string; city: string; state: string; stateCode: string; zip: string };
  phone: string;
  website: string;
  googleMapsUrl: string;
  [key: string]: unknown;
}

interface RecoveryResult {
  slug: string;
  website: string | null;
  placeId: string | null;
  googleMapsUrl: string | null;
  phone: string | null;
  confidence: "high" | "medium" | "low";
  matchedName: string;
}

function normalizeForCompare(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (na === nb) return 1.0;
  if (na.includes(nb) || nb.includes(na)) return 0.8;

  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const intersection = [...wordsA].filter((w) => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.length / union.size;
}

async function findPlace(name: string, city: string, state: string): Promise<RecoveryResult | null> {
  const query = `${name} ${city} ${state}`;

  // Use Places API (New) Text Search
  const url = "https://places.googleapis.com/v1/places:searchText";
  const body = {
    textQuery: query,
    maxResultCount: 3,
    languageCode: "en",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_KEY!,
      "X-Goog-FieldMask": "places.displayName,places.websiteUri,places.id,places.formattedAddress,places.nationalPhoneNumber,places.googleMapsUri",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  Places API error: ${res.status} ${err.slice(0, 200)}`);
    return null;
  }

  const data = await res.json();
  if (!data.places || data.places.length === 0) return null;

  // Find best match by name similarity
  let bestMatch: any = null;
  let bestSim = 0;

  for (const place of data.places) {
    const placeName = place.displayName?.text || "";
    const sim = nameSimilarity(name, placeName);
    if (sim > bestSim) {
      bestSim = sim;
      bestMatch = place;
    }
  }

  if (!bestMatch || bestSim < 0.4) return null;

  const confidence = bestSim >= 0.8 ? "high" : bestSim >= 0.6 ? "medium" : "low";

  return {
    slug: "",
    website: bestMatch.websiteUri || null,
    placeId: bestMatch.id || null,
    googleMapsUrl: bestMatch.googleMapsUri || null,
    phone: bestMatch.nationalPhoneNumber || null,
    confidence,
    matchedName: bestMatch.displayName?.text || "",
  };
}

async function main() {
  const args = process.argv.slice(2);
  const batchArg = args.find((a) => a.startsWith("--batch="))?.split("=")[1]
    || args[args.indexOf("--batch") + 1];
  const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1]
    || (args.includes("--limit") ? args[args.indexOf("--limit") + 1] : null);
  const dryRun = args.includes("--dry-run");

  if (!batchArg) {
    console.error("Usage: npx tsx scripts/recover-websites.ts --batch <file> [--limit N] [--dry-run]");
    process.exit(1);
  }

  const batchSlugs: string[] = JSON.parse(fs.readFileSync(batchArg, "utf8"));
  const providers: Provider[] = JSON.parse(fs.readFileSync("data/raw/providers.json", "utf8"));
  const provMap = new Map(providers.map((p) => [p.slug, p]));

  const limit = limitArg ? parseInt(limitArg) : batchSlugs.length;
  const toProcess = batchSlugs.slice(0, limit);

  const resultsFile = batchArg.replace(".json", "-results.json");
  const existing: Record<string, RecoveryResult> = fs.existsSync(resultsFile)
    ? JSON.parse(fs.readFileSync(resultsFile, "utf8"))
    : {};

  let recovered = 0;
  let processed = 0;
  let skipped = 0;

  console.log(`Processing ${toProcess.length} providers (dry-run: ${dryRun})`);
  console.log(`Resuming from ${Object.keys(existing).length} existing results\n`);

  for (const slug of toProcess) {
    if (existing[slug]) { skipped++; continue; }

    const provider = provMap.get(slug);
    if (!provider) { existing[slug] = { slug, website: null, placeId: null, googleMapsUrl: null, phone: null, confidence: "low", matchedName: "" }; continue; }
    if (provider.website && provider.website.startsWith("http")) { skipped++; continue; }

    try {
      const result = await findPlace(
        provider.name,
        provider.address.city,
        provider.address.stateCode
      );

      if (result && result.website) {
        result.slug = slug;
        existing[slug] = result;
        recovered++;
        console.log(`✓ [${result.confidence}] ${provider.name} → ${result.website}`);
      } else {
        existing[slug] = { slug, website: null, placeId: result?.placeId || null, googleMapsUrl: result?.googleMapsUrl || null, phone: result?.phone || null, confidence: "low", matchedName: result?.matchedName || "" };
        process.stdout.write(".");
      }
    } catch (err: any) {
      console.error(`\n  Error: ${slug}: ${err.message}`);
      existing[slug] = { slug, website: null, placeId: null, googleMapsUrl: null, phone: null, confidence: "low", matchedName: "" };
    }

    processed++;

    // Checkpoint every 20
    if (processed % 20 === 0) {
      fs.writeFileSync(resultsFile, JSON.stringify(existing, null, 2));
      console.log(`\n  [${processed}/${toProcess.length}] checkpoint — ${recovered} websites recovered`);
    }

    // Rate limit: ~5 requests/sec
    await new Promise((r) => setTimeout(r, 200));
  }

  fs.writeFileSync(resultsFile, JSON.stringify(existing, null, 2));

  console.log(`\n\nDone: ${processed} processed, ${recovered} websites recovered, ${skipped} skipped`);
  console.log(`Results: ${resultsFile}`);

  // Apply results to providers.json if not dry-run
  if (!dryRun && recovered > 0) {
    let updated = 0;
    for (const [slug, result] of Object.entries(existing)) {
      if (!result.website || result.confidence === "low") continue;
      const provider = provMap.get(slug);
      if (!provider) continue;
      if (provider.website && provider.website.startsWith("http")) continue;

      provider.website = result.website;
      if (result.googleMapsUrl && !provider.googleMapsUrl) {
        provider.googleMapsUrl = result.googleMapsUrl;
      }
      if (result.phone && !provider.phone) {
        provider.phone = result.phone;
      }
      updated++;
    }

    if (updated > 0) {
      fs.writeFileSync("data/raw/providers.json", JSON.stringify(providers, null, 2));
      console.log(`Updated ${updated} providers in providers.json (high/medium confidence only)`);
    }
  }
}

main().catch(console.error);
