/**
 * Fetch homepage text for each provider with a website.
 *
 * Downloads HTML, strips scripts/styles/tags, caches plain text to
 * data/website-text-cache.json keyed by provider slug. Resumable — skips
 * entries already in cache unless --refresh is passed.
 *
 * Usage:
 *   npx tsx scripts/fetch-website-text.ts              # fetch all new
 *   npx tsx scripts/fetch-website-text.ts --limit 50   # first 50 missing
 *   npx tsx scripts/fetch-website-text.ts --refresh    # re-fetch everything
 *   npx tsx scripts/fetch-website-text.ts --retry-failed
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const PROVIDERS_PATH = resolve(ROOT, "data/raw/providers.json");
const CACHE_PATH = resolve(ROOT, "data/website-text-cache.json");

interface RawProvider {
  slug: string;
  status: string;
  website?: string;
}

interface CacheEntry {
  url: string;
  fetchedAt: string;
  status: number;            // HTTP status, 0 on network error
  textLength: number;
  text: string;
  error?: string;
}

type Cache = Record<string, CacheEntry>;

const FETCH_TIMEOUT_MS = 15_000;
const CONCURRENCY = 10;
const USER_AGENT = "Mozilla/5.0 (compatible; PeptidesNearbyBot/1.0; +https://www.peptidesnearby.com)";
const MAX_TEXT_LEN = 30_000;  // cap per entry to keep cache under control

function stripHtml(html: string): string {
  return html
    // drop script / style / noscript blocks entirely
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    // strip HTML comments
    .replace(/<!--[\s\S]*?-->/g, " ")
    // convert block tags to newlines so words don't run together
    .replace(/<\/(p|div|section|article|li|h[1-6]|tr|td|br)\s*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // drop remaining tags
    .replace(/<[^>]+>/g, " ")
    // common HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    // collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchText(url: string): Promise<{ status: number; text: string; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return { status: res.status, text: "", error: `non-html content-type: ${contentType}` };
    }
    const html = await res.text();
    const text = stripHtml(html).slice(0, MAX_TEXT_LEN);
    return { status: res.status, text };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: 0, text: "", error: msg };
  } finally {
    clearTimeout(timer);
  }
}

function loadCache(): Cache {
  if (!existsSync(CACHE_PATH)) return {};
  return JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
}

function saveCache(cache: Cache): void {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  const refresh = args.includes("--refresh");
  const retryFailed = args.includes("--retry-failed");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;

  const providers: RawProvider[] = JSON.parse(readFileSync(PROVIDERS_PATH, "utf-8"));
  const cache = loadCache();

  const queue = providers.filter((p) => {
    if (p.status !== "active") return false;
    if (!p.website) return false;
    if (refresh) return true;
    const entry = cache[p.slug];
    if (!entry) return true;
    if (retryFailed && (entry.status < 200 || entry.status >= 400 || entry.textLength < 100)) return true;
    return false;
  });

  const work = queue.slice(0, limit === Infinity ? queue.length : limit);
  console.log(`Providers with websites: ${providers.filter((p) => p.status === "active" && p.website).length}`);
  console.log(`Already in cache: ${Object.keys(cache).length}`);
  console.log(`Queued to fetch: ${work.length}`);

  if (work.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  let done = 0;
  let ok = 0;
  let failed = 0;
  let lastSave = Date.now();

  let idx = 0;
  async function worker() {
    while (idx < work.length) {
      const i = idx++;
      const p = work[i];
      const { status, text, error } = await fetchText(p.website!);
      cache[p.slug] = {
        url: p.website!,
        fetchedAt: new Date().toISOString(),
        status,
        textLength: text.length,
        text,
        ...(error ? { error } : {}),
      };
      done++;
      if (status >= 200 && status < 400 && text.length >= 100) ok++;
      else failed++;

      if (done % 25 === 0) {
        console.log(`  ${done}/${work.length} — ok=${ok} failed=${failed}`);
      }

      // periodic save so crashes don't lose progress
      if (Date.now() - lastSave > 20_000) {
        saveCache(cache);
        lastSave = Date.now();
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  saveCache(cache);

  console.log(`\n=== COMPLETE ===`);
  console.log(`  Fetched: ${done}`);
  console.log(`  OK:      ${ok}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Cache entries total: ${Object.keys(cache).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
