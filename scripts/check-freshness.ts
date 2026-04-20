/**
 * Data Freshness Monitor
 *
 * Checks provider data for staleness and dead links:
 * 1. Flags providers not verified in >90 days
 * 2. HEAD requests on provider websites to detect dead links
 * 3. Updates freshness_checked_at and website_status in Supabase
 * 4. Outputs a freshness report for manual review
 *
 * Usage:
 *   npx tsx scripts/check-freshness.ts
 *   npx tsx scripts/check-freshness.ts --state TX
 *   npx tsx scripts/check-freshness.ts --stale-only
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

const STALE_THRESHOLD_DAYS = 90;

interface ProviderRow {
  id: string;
  slug: string;
  name: string;
  website: string | null;
  last_verified_at: string | null;
  freshness_checked_at: string | null;
  website_status: string | null;
  address: { stateCode?: string; city?: string };
}

type WebsiteStatus = "live" | "dead" | "redirect" | "timeout" | "unknown";

async function checkWebsite(url: string): Promise<WebsiteStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "PeptidesNearby-FreshnessBot/1.0",
      },
    });

    clearTimeout(timeout);

    if (res.status >= 200 && res.status < 400) return "live";
    if (res.status >= 300 && res.status < 400) return "redirect";
    return "dead";
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return "timeout";
    return "dead";
  }
}

async function main() {
  const args = process.argv.slice(2);
  const stateIdx = args.indexOf("--state");
  const staleOnly = args.includes("--stale-only");
  const stateFilter = stateIdx >= 0 ? args[stateIdx + 1] : null;

  // Fetch providers
  let query = supabase
    .from("providers")
    .select("id, slug, name, website, last_verified_at, freshness_checked_at, website_status, address")
    .eq("status", "active")
    .eq("is_published", true);

  const { data: providers, error } = await query;

  if (error) {
    console.error("Failed to fetch providers:", error.message);
    process.exit(1);
  }

  if (!providers || providers.length === 0) {
    console.log("No providers found.");
    return;
  }

  // Filter by state if specified
  let filtered = providers as ProviderRow[];
  if (stateFilter) {
    filtered = filtered.filter((p) => p.address?.stateCode === stateFilter);
  }

  console.log(`Checking ${filtered.length} providers...\n`);

  const now = new Date();
  const staleDate = new Date(now.getTime() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

  const report = {
    total: filtered.length,
    stale: [] as { slug: string; name: string; lastVerified: string | null; daysSince: number }[],
    deadLinks: [] as { slug: string; name: string; website: string; status: WebsiteStatus }[],
    live: 0,
    noWebsite: 0,
    checked: 0,
  };

  for (const provider of filtered) {
    // Check staleness
    const lastVerified = provider.last_verified_at ? new Date(provider.last_verified_at) : null;
    const daysSince = lastVerified
      ? Math.floor((now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (!lastVerified || lastVerified < staleDate) {
      report.stale.push({
        slug: provider.slug,
        name: provider.name,
        lastVerified: provider.last_verified_at,
        daysSince,
      });
    }

    // Check website
    if (provider.website && !staleOnly) {
      const status = await checkWebsite(provider.website);
      report.checked++;

      if (status === "live" || status === "redirect") {
        report.live++;
      } else {
        report.deadLinks.push({
          slug: provider.slug,
          name: provider.name,
          website: provider.website,
          status,
        });
      }

      // Update Supabase
      await supabase
        .from("providers")
        .update({
          website_status: status,
          freshness_checked_at: now.toISOString(),
        })
        .eq("id", provider.id);

      // Rate limit: ~5 req/sec to avoid hammering provider sites
      await new Promise((r) => setTimeout(r, 200));
    } else if (!provider.website) {
      report.noWebsite++;
    }
  }

  // Print report
  console.log("=== FRESHNESS REPORT ===\n");
  console.log(`Total providers: ${report.total}`);
  console.log(`Websites checked: ${report.checked}`);
  console.log(`Live: ${report.live}`);
  console.log(`No website: ${report.noWebsite}`);
  console.log(`Dead/timeout: ${report.deadLinks.length}`);
  console.log(`Stale (>${STALE_THRESHOLD_DAYS} days): ${report.stale.length}`);

  if (report.deadLinks.length > 0) {
    console.log("\n--- DEAD LINKS ---");
    for (const d of report.deadLinks) {
      console.log(`  ${d.status.padEnd(8)} ${d.slug.padEnd(40)} ${d.website}`);
    }
  }

  if (report.stale.length > 0) {
    console.log("\n--- STALE PROVIDERS ---");
    for (const s of report.stale.slice(0, 50)) {
      const verified = s.lastVerified ? `verified ${s.daysSince}d ago` : "never verified";
      console.log(`  ${s.slug.padEnd(40)} ${verified}`);
    }
    if (report.stale.length > 50) {
      console.log(`  ... and ${report.stale.length - 50} more`);
    }
  }

  console.log("\nDone.");
}

main().catch(console.error);
