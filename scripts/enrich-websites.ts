/**
 * Enrich providers with website URLs from Google Places API
 *
 * Fetches Place Details for each provider to get websiteUri,
 * then updates the Supabase providers table.
 *
 * Usage:
 *   npx tsx scripts/enrich-websites.ts              # Fetch all
 *   npx tsx scripts/enrich-websites.ts --limit 50   # First 50
 *   npx tsx scripts/enrich-websites.ts --dry-run    # Preview
 *
 * Environment:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_PLACES_API_KEY
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY || !PLACES_KEY) {
  console.error("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or GOOGLE_PLACES_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface ProviderWithPlaceId {
  providerId: string;
  slug: string;
  placeId: string;
}

async function fetchProvidersNeedingWebsites(): Promise<ProviderWithPlaceId[]> {
  // Get providers without websites
  const providerMap = new Map<string, { slug: string }>();
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from("providers")
      .select("id,slug,website")
      .or("website.is.null,website.eq.")
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    for (const row of data) providerMap.set(row.id, { slug: row.slug });
    if (data.length < 1000) break;
    offset += 1000;
  }

  // Get Place IDs from submissions
  const results: ProviderWithPlaceId[] = [];
  offset = 0;
  while (true) {
    const { data } = await supabase
      .from("provider_submissions")
      .select("canonical_provider_id,raw_payload")
      .eq("status", "merged")
      .not("canonical_provider_id", "is", null)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    for (const row of data) {
      const payload = row.raw_payload as { source?: string; sourceId?: string };
      if (
        payload?.source === "google-places" &&
        payload?.sourceId?.startsWith("ChI") &&
        providerMap.has(row.canonical_provider_id)
      ) {
        const provider = providerMap.get(row.canonical_provider_id)!;
        results.push({
          providerId: row.canonical_provider_id,
          slug: provider.slug,
          placeId: payload.sourceId,
        });
      }
    }
    if (data.length < 1000) break;
    offset += 1000;
  }

  return results;
}

async function fetchPlaceWebsite(placeId: string): Promise<{ website?: string; phone?: string }> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": PLACES_KEY,
      "X-Goog-FieldMask": "websiteUri,nationalPhoneNumber",
    },
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("RATE_LIMITED");
    return {};
  }

  const data = await res.json();
  return {
    website: data.websiteUri || undefined,
    phone: data.nationalPhoneNumber || undefined,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;

  console.log("Fetching providers without websites...");
  let providers = await fetchProvidersNeedingWebsites();
  console.log(`Found ${providers.length} providers needing websites`);

  if (limit < providers.length) {
    providers = providers.slice(0, limit);
    console.log(`Limited to ${limit}`);
  }

  let withWebsite = 0;
  let withPhone = 0;
  let errors = 0;
  let rateLimited = 0;

  console.log(`\nFetching from Places API (${dryRun ? "DRY RUN" : "LIVE"})...\n`);

  // Process with concurrency
  let index = 0;
  async function worker() {
    while (index < providers.length) {
      const i = index++;
      const provider = providers[i];
      try {
        const details = await fetchPlaceWebsite(provider.placeId);

        if (details.website || details.phone) {
          const updates: Record<string, string> = {};
          if (details.website) {
            updates.website = details.website;
            withWebsite++;
          }
          if (details.phone) {
            updates.phone = details.phone;
            withPhone++;
          }

          if (!dryRun) {
            await supabase
              .from("providers")
              .update(updates)
              .eq("id", provider.providerId);
          }
        }

        if ((i + 1) % 200 === 0) {
          console.log(
            `  Progress: ${i + 1}/${providers.length} — ${withWebsite} websites, ${withPhone} phones (${errors} errors)`
          );
        }

        await new Promise((r) => setTimeout(r, 50));
      } catch (err: any) {
        if (err.message === "RATE_LIMITED") {
          rateLimited++;
          index--; // retry
          await new Promise((r) => setTimeout(r, 2000));
        } else {
          errors++;
        }
      }
    }
  }

  await Promise.all(Array.from({ length: 5 }, () => worker()));

  console.log(`\n=== COMPLETE ===`);
  console.log(`  Websites found: ${withWebsite}`);
  console.log(`  Phones found:   ${withPhone}`);
  console.log(`  Errors:         ${errors}`);
  console.log(`  Rate limited:   ${rateLimited}`);
  if (dryRun) console.log(`  (DRY RUN — nothing saved)`);
  else console.log(`\nNext: run export, then scan-insurance.py, then rebuild.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
