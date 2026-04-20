/**
 * Tag providers with specific peptides based on cached website text.
 *
 * Input:  data/website-text-cache.json (from fetch-website-text.ts)
 * Output: data/raw/providers.json is updated with peptides[] per provider.
 *         data/peptide-tagging-evidence.json captures what matched, from where.
 *
 * Strategy: deterministic alias matcher. No LLM. Word-boundary matches.
 * Generic "peptide therapy" and "weight loss" are NOT signals.
 *
 * Usage:
 *   npx tsx scripts/tag-peptides.ts             # apply and write back
 *   npx tsx scripts/tag-peptides.ts --dry-run   # preview only
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const PROVIDERS_PATH = resolve(ROOT, "data/raw/providers.json");
const CACHE_PATH = resolve(ROOT, "data/website-text-cache.json");
const EVIDENCE_PATH = resolve(ROOT, "data/peptide-tagging-evidence.json");

interface CacheEntry {
  url: string;
  fetchedAt: string;
  status: number;
  textLength: number;
  text: string;
}

// Canonical peptide slug → match config.
// "any" = match if ANY alias appears (default).
// "all" = require every alias (for combos like CJC-1295 + Ipamorelin).
type PeptideRule =
  | { mode?: "any"; aliases: string[] }
  | { mode: "all"; aliases: string[] };

const PEPTIDE_RULES: Record<string, PeptideRule> = {
  "bpc-157": {
    aliases: ["bpc-157", "bpc 157", "bpc157", "pl 14736", "body protection compound"],
  },
  "tb-500": {
    aliases: ["tb-500", "tb 500", "tb500", "thymosin beta-4", "thymosin beta 4", "thymosin beta4"],
  },
  "ghk-cu": {
    aliases: ["ghk-cu", "ghk cu", "ghk copper", "copper tripeptide", "copper peptide"],
  },
  "semaglutide": {
    aliases: ["semaglutide", "ozempic", "wegovy", "rybelsus"],
  },
  "tirzepatide": {
    aliases: ["tirzepatide", "mounjaro", "zepbound"],
  },
  "sermorelin": {
    aliases: ["sermorelin"],
  },
  "pt-141": {
    aliases: ["pt-141", "pt 141", "pt141", "bremelanotide", "vyleesi"],
  },
  "cjc-1295-ipamorelin": {
    mode: "all",
    aliases: ["cjc-1295", "ipamorelin"],
  },
  "nad-plus": {
    aliases: ["nad+", "nad plus", "nad iv", "nicotinamide adenine dinucleotide"],
  },
  // Not currently a /peptides/ page but useful for breakdown data:
  "epithalon": {
    aliases: ["epithalon", "epitalon"],
  },
  "selank": { aliases: ["selank"] },
  "semax": { aliases: ["semax"] },
  "kisspeptin": { aliases: ["kisspeptin"] },
  "tesamorelin": { aliases: ["tesamorelin", "egrifta"] },
  "ghrp-6": { aliases: ["ghrp-6", "ghrp 6"] },
  "ghrp-2": { aliases: ["ghrp-2", "ghrp 2"] },
  "hexarelin": { aliases: ["hexarelin"] },
  "mots-c": { aliases: ["mots-c", "mots c"] },
  "glutathione": { aliases: ["glutathione"] },
  "hcg": { aliases: ["hcg", "human chorionic gonadotropin"] },
  "liraglutide": { aliases: ["liraglutide", "saxenda", "victoza"] },
  "5-amino-1mq": { aliases: ["5-amino-1mq", "5 amino 1mq", "5amino1mq", "5-amino 1mq"] },
  "retatrutide": { aliases: ["retatrutide"] },
  "oxytocin": { aliases: ["oxytocin"] },
  "aod-9604": { aliases: ["aod-9604", "aod 9604", "aod9604"] },
  "thymosin-alpha-1": { aliases: ["thymosin alpha-1", "thymosin alpha 1", "thymosin alpha1", "ta-1", "zadaxin"] },
  "igf-1-lr3": { aliases: ["igf-1 lr3", "igf1 lr3", "igf-1lr3", "igf-1", "igf 1"] },
  "dsip": { aliases: ["dsip", "delta sleep-inducing peptide", "delta sleep inducing peptide"] },
  "ss-31": { aliases: ["ss-31", "ss 31", "elamipretide"] },
  "melanotan-2": { aliases: ["melanotan-2", "melanotan 2", "melanotan ii", "mt-ii", "mt ii", "melanotan"] },
};

function compileMatchers(): Array<{ slug: string; mode: "any" | "all"; regexes: RegExp[] }> {
  const out: Array<{ slug: string; mode: "any" | "all"; regexes: RegExp[] }> = [];
  for (const [slug, rule] of Object.entries(PEPTIDE_RULES)) {
    const regexes = rule.aliases.map(
      (alias) =>
        new RegExp(`(?<![a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z0-9])`, "i"),
    );
    out.push({ slug, mode: rule.mode ?? "any", regexes });
  }
  return out;
}

interface Provider {
  slug: string;
  status: string;
  name: string;
  description?: string;
  website?: string;
  peptides?: string[];
  [k: string]: unknown;
}

interface EvidenceEntry {
  peptide: string;
  matchedAliases: string[];
  source: "website" | "description";
  sourceUrl?: string;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const providers: Provider[] = JSON.parse(readFileSync(PROVIDERS_PATH, "utf-8"));
  const cache: Record<string, CacheEntry> = existsSync(CACHE_PATH)
    ? JSON.parse(readFileSync(CACHE_PATH, "utf-8"))
    : {};

  const matchers = compileMatchers();
  const evidence: Record<string, EvidenceEntry[]> = {};

  let tagged = 0;
  let unchanged = 0;
  const perPeptideCount: Record<string, number> = {};

  for (const provider of providers) {
    if (provider.status !== "active") continue;

    const websiteEntry = cache[provider.slug];
    const websiteText = websiteEntry && websiteEntry.textLength >= 100 ? websiteEntry.text : "";
    const descText = provider.description ?? "";

    // Skip if no signal source
    if (!websiteText && !descText) continue;

    const providerEvidence: EvidenceEntry[] = [];
    const newTags = new Set<string>();

    for (const { slug, mode, regexes } of matchers) {
      // Test website first (stronger signal)
      const websiteMatches = regexes
        .map((r) => websiteText.match(r)?.[0])
        .filter((m): m is string => Boolean(m));
      const descMatches = regexes
        .map((r) => descText.match(r)?.[0])
        .filter((m): m is string => Boolean(m));

      let matched = false;
      let source: "website" | "description" = "website";
      let aliases: string[] = [];

      if (mode === "all") {
        // Every alias must appear in SAME source
        if (websiteMatches.length === regexes.length) {
          matched = true;
          source = "website";
          aliases = websiteMatches;
        } else if (descMatches.length === regexes.length) {
          matched = true;
          source = "description";
          aliases = descMatches;
        }
      } else {
        if (websiteMatches.length > 0) {
          matched = true;
          source = "website";
          aliases = websiteMatches;
        } else if (descMatches.length > 0) {
          matched = true;
          source = "description";
          aliases = descMatches;
        }
      }

      if (matched) {
        newTags.add(slug);
        providerEvidence.push({
          peptide: slug,
          matchedAliases: [...new Set(aliases.map((a) => a.toLowerCase()))],
          source,
          sourceUrl: source === "website" ? websiteEntry?.url : undefined,
        });
        perPeptideCount[slug] = (perPeptideCount[slug] ?? 0) + 1;
      }
    }

    if (newTags.size > 0) {
      provider.peptides = [...newTags].sort();
      evidence[provider.slug] = providerEvidence;
      tagged++;
    } else {
      unchanged++;
    }
  }

  console.log(`\n=== TAGGING SUMMARY ===`);
  console.log(`Providers tagged:     ${tagged}`);
  console.log(`Providers unchanged:  ${unchanged}`);
  console.log(`\nPer-peptide counts:`);
  for (const [slug, count] of Object.entries(perPeptideCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${slug.padEnd(28)} ${count}`);
  }

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
