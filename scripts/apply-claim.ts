/**
 * Apply a VERIFIED listing claim to the site data.
 *
 * Input: the JSON payload from the "[Peptides Nearby] Claim pending" email,
 * saved to a file. Only run after the claim is verified (the "Claim VERIFIED"
 * email for the same id, or a completed phone check for manual claims).
 *
 *   npx tsx scripts/apply-claim.ts claim-<id>.json --method email-domain|phone [--verified-at YYYY-MM-DD]
 *        [--private-log "<path>/claims-private.jsonl"]
 *
 * Public fields → data/raw/claims.json (committed; the repo is public).
 * Private fields (claimant identity, patient-value answers) → --private-log only,
 * default: PN_PRIVATE_CLAIMS_LOG env var. Never commit them.
 * Then: npm run prepare-data && commit && push (auto-deploys).
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

const ROOT = resolve(__dirname, "..");
const CLAIMS = resolve(ROOT, "data/raw/claims.json");

const PEPTIDE_ALIASES: Record<string, string> = {
  "nad+": "nad-plus", nad: "nad-plus", "nad plus": "nad-plus", "pt 141": "pt-141", bremelanotide: "pt-141",
  "bpc 157": "bpc-157", bpc157: "bpc-157", "tb 500": "tb-500", "ghk cu": "ghk-cu", "copper peptide": "ghk-cu",
  "cjc-1295/ipamorelin": "cjc-1295-ipamorelin", "cjc 1295 ipamorelin": "cjc-1295-ipamorelin", ozempic: "semaglutide",
  wegovy: "semaglutide", mounjaro: "tirzepatide", zepbound: "tirzepatide", saxenda: "liraglutide",
};

// Only these slugs are published as peptides (= the keys of PEPTIDE_RULES in
// scripts/tag-peptides.ts; keep in sync by hand). Anything else the claimant typed
// goes into services, so free text can't mint new peptide pages.
const PEPTIDE_SLUGS = new Set([
  "bpc-157", "tb-500", "ghk-cu", "semaglutide", "tirzepatide", "sermorelin", "pt-141", "cjc-1295-ipamorelin",
  "nad-plus", "epithalon", "selank", "semax", "kisspeptin", "tesamorelin", "ghrp-6", "ghrp-2", "hexarelin",
  "mots-c", "glutathione", "hcg", "liraglutide", "5-amino-1mq", "retatrutide", "oxytocin", "aod-9604",
  "thymosin-alpha-1", "igf-1-lr3", "dsip", "ss-31", "melanotan-2",
]);

function slug(s: string): string {
  const k = s.trim().toLowerCase();
  return PEPTIDE_ALIASES[k] ?? k.replace(/[^a-z0-9+]+/g, "-").replace(/^-|-$/g, "");
}

function splitList(s: unknown): string[] {
  return typeof s === "string" ? s.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 25) : [];
}

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const method = opt("method");
if (!file || !method || !["email-domain", "phone"].includes(method)) {
  console.error("usage: npx tsx scripts/apply-claim.ts claim-<id>.json --method email-domain|phone [--verified-at YYYY-MM-DD]");
  process.exit(1);
}
const verifiedAt = opt("verified-at") ?? new Date().toISOString().slice(0, 10);
const privateLog = opt("private-log") ?? process.env.PN_PRIVATE_CLAIMS_LOG;

const c = JSON.parse(readFileSync(resolve(file), "utf-8"));
const providers = JSON.parse(readFileSync(resolve(ROOT, "data/raw/providers.json"), "utf-8")) as { slug: string }[];
if (!providers.some((p) => p.slug === c.slug)) {
  console.error(`unknown provider slug: ${c.slug}`);
  process.exit(1);
}

const publicClaim: Record<string, unknown> = { slug: c.slug, verifiedAt, method };
if (c.description) publicClaim.description = String(c.description).trim();
const services = splitList(c.services);
const peptides: string[] = [];
for (const name of splitList(c.peptides)) {
  const s = slug(name);
  if (PEPTIDE_SLUGS.has(s)) peptides.push(s);
  else if (!services.some((x) => x.toLowerCase() === name.toLowerCase())) {
    services.push(name);
    console.log(`peptide "${name}" is not on the allow-list → listed under services`);
  }
}
if (services.length) publicClaim.services = services;
if (peptides.length) publicClaim.peptides = [...new Set(peptides)];
if (c.telehealth === "yes") publicClaim.telehealth = { available: true };
if (c.telehealth === "no") publicClaim.telehealth = { available: false };
if (c.hours) publicClaim.hoursText = String(c.hours).trim();
if (c.bookingUrl && /^https:\/\//i.test(c.bookingUrl)) publicClaim.bookingUrl = c.bookingUrl;
if (["accepted", "not-accepted", "varies"].includes(c.insurance)) publicClaim.insurance = c.insurance;

const claims: Record<string, unknown>[] = existsSync(CLAIMS) ? JSON.parse(readFileSync(CLAIMS, "utf-8")) : [];
const next = claims.filter((x) => x.slug !== c.slug);
next.push(publicClaim);
next.sort((a, b) => String(a.slug).localeCompare(String(b.slug)));
writeFileSync(CLAIMS, JSON.stringify(next, null, 2) + "\n");
console.log(`claims.json: ${c.slug} → claimed (${method}, ${verifiedAt}); ${next.length} claims total`);

const words = String(c.description ?? "").split(/\s+/).filter(Boolean).length;
console.log(words >= 60 ? `description ${words} words → provider page will be indexed` : `description ${words} words (<60) → page stays noindex until the practice adds more`);
if (c.corrections) console.log(`NOTE corrections requested (apply by hand to data/raw/providers.json): ${c.corrections}`);

const privateRow = {
  claimId: c.claimId, slug: c.slug, verifiedAt, method, claimantName: c.claimantName, claimantRole: c.claimantRole,
  claimantEmail: c.claimantEmail, claimantPhone: c.claimantPhone, patientValue: c.patientValue, patientSources: c.patientSources,
  submittedAt: c.submittedAt,
};
if (privateLog) {
  mkdirSync(dirname(privateLog), { recursive: true });
  appendFileSync(privateLog, JSON.stringify(privateRow) + "\n");
  console.log(`private fields appended to ${privateLog}`);
} else {
  console.warn("No --private-log / PN_PRIVATE_CLAIMS_LOG: claimant + patient-value answers were NOT recorded. Rerun with --private-log to keep them.");
}
console.log("Next: npm run prepare-data && git add data/raw/claims.json && git commit && git push");
