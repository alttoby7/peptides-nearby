/**
 * Fetch Google Reviews for all providers with Place IDs
 *
 * Uses Google Places API (New) Place Details to fetch up to 5 reviews per provider.
 * Inserts reviews into Supabase `provider_reviews` table.
 *
 * Usage:
 *   npx tsx scripts/fetch-google-reviews.ts              # Fetch all
 *   npx tsx scripts/fetch-google-reviews.ts --limit 50   # Fetch first 50
 *   npx tsx scripts/fetch-google-reviews.ts --dry-run    # Preview without inserting
 *
 * Environment:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_PLACES_API_KEY — required
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!PLACES_KEY) {
  console.error("Missing GOOGLE_PLACES_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Types ---
interface PlaceReview {
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
  rating?: number;
  text?: { text?: string; languageCode?: string };
  originalText?: { text?: string; languageCode?: string };
  publishTime?: string;
  relativePublishTimeDescription?: string;
}

interface ProviderWithPlaceId {
  providerId: string;
  providerSlug: string;
  placeId: string;
}

// --- Fetch providers with place IDs ---
async function fetchProvidersWithPlaceIds(): Promise<ProviderWithPlaceId[]> {
  // Get all merged submissions with place IDs (links to provider via canonical_provider_id)
  const all: ProviderWithPlaceId[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("provider_submissions")
      .select("canonical_provider_id, raw_payload")
      .eq("status", "merged")
      .not("canonical_provider_id", "is", null)
      .range(offset, offset + 999);

    if (error) {
      console.error("Fetch error:", error.message);
      break;
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      const payload = row.raw_payload as { source?: string; sourceId?: string };
      if (payload?.source === "google-places" && payload?.sourceId?.startsWith("ChI")) {
        all.push({
          providerId: row.canonical_provider_id,
          providerSlug: "", // will fill from providers table
          placeId: payload.sourceId,
        });
      }
    }

    if (data.length < 1000) break;
    offset += 1000;
  }

  // Fetch slug map
  const slugMap = new Map<string, string>();
  offset = 0;
  while (true) {
    const { data } = await supabase
      .from("providers")
      .select("id, slug")
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    for (const row of data) slugMap.set(row.id, row.slug);
    if (data.length < 1000) break;
    offset += 1000;
  }

  for (const p of all) {
    p.providerSlug = slugMap.get(p.providerId) || "";
  }

  return all.filter((p) => p.providerSlug);
}

// --- Fetch existing reviews to avoid duplicates ---
async function fetchExistingReviewProviderIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from("provider_reviews")
      .select("provider_id")
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    for (const row of data) ids.add(row.provider_id);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return ids;
}

// --- Fetch reviews from Google Places API ---
interface PlaceDetailsResult {
  reviews: PlaceReview[];
  rating?: number;
  userRatingCount?: number;
}

async function fetchPlaceDetails(placeId: string): Promise<PlaceDetailsResult> {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": PLACES_KEY,
      "X-Goog-FieldMask": "reviews,rating,userRatingCount",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("RATE_LIMITED");
    throw new Error(`Places API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    reviews: (data.reviews || []) as PlaceReview[],
    rating: data.rating,
    userRatingCount: data.userRatingCount,
  };
}

// --- Rate-limited concurrency ---
async function processWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  delayMs: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      const result = await fn(items[i], i);
      results[i] = result;
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;

  console.log("Fetching providers with Place IDs...");
  let providers = await fetchProvidersWithPlaceIds();
  console.log(`Found ${providers.length} providers with Place IDs`);

  // Skip providers that already have reviews
  const existingReviewIds = await fetchExistingReviewProviderIds();
  const beforeFilter = providers.length;
  providers = providers.filter((p) => !existingReviewIds.has(p.providerId));
  if (beforeFilter !== providers.length) {
    console.log(`Skipping ${beforeFilter - providers.length} providers that already have reviews`);
  }

  if (limit < providers.length) {
    providers = providers.slice(0, limit);
    console.log(`Limited to ${limit} providers`);
  }

  if (providers.length === 0) {
    console.log("Nothing to fetch.");
    return;
  }

  let totalReviews = 0;
  let totalProviders = 0;
  let errors = 0;
  let rateLimited = 0;

  console.log(`\nFetching reviews for ${providers.length} providers (${dryRun ? "DRY RUN" : "LIVE"})...\n`);

  // Helper to process a single provider
  async function processProvider(provider: ProviderWithPlaceId, dryRun: boolean) {
    const details = await fetchPlaceDetails(provider.placeId);

    if (!dryRun && (details.rating || details.userRatingCount)) {
      // Store aggregate Google rating on the provider record as source_notes addendum
      await supabase
        .from("providers")
        .update({
          source_notes: supabase.rpc ? undefined : undefined, // can't append easily, skip
        })
        .eq("id", provider.providerId);
    }

    if (details.reviews.length > 0) {
      totalProviders++;
      totalReviews += details.reviews.length;

      if (!dryRun) {
        const rows = details.reviews
          .filter((r) => r.rating && r.text?.text)
          .map((r) => ({
            provider_id: provider.providerId,
            reviewer_name: r.authorAttribution?.displayName || "Google User",
            reviewer_email: "",
            rating: r.rating!,
            visit_date: r.publishTime
              ? r.publishTime.split("T")[0]
              : new Date().toISOString().split("T")[0],
            visit_type: "in-person" as const,
            title: "",
            body: r.text!.text!.slice(0, 5000),
            peptides_used: [],
            would_recommend: (r.rating || 0) >= 4,
            status: "approved",
            verified_visit: false,
            moderation_notes: `Imported from Google Reviews (Place: ${provider.placeId}, Google rating: ${details.rating ?? "?"}/5, ${details.userRatingCount ?? "?"} total reviews)`,
          }));

        if (rows.length > 0) {
          const { error } = await supabase.from("provider_reviews").insert(rows);
          if (error) {
            errors++;
            if (errors <= 3) console.log(`  ✗ ${provider.providerSlug}: ${error.message}`);
          }
        }
      }
    }
  }

  await processWithConcurrency(providers, 5, 50, async (provider, i) => {
    try {
      await processProvider(provider, dryRun);

      if ((i + 1) % 200 === 0) {
        console.log(
          `  Progress: ${i + 1}/${providers.length} — ${totalReviews} reviews from ${totalProviders} providers (${errors} errors)`
        );
      }
    } catch (err: any) {
      if (err.message === "RATE_LIMITED") {
        rateLimited++;
        await new Promise((r) => setTimeout(r, 2000));
        try {
          await processProvider(provider, dryRun);
        } catch {
          errors++;
        }
      } else {
        errors++;
        if (errors <= 5) console.log(`  ✗ ${provider.providerSlug}: ${err.message}`);
      }
    }
  });

  console.log(`\n=== COMPLETE ===`);
  console.log(`  Providers with reviews: ${totalProviders}`);
  console.log(`  Total reviews imported: ${totalReviews}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Rate limited (retried): ${rateLimited}`);
  if (dryRun) console.log(`  (DRY RUN — nothing was saved)`);
  else console.log(`\nNext: run export + rebuild to include reviews on the site.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
