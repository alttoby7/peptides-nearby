/**
 * Triage & Merge Script for Provider Submissions
 *
 * Fetches all "new" submissions from Supabase, applies quality filters,
 * and either previews or applies triage decisions.
 *
 * Usage:
 *   npx tsx scripts/triage-submissions.ts --preview     # Show stats + buckets
 *   npx tsx scripts/triage-submissions.ts --approve      # Auto-approve high-confidence, reject junk, merge into providers
 *   npx tsx scripts/triage-submissions.ts --reject-only  # Only reject obvious non-matches
 *
 * Environment:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — required
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- State code lookup ---
const STATE_CODES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "district of columbia": "DC",
};

function toStateCode(state: string): string {
  const s = state.trim();
  if (s.length === 2) return s.toUpperCase();
  return STATE_CODES[s.toLowerCase()] || s.toUpperCase().slice(0, 2);
}

// --- Slug generation ---
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeProviderSlug(name: string, city: string, stateCode: string): string {
  return slugify(`${name}-${city}-${stateCode}`);
}

// --- Quality signals ---

// Keywords that indicate a relevant business
const POSITIVE_KEYWORDS = [
  "peptide", "compound", "wellness", "regenerative", "anti-aging", "hormone",
  "functional medicine", "integrative", "medspa", "med spa", "rejuvenation",
  "iv therapy", "iv infusion", "biohacking", "longevity", "optimization",
  "hrt", "trt", "testosterone", "semaglutide", "tirzepatide", "bpc-157",
  "weight loss clinic", "aesthetic", "age management", "concierge medicine",
  "naturopath", "holistic", "bioidentical",
];

// Keywords that indicate NOT a peptide provider
const NEGATIVE_KEYWORDS = [
  "veterinary", "vet clinic", "animal hospital", "pet ", "dental", "dentist",
  "orthodont", "eye care", "optometry", "chiropract", "physical therapy",
  "urgent care", "emergency room", " er ", "hospital", "imaging", "radiology",
  "laboratory", "lab corp", "quest diagnostic", "mental health", "psychiatr",
  "psycholog", "counseling", "addiction", "rehab center", "nursing home",
  "assisted living", "home health", "hospice", "dialysis", "cancer center",
  "oncology", "cardiology", "heart ", "surgery center", "surgical",
  "pain management", "spine", "ortho", "podiatr", "foot ", "wound care",
  "sleep center", "pulmonary", "allergy", " ent ", "ear nose",
  "fertility", "ivf", "obgyn", "ob-gyn", "gynecol", "pediatric",
  "children", "neonatal",
];

interface Submission {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  website: string;
  services: string;
  status: string;
  raw_payload: {
    source?: string;
    sourceId?: string;
    discoveredAt?: string;
    automated?: boolean;
  };
  review_notes: string;
}

type Bucket = "approve" | "review" | "reject";

interface TriageResult {
  submission: Submission;
  bucket: Bucket;
  reasons: string[];
  score: number;
}

function triageSubmission(sub: Submission): TriageResult {
  const reasons: string[] = [];
  let score = 50; // Start neutral

  const nameLower = (sub.name || "").toLowerCase();
  const servicesLower = (sub.services || "").toLowerCase();
  const combined = `${nameLower} ${servicesLower}`;

  // Positive signals
  for (const kw of POSITIVE_KEYWORDS) {
    if (combined.includes(kw)) {
      score += 15;
      reasons.push(`+keyword: "${kw}"`);
      break; // One positive keyword is enough
    }
  }

  // Negative signals
  for (const kw of NEGATIVE_KEYWORDS) {
    if (combined.includes(kw)) {
      score -= 40;
      reasons.push(`-keyword: "${kw}"`);
      break;
    }
  }

  // Has website = good signal
  if (sub.website && sub.website.length > 5) {
    score += 10;
    reasons.push("+has website");
  } else {
    score -= 5;
    reasons.push("-no website");
  }

  // Has phone = good signal
  if (sub.phone && sub.phone.length >= 10) {
    score += 5;
    reasons.push("+has phone");
  }

  // Has address = good signal
  if (sub.address && sub.address.length > 10) {
    score += 5;
    reasons.push("+has address");
  }

  // Type alignment
  if (sub.type === "pharmacy" && !combined.includes("compound") && !combined.includes("pharmacy")) {
    score -= 10;
    reasons.push("-pharmacy type but no pharmacy keywords");
  }

  // Determine bucket
  let bucket: Bucket;
  if (score >= 65) {
    bucket = "approve";
  } else if (score <= 30) {
    bucket = "reject";
  } else {
    bucket = "review";
  }

  return { submission: sub, bucket, reasons, score };
}

// --- Fetch all "new" submissions ---
async function fetchNewSubmissions(): Promise<Submission[]> {
  const all: Submission[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("provider_submissions")
      .select("*")
      .eq("status", "new")
      .order("submitted_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Fetch error:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    all.push(...(data as Submission[]));
    if (data.length < limit) break;
    offset += limit;
  }

  return all;
}

// --- Fetch existing provider slugs for dedup ---
async function fetchExistingSlugs(): Promise<Set<string>> {
  const slugs = new Set<string>();
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("providers")
      .select("slug,name")
      .range(offset, offset + limit - 1);

    if (error) break;
    if (!data || data.length === 0) break;
    for (const row of data) {
      slugs.add(row.slug);
      slugs.add(slugify(row.name));
    }
    if (data.length < limit) break;
    offset += limit;
  }

  return slugs;
}

// --- Merge approved submission into providers table ---
async function mergeSubmission(
  sub: Submission,
  existingSlugs: Set<string>
): Promise<{ slug: string; success: boolean; error?: string }> {
  const stateCode = toStateCode(sub.state);
  let slug = makeProviderSlug(sub.name, sub.city, stateCode);

  // Dedup slug
  let counter = 1;
  while (existingSlugs.has(slug)) {
    slug = makeProviderSlug(sub.name, sub.city, stateCode) + `-${counter}`;
    counter++;
  }

  const address = {
    street: sub.address || "",
    city: sub.city,
    state: sub.state,
    stateCode,
    zip: "",
  };

  // Parse services from the free-text field
  const servicesList = sub.services
    ? sub.services.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
    : [];

  const provider = {
    slug,
    name: sub.name,
    type: sub.type,
    status: "active",
    address,
    phone: sub.phone || null,
    website: sub.website || null,
    email: null,
    description: `${sub.name} is a ${sub.type === "wellness-center" ? "wellness center" : sub.type} in ${sub.city}, ${stateCode} offering peptide therapy and related services.`,
    booking_url: null,
    google_maps_url: null,
    services: servicesList.length > 0 ? servicesList : ["peptide therapy"],
    peptides: [],
    insurance: "unknown",
    hours: null,
    featured: false,
    verified: false,
    review_status: "approved",
    source_notes: `Auto-imported from ${sub.raw_payload?.source || "unknown"} (${sub.raw_payload?.sourceId || "no-id"})`,
    is_published: true,
    verification_tier: "listed",
    treatment_goals: [],
  };

  const { data, error } = await supabase
    .from("providers")
    .insert(provider)
    .select("id")
    .single();

  if (error) {
    return { slug, success: false, error: error.message };
  }

  // Update submission status to "merged" and link to provider
  await supabase
    .from("provider_submissions")
    .update({
      status: "merged",
      canonical_provider_id: data.id,
      review_notes: `Auto-approved and merged as ${slug}`,
    })
    .eq("id", sub.id);

  existingSlugs.add(slug);
  return { slug, success: true };
}

// --- Main ---
async function main() {
  const mode = process.argv[2] || "--preview";

  console.log("Fetching submissions...");
  const submissions = await fetchNewSubmissions();
  console.log(`Found ${submissions.length} new submissions\n`);

  if (submissions.length === 0) {
    console.log("Nothing to triage.");
    return;
  }

  // Triage all
  const results = submissions.map(triageSubmission);
  const approved = results.filter((r) => r.bucket === "approve");
  const review = results.filter((r) => r.bucket === "review");
  const rejected = results.filter((r) => r.bucket === "reject");

  // Stats
  console.log("=== TRIAGE SUMMARY ===");
  console.log(`  Auto-approve:  ${approved.length} (score >= 65)`);
  console.log(`  Needs review:  ${review.length} (score 31-64)`);
  console.log(`  Auto-reject:   ${rejected.length} (score <= 30)`);
  console.log();

  // City breakdown
  const byCityApproved = new Map<string, number>();
  for (const r of approved) {
    const key = `${r.submission.city}, ${toStateCode(r.submission.state)}`;
    byCityApproved.set(key, (byCityApproved.get(key) || 0) + 1);
  }
  console.log("=== APPROVED BY CITY (top 20) ===");
  const sortedCities = [...byCityApproved.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [city, count] of sortedCities) {
    console.log(`  ${city}: ${count}`);
  }
  console.log();

  // Sample rejected
  if (rejected.length > 0) {
    console.log("=== SAMPLE REJECTED (first 10) ===");
    for (const r of rejected.slice(0, 10)) {
      console.log(`  ✗ ${r.submission.name} (${r.submission.city}, ${r.submission.state}) — ${r.reasons.join(", ")}`);
    }
    console.log();
  }

  // Sample needs-review
  if (review.length > 0) {
    console.log("=== SAMPLE NEEDS REVIEW (first 10) ===");
    for (const r of review.slice(0, 10)) {
      console.log(`  ? ${r.submission.name} (${r.submission.city}, ${r.submission.state}) — score ${r.score} — ${r.reasons.join(", ")}`);
    }
    console.log();
  }

  // Sample approved
  if (approved.length > 0) {
    console.log("=== SAMPLE APPROVED (first 10) ===");
    for (const r of approved.slice(0, 10)) {
      console.log(`  ✓ ${r.submission.name} (${r.submission.city}, ${r.submission.state}) — score ${r.score}`);
    }
    console.log();
  }

  if (mode === "--preview") {
    console.log("Run with --approve to auto-approve and merge, or --reject-only to just reject junk.");
    return;
  }

  // Fetch existing slugs for dedup
  const existingSlugs = await fetchExistingSlugs();
  console.log(`Existing providers: ${existingSlugs.size / 2} (slug + name entries)\n`);

  if (mode === "--approve") {
    // 1. Reject junk
    console.log(`Rejecting ${rejected.length} submissions...`);
    const rejectIds = rejected.map((r) => r.submission.id);
    for (let i = 0; i < rejectIds.length; i += 100) {
      const batch = rejectIds.slice(i, i + 100);
      await supabase
        .from("provider_submissions")
        .update({ status: "rejected", review_notes: "Auto-rejected: low relevance score" })
        .in("id", batch);
    }
    console.log(`  Done.\n`);

    // 2. Merge approved into providers
    console.log(`Merging ${approved.length} approved submissions into providers...`);
    let merged = 0;
    let failed = 0;
    for (const r of approved) {
      const result = await mergeSubmission(r.submission, existingSlugs);
      if (result.success) {
        merged++;
      } else {
        failed++;
        if (failed <= 5) console.log(`  ✗ ${r.submission.name}: ${result.error}`);
      }
      if ((merged + failed) % 100 === 0) {
        console.log(`  Progress: ${merged + failed}/${approved.length} (${merged} merged, ${failed} failed)`);
      }
    }
    console.log(`\nMerge complete: ${merged} merged, ${failed} failed`);

    // 3. Mark "needs review" as "reviewing"
    console.log(`\nMarking ${review.length} as "reviewing" for manual review...`);
    const reviewIds = review.map((r) => r.submission.id);
    for (let i = 0; i < reviewIds.length; i += 100) {
      const batch = reviewIds.slice(i, i + 100);
      await supabase
        .from("provider_submissions")
        .update({ status: "reviewing", review_notes: "Needs manual review — moderate relevance" })
        .in("id", batch);
    }
    console.log(`  Done.\n`);

    console.log("=== FINAL ===");
    console.log(`  Merged into providers: ${merged}`);
    console.log(`  Failed merges: ${failed}`);
    console.log(`  Rejected: ${rejected.length}`);
    console.log(`  Flagged for review: ${review.length}`);
    console.log(`\nNext: run 'npx tsx scripts/export-from-supabase.ts' then 'npm run sync-data' to rebuild.`);
  }

  if (mode === "--reject-only") {
    console.log(`Rejecting ${rejected.length} submissions...`);
    const rejectIds = rejected.map((r) => r.submission.id);
    for (let i = 0; i < rejectIds.length; i += 100) {
      const batch = rejectIds.slice(i, i + 100);
      await supabase
        .from("provider_submissions")
        .update({ status: "rejected", review_notes: "Auto-rejected: low relevance score" })
        .in("id", batch);
    }
    console.log(`  Done. Rejected ${rejected.length} submissions.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
