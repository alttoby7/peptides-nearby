#!/usr/bin/env npx tsx
/**
 * Score and prioritize no-website providers for website recovery.
 * Outputs ranked batch files for Google Places enrichment.
 *
 * Usage: npx tsx scripts/score-providers.ts
 */
import fs from "fs";

const GAP_CITIES = new Set([
  "San Diego, CA", "Austin, TX", "Denver, CO", "Miami, FL",
  "Fort Worth, TX", "El Paso, TX", "Fresno, CA", "Long Beach, CA",
  "Wichita, KS", "Tulsa, OK", "Mesa, AZ", "Arlington, TX", "Oakland, CA",
  "Phoenix, AZ", "New York, NY", "Los Angeles, CA", "Boston, MA",
]);

const PEPTIDE_KEYWORDS = [
  "peptide", "compound", "wellness", "regenerative", "anti-aging",
  "hormone", "functional", "integrative", "medspa", "med spa",
  "longevity", "age management", "weight loss", "medical weight",
  "obesity", "metabolic", "mens health", "womens health", "bioidentical",
  "bhrt", "testosterone", "trt", "concierge", "vitality", "optimization",
  "aesthetic", "iv therapy", "infusion", "rejuvenation",
];

interface Provider {
  slug: string;
  name: string;
  type: string;
  address: { city: string; stateCode: string };
  phone: string;
  website: string;
  description: string;
}

function scoreProvider(p: Provider): number {
  let score = 0;
  const cityKey = `${p.address.city}, ${p.address.stateCode}`;
  const nameLower = (p.name || "").toLowerCase();
  const descLower = (p.description || "").toLowerCase();

  if (GAP_CITIES.has(cityKey)) score += 30;

  for (const kw of PEPTIDE_KEYWORDS) {
    if (nameLower.includes(kw)) { score += 10; break; }
  }
  for (const kw of PEPTIDE_KEYWORDS) {
    if (descLower.includes(kw)) { score += 5; break; }
  }

  if (p.type === "pharmacy") score += 8;
  if (p.phone && p.phone.length >= 10) score += 5;

  return score;
}

const providers: Provider[] = JSON.parse(fs.readFileSync("data/raw/providers.json", "utf8"));
const noWebsite = providers.filter(
  (p) => !p.website || !p.website.startsWith("http")
);

const scored = noWebsite.map((p) => ({
  slug: p.slug,
  name: p.name,
  city: `${p.address.city}, ${p.address.stateCode}`,
  type: p.type,
  phone: p.phone || "",
  score: scoreProvider(p),
}));

scored.sort((a, b) => b.score - a.score);

console.log(`Total no-website providers: ${scored.length}`);
console.log(`Score distribution:`);
console.log(`  30+: ${scored.filter((s) => s.score >= 30).length}`);
console.log(`  15-29: ${scored.filter((s) => s.score >= 15 && s.score < 30).length}`);
console.log(`  5-14: ${scored.filter((s) => s.score >= 5 && s.score < 15).length}`);
console.log(`  0-4: ${scored.filter((s) => s.score < 5).length}`);

console.log(`\nTop 20:`);
scored.slice(0, 20).forEach((s) =>
  console.log(`  [${s.score}] ${s.name} — ${s.city} (${s.type})`)
);

const tierA = scored.filter((s) => s.score >= 15).map((s) => s.slug);
const tierB = scored.filter((s) => s.score >= 5 && s.score < 15).map((s) => s.slug);
const tierC = scored.filter((s) => s.score < 5).map((s) => s.slug);

fs.mkdirSync("data/recovery-batches", { recursive: true });
fs.writeFileSync("data/recovery-batches/tier-a.json", JSON.stringify(tierA, null, 2));
fs.writeFileSync("data/recovery-batches/tier-b.json", JSON.stringify(tierB, null, 2));
fs.writeFileSync("data/recovery-batches/tier-c.json", JSON.stringify(tierC, null, 2));

console.log(`\nBatches written:`);
console.log(`  tier-a.json: ${tierA.length} providers (score >= 15, highest priority)`);
console.log(`  tier-b.json: ${tierB.length} providers (score 5-14)`);
console.log(`  tier-c.json: ${tierC.length} providers (score < 5)`);
