import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { ProviderSchema, type Provider } from "../src/lib/data/schemas";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

interface SupabaseProviderRow {
  slug: string;
  name: string;
  type: "clinic" | "pharmacy" | "wellness-center";
  status: "active" | "pending" | "closed";
  address: Json;
  phone: string | null;
  website: string | null;
  email: string | null;
  description: string;
  booking_url: string | null;
  google_maps_url: string | null;
  services: string[] | null;
  peptides: string[] | null;
  insurance: "accepted" | "not-accepted" | "varies" | "unknown";
  hours: Record<string, { open: string; close: string }> | null;
  featured: boolean | null;
  verified: boolean | null;
  last_verified_at: string | null;
  telehealth: Json | null;
  pricing: Json | null;
  pharmacy_details: Json | null;
  consultation: Json | null;
  verification_tier: "listed" | "verified" | "claimed" | "trusted" | null;
  treatment_goals: string[] | null;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function isAddress(value: Json): value is Provider["address"] {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof value.street === "string" &&
      typeof value.city === "string" &&
      typeof value.state === "string" &&
      typeof value.stateCode === "string" &&
      typeof value.zip === "string"
  );
}

function normalizeProvider(row: SupabaseProviderRow): Provider {
  if (!isAddress(row.address)) {
    throw new Error(`Provider ${row.slug} has an invalid address payload`);
  }

  return ProviderSchema.parse({
    slug: row.slug,
    name: row.name,
    type: row.type,
    status: row.status,
    address: row.address,
    phone: row.phone ?? "",
    website: row.website ?? "",
    email: row.email ?? "",
    description: row.description,
    bookingUrl: row.booking_url ?? "",
    googleMapsUrl: row.google_maps_url ?? "",
    services: row.services ?? [],
    peptides: row.peptides ?? [],
    insurance: row.insurance,
    hours: row.hours ?? null,
    featured: row.featured ?? false,
    verified: row.verified ?? false,
    lastVerified: row.last_verified_at ?? undefined,
    telehealth: row.telehealth ?? undefined,
    pricing: row.pricing ?? undefined,
    pharmacyDetails: row.pharmacy_details ?? undefined,
    consultation: row.consultation ?? undefined,
    verificationTier: row.verification_tier ?? "listed",
    treatmentGoals: row.treatment_goals ?? [],
  });
}

async function fetchProviders(): Promise<SupabaseProviderRow[]> {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const table = process.env.SUPABASE_PROVIDERS_TABLE ?? "providers";

  const selectCols = "slug,name,type,status,address,phone,website,email,description,booking_url,google_maps_url,services,peptides,insurance,hours,featured,verified,last_verified_at,telehealth,pricing,pharmacy_details,consultation,verification_tier,treatment_goals";
  const all: SupabaseProviderRow[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const url = new URL(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}`);
    url.searchParams.set("select", selectCols);
    url.searchParams.set("review_status", "eq.approved");
    url.searchParams.set("is_published", "eq.true");
    url.searchParams.set("order", "slug.asc");
    url.searchParams.set("limit", String(pageSize));
    url.searchParams.set("offset", String(offset));

    const res = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Supabase export failed (${res.status}): ${body}`);
    }

    const rows = (await res.json()) as SupabaseProviderRow[];
    all.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

interface SupabaseReviewRow {
  id: string;
  provider_id: string;
  reviewer_name: string;
  rating: number;
  visit_date: string;
  visit_type: "in-person" | "telehealth";
  title: string;
  body: string;
  peptides_used: string[];
  would_recommend: boolean;
  verified_visit: boolean;
  created_at: string;
}

async function fetchReviews(): Promise<SupabaseReviewRow[]> {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const selectCols = "id,provider_id,reviewer_name,rating,visit_date,visit_type,title,body,peptides_used,would_recommend,verified_visit,created_at";
  const all: SupabaseReviewRow[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const url = new URL(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/provider_reviews`);
    url.searchParams.set("select", selectCols);
    url.searchParams.set("status", "eq.approved");
    url.searchParams.set("order", "created_at.desc");
    url.searchParams.set("limit", String(pageSize));
    url.searchParams.set("offset", String(offset));

    const res = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`Reviews fetch returned ${res.status} — skipping`);
      break;
    }

    const rows = (await res.json()) as SupabaseReviewRow[];
    all.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

async function fetchProviderSlugMap(): Promise<Map<string, string>> {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const map = new Map<string, string>();
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const url = new URL(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/providers`);
    url.searchParams.set("select", "id,slug");
    url.searchParams.set("limit", String(pageSize));
    url.searchParams.set("offset", String(offset));

    const res = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) break;

    const rows = (await res.json()) as { id: string; slug: string }[];
    for (const r of rows) map.set(r.id, r.slug);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return map;
}

async function main() {
  const rows = await fetchProviders();
  const providers = rows.map(normalizeProvider);
  providers.sort((a, b) =>
    a.address.stateCode.localeCompare(b.address.stateCode) ||
    a.address.city.localeCompare(b.address.city) ||
    a.name.localeCompare(b.name) ||
    a.slug.localeCompare(b.slug)
  );

  const rawDir = resolve(__dirname, "..", "data", "raw");
  mkdirSync(rawDir, { recursive: true });
  const outPath = resolve(rawDir, "providers.json");
  writeFileSync(outPath, JSON.stringify(providers, null, 2) + "\n");

  console.log(`Exported ${providers.length} approved providers to ${outPath}`);

  // Export reviews
  const reviewRows = await fetchReviews();
  const slugMap = await fetchProviderSlugMap();

  const reviews = reviewRows
    .map((r) => ({
      id: r.id,
      providerSlug: slugMap.get(r.provider_id) || "",
      reviewerName: r.reviewer_name,
      rating: r.rating,
      visitDate: r.visit_date,
      visitType: r.visit_type,
      title: r.title,
      body: r.body,
      peptidesUsed: r.peptides_used || [],
      wouldRecommend: r.would_recommend,
      verifiedVisit: r.verified_visit,
      createdAt: r.created_at,
    }))
    .filter((r) => r.providerSlug); // Only include reviews with valid provider slugs

  const reviewsPath = resolve(rawDir, "reviews.json");
  writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2) + "\n");

  console.log(`Exported ${reviews.length} approved reviews to ${reviewsPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
