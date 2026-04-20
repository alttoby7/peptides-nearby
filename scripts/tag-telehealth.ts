/**
 * Tag providers with telehealth availability based on cached website text.
 *
 * Input:  data/website-text-cache.json (from fetch-website-text.ts)
 *         data/raw/providers.json
 * Output: data/raw/providers.json updated with telehealth{} per matched provider.
 *         data/telehealth-tagging-evidence.json captures what matched, from where.
 *
 * Strategy: deterministic keyword matcher against cached website text,
 * with fallback to services[] and description. No LLM.
 *
 * Key rule: NEVER write telehealth.available=false for non-matches.
 * Homepage-only absence is not evidence of absence.
 *
 * Usage:
 *   npx tsx scripts/tag-telehealth.ts             # apply and write back
 *   npx tsx scripts/tag-telehealth.ts --dry-run   # preview only
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const PROVIDERS_PATH = resolve(ROOT, "data/raw/providers.json");
const CACHE_PATH = resolve(ROOT, "data/website-text-cache.json");
const EVIDENCE_PATH = resolve(ROOT, "data/telehealth-tagging-evidence.json");

// ─── Valid US state codes ───────────────────────────────────────────────

const VALID_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
  "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI",
  "WY",
]);

const ALL_STATES_WITH_DC = [...VALID_STATE_CODES].sort();

const STATE_NAME_TO_CODE: Record<string, string> = {
  "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
  "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
  "district of columbia": "DC", "florida": "FL", "georgia": "GA", "hawaii": "HI",
  "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
  "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME",
  "maryland": "MD", "massachusetts": "MA", "michigan": "MI", "minnesota": "MN",
  "mississippi": "MS", "missouri": "MO", "montana": "MT", "nebraska": "NE",
  "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
  "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
  "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", "tennessee": "TN", "texas": "TX",
  "utah": "UT", "vermont": "VT", "virginia": "VA", "washington": "WA",
  "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
};

// ─── Types ──────────────────────────────────────────────────────────────

interface CacheEntry {
  url: string;
  fetchedAt: string;
  status: number;
  textLength: number;
  text: string;
}

interface Provider {
  slug: string;
  status: string;
  name: string;
  type: string;
  description?: string;
  website?: string;
  services?: string[];
  address: { stateCode: string; city: string; state: string };
  telehealth?: {
    available: boolean;
    statesServed: string[];
    visitTypes: string[];
  };
  [k: string]: unknown;
}

interface TelehealthEvidence {
  available: boolean;
  tier: 1 | 2;
  matchedKeywords: string[];
  source: "website" | "services" | "description";
  sourceUrl?: string;
  visitTypes: string[];
  visitTypeSource: "explicit" | "default";
  statesServed: string[];
  stateSource: "explicit-nationwide" | "licensed-in-list" | "inferred-home-state";
  snippet: string;
}

// ─── Keyword tiers ──────────────────────────────────────────────────────

const TIER_1_KEYWORDS = [
  "telehealth",
  "telemedicine",
  "virtual visit",
  "virtual care",
  "virtual consultation",
  "virtual appointment",
  "video visit",
  "video consultation",
];

const TIER_2_KEYWORDS = [
  "online consultation",
  "online visit",
  "remote consultation",
  "remote patient",
];

// ─── False positive patterns ────────────────────────────────────────────

const FALSE_POSITIVE_CONTEXTS = [
  "telehealth consent",
  "participating telehealth provider",
  "providers start prescribing telehealth",
  "health systems partner with us",
];

const NEGATION_RE = new RegExp(
  "(?:do not|don't|does not|doesn't|cannot|can't|no longer|not offer|not available|not provide|not currently|in-person only)" +
    "[\\s\\w]{0,30}" +
    "(?:telehealth|telemedicine|virtual visit|virtual care|virtual consultation)",
  "i",
);

// ─── Visit type patterns ────────────────────────────────────────────────

const VIDEO_RE = /(?:video|zoom|doxy)\s*(?:visit|call|consultation|appointment|consult)/i;
const VIRTUAL_VISIT_RE = /virtual\s+visit/i;
const PHONE_RE = /(?:phone|telephone)\s*(?:visit|call|consultation|appointment)/i;
const ASYNC_RE = /(?:async(?:hronous)?|secure\s+messaging)\b/i;

// ─── State extraction patterns ──────────────────────────────────────────

const NATIONWIDE_RE = /(?:all\s+50\s+states|all\s+fifty\s+states|all\s+states|nationwide)/i;
const LICENSED_IN_RE = /(?:licensed|serving patients|available|practicing)\s+in\s+([^.!?\n]{10,200})/gi;

// ─── Helpers ────────────────────────────────────────────────────────────

function compileKeywordRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
}

function extractSnippet(text: string, keyword: string, windowSize = 60): string {
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return "";
  const start = Math.max(0, idx - windowSize);
  const end = Math.min(text.length, idx + keyword.length + windowSize);
  return (start > 0 ? "..." : "") + text.slice(start, end).trim() + (end < text.length ? "..." : "");
}

function extractStatesFromText(text: string): string[] {
  const states = new Set<string>();
  const matches = text.matchAll(LICENSED_IN_RE);
  for (const m of matches) {
    const fragment = m[1].toLowerCase();
    // Try state names
    for (const [name, code] of Object.entries(STATE_NAME_TO_CODE)) {
      if (fragment.includes(name)) states.add(code);
    }
    // Try 2-letter state codes (uppercase in original text)
    const codeMatches = m[1].match(/\b([A-Z]{2})\b/g);
    if (codeMatches) {
      for (const code of codeMatches) {
        if (VALID_STATE_CODES.has(code)) states.add(code);
      }
    }
  }
  return [...states].sort();
}

function hasNationwideNearTelehealth(text: string): boolean {
  const lower = text.toLowerCase();
  const nationwideMatch = lower.match(NATIONWIDE_RE);
  if (!nationwideMatch) return false;
  const nwIdx = nationwideMatch.index!;
  const window = lower.slice(Math.max(0, nwIdx - 200), nwIdx + 200);
  return TIER_1_KEYWORDS.some((kw) => window.includes(kw));
}

function isFalsePositive(text: string, matchedKeyword: string): boolean {
  const lower = text.toLowerCase();
  const kwIdx = lower.indexOf(matchedKeyword.toLowerCase());
  if (kwIdx === -1) return false;
  const window = lower.slice(Math.max(0, kwIdx - 40), kwIdx + matchedKeyword.length + 40);
  return FALSE_POSITIVE_CONTEXTS.some((fp) => window.includes(fp));
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const providers: Provider[] = JSON.parse(readFileSync(PROVIDERS_PATH, "utf-8"));
  const cache: Record<string, CacheEntry> = existsSync(CACHE_PATH)
    ? JSON.parse(readFileSync(CACHE_PATH, "utf-8"))
    : {};

  const tier1Regexes = TIER_1_KEYWORDS.map((kw) => ({ keyword: kw, regex: compileKeywordRegex(kw) }));
  const tier2Regexes = TIER_2_KEYWORDS.map((kw) => ({ keyword: kw, regex: compileKeywordRegex(kw) }));

  const evidence: Record<string, TelehealthEvidence> = {};
  let tagged = 0;
  let skippedNegation = 0;
  let skippedFalsePositive = 0;
  const byTier: Record<number, number> = { 1: 0, 2: 0 };
  const bySource: Record<string, number> = { website: 0, services: 0, description: 0 };
  const byStateSource: Record<string, number> = {};

  for (const provider of providers) {
    if (provider.status !== "active") continue;

    const cacheEntry = cache[provider.slug];
    const websiteText = cacheEntry && cacheEntry.textLength >= 100 ? cacheEntry.text : "";
    const descText = provider.description ?? "";
    const servicesText = (provider.services ?? []).join(" ");

    // Combine text sources for matching (website is primary)
    const sources: Array<{ text: string; name: "website" | "services" | "description" }> = [];
    if (websiteText) sources.push({ text: websiteText, name: "website" });
    if (servicesText) sources.push({ text: servicesText, name: "services" });
    if (descText) sources.push({ text: descText, name: "description" });

    if (sources.length === 0) continue;

    let detectedTier: 1 | 2 | null = null;
    let matchedKeywords: string[] = [];
    let matchSource: "website" | "services" | "description" = "website";
    let firstMatchedKeyword = "";

    // Check Tier 1 keywords across all sources
    for (const src of sources) {
      for (const { keyword, regex } of tier1Regexes) {
        if (regex.test(src.text)) {
          // Check negation
          if (NEGATION_RE.test(src.text)) {
            skippedNegation++;
            continue;
          }
          // Check false positive context
          if (isFalsePositive(src.text, keyword)) {
            skippedFalsePositive++;
            continue;
          }
          if (!detectedTier) {
            detectedTier = 1;
            matchSource = src.name;
            firstMatchedKeyword = keyword;
          }
          matchedKeywords.push(keyword);
        }
      }
      if (detectedTier === 1) break;
    }

    // If no Tier 1, check Tier 2
    if (!detectedTier) {
      for (const src of sources) {
        for (const { keyword, regex } of tier2Regexes) {
          if (regex.test(src.text)) {
            if (NEGATION_RE.test(src.text)) {
              skippedNegation++;
              continue;
            }
            if (!detectedTier) {
              detectedTier = 2;
              matchSource = src.name;
              firstMatchedKeyword = keyword;
            }
            matchedKeywords.push(keyword);
          }
        }
        if (detectedTier === 2) break;
      }
    }

    if (!detectedTier) continue;

    matchedKeywords = [...new Set(matchedKeywords)];

    // Use the full text where the match was found for visit type and state extraction
    const matchText = sources.find((s) => s.name === matchSource)?.text ?? "";

    // ── Visit type extraction ──
    const visitTypes: string[] = [];
    if (VIDEO_RE.test(matchText) || VIRTUAL_VISIT_RE.test(matchText)) visitTypes.push("video");
    if (PHONE_RE.test(matchText)) visitTypes.push("phone");
    if (ASYNC_RE.test(matchText)) visitTypes.push("async");
    const visitTypeSource = visitTypes.length > 0 ? "explicit" as const : "default" as const;
    if (visitTypes.length === 0) visitTypes.push("video");

    // ── States served extraction ──
    let statesServed: string[] = [];
    let stateSource: TelehealthEvidence["stateSource"] = "inferred-home-state";

    if (hasNationwideNearTelehealth(matchText)) {
      statesServed = ALL_STATES_WITH_DC;
      stateSource = "explicit-nationwide";
    } else {
      const extracted = extractStatesFromText(matchText);
      if (extracted.length > 0) {
        statesServed = extracted;
        stateSource = "licensed-in-list";
      } else {
        const homeState = provider.address.stateCode;
        if (VALID_STATE_CODES.has(homeState)) {
          statesServed = [homeState];
        }
        stateSource = "inferred-home-state";
      }
    }

    // ── Write telehealth data ──
    provider.telehealth = {
      available: true,
      statesServed,
      visitTypes,
    };

    evidence[provider.slug] = {
      available: true,
      tier: detectedTier,
      matchedKeywords,
      source: matchSource,
      sourceUrl: matchSource === "website" ? cacheEntry?.url : undefined,
      visitTypes,
      visitTypeSource,
      statesServed,
      stateSource,
      snippet: extractSnippet(matchText, firstMatchedKeyword),
    };

    tagged++;
    byTier[detectedTier]++;
    bySource[matchSource] = (bySource[matchSource] ?? 0) + 1;
    byStateSource[stateSource] = (byStateSource[stateSource] ?? 0) + 1;
  }

  // ── Summary ──
  console.log(`\n=== TELEHEALTH TAGGING SUMMARY ===`);
  console.log(`Providers tagged:        ${tagged}`);
  console.log(`Skipped (negation):      ${skippedNegation}`);
  console.log(`Skipped (false positive): ${skippedFalsePositive}`);
  console.log(`\nBy tier:`);
  console.log(`  Tier 1 (strong):   ${byTier[1]}`);
  console.log(`  Tier 2 (medium):   ${byTier[2]}`);
  console.log(`\nBy source:`);
  for (const [src, count] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src.padEnd(15)} ${count}`);
  }
  console.log(`\nState source:`);
  for (const [src, count] of Object.entries(byStateSource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src.padEnd(25)} ${count}`);
  }

  // Visit type breakdown
  const vtCounts: Record<string, number> = {};
  for (const e of Object.values(evidence)) {
    for (const vt of e.visitTypes) {
      vtCounts[vt] = (vtCounts[vt] ?? 0) + 1;
    }
  }
  console.log(`\nVisit types:`);
  for (const [vt, count] of Object.entries(vtCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${vt.padEnd(10)} ${count}`);
  }

  // Pharmacy breakdown
  const providers2: Provider[] = JSON.parse(readFileSync(PROVIDERS_PATH, "utf-8"));
  const pharmacySlugs = new Set(providers2.filter((p) => p.type === "pharmacy").map((p) => p.slug));
  const pharmacyTagged = Object.keys(evidence).filter((s) => pharmacySlugs.has(s)).length;
  console.log(`\nPharmacies tagged: ${pharmacyTagged}`);

  // Nationwide count
  const nationwideCount = Object.values(evidence).filter((e) => e.stateSource === "explicit-nationwide").length;
  console.log(`Nationwide providers: ${nationwideCount}`);

  if (!dryRun) {
    writeFileSync(PROVIDERS_PATH, JSON.stringify(providers, null, 2));
    writeFileSync(EVIDENCE_PATH, JSON.stringify(evidence, null, 2));
    console.log(`\nWrote updated providers.json`);
    console.log(`Wrote evidence to ${EVIDENCE_PATH}`);
  } else {
    console.log(`\n(dry run — nothing written)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
