import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

// --- Helpers ---
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stateSlug(state: string): string {
  return slugify(state);
}

// US state + DC + territory codes — anything outside this set gets dropped
const VALID_STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  "DC","PR","VI","GU","AS","MP",
]);

// City-name validator: reject numeric-only, single/double letters, or obvious junk
function isValidCityName(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (trimmed.length < 3) return false;
  if (/^\d+$/.test(trimmed)) return false;
  if (/^(st|rd|th|nd|ave|blvd|ln|dr)$/i.test(trimmed)) return false;
  if (/\b(parking|spot|suite|unit|floor)\b/i.test(trimmed)) return false;
  // Must contain at least one letter sequence of 3+
  if (!/[A-Za-z]{3,}/.test(trimmed)) return false;
  return true;
}

const rejectedLocalities: { reason: string; city?: string; stateCode?: string; state?: string }[] = [];

// --- Load source data ---
const ROOT = resolve(__dirname, "..");
const RAW = resolve(ROOT, "data/raw");
const OUT = resolve(ROOT, "src/lib/data");
const PUBLIC = resolve(ROOT, "public");

mkdirSync(OUT, { recursive: true });

interface RawCity {
  name: string;
  stateCode: string;
  state: string;
}

interface RawProvider {
  slug: string;
  name: string;
  type: "clinic" | "pharmacy" | "wellness-center";
  status: "active" | "pending" | "closed";
  address: {
    street: string;
    city: string;
    state: string;
    stateCode: string;
    zip: string;
    lat?: number;
    lng?: number;
  };
  phone?: string;
  website?: string;
  email?: string;
  description: string;
  bookingUrl?: string;
  googleMapsUrl?: string;
  services: string[];
  peptides: string[];
  insurance: "accepted" | "not-accepted" | "varies" | "unknown";
  hours?: Record<string, { open: string; close: string }>;
  featured: boolean;
  verified: boolean;
  lastVerified?: string;
  telehealth?: { available: boolean; statesServed: string[]; visitTypes: string[] };
  pricing?: { consultFee?: string; acceptsHSA?: boolean; acceptsFSA?: boolean; membershipAvailable?: boolean; financingAvailable?: boolean };
  pharmacyDetails?: { compoundingType?: string; pcabAccredited?: boolean; shipsToStates?: string[] };
  consultation?: { requiresLabs?: boolean; initialLabsIncluded?: boolean; followUpCadence?: string; refillPolicy?: string };
  verificationTier?: "listed" | "verified" | "claimed" | "trusted";
  treatmentGoals?: string[];
}

const providers: RawProvider[] = JSON.parse(
  readFileSync(resolve(RAW, "providers.json"), "utf-8")
);
const rawCities: RawCity[] = JSON.parse(
  readFileSync(resolve(RAW, "cities.json"), "utf-8")
);

// Filter to active providers
const activeProviders = providers.filter((p) => p.status === "active");

console.log(`Loaded ${providers.length} providers (${activeProviders.length} active)`);
console.log(`Loaded ${rawCities.length} cities from seed list`);

// --- Build providers.json (pass-through validated) ---
writeFileSync(resolve(OUT, "providers.json"), JSON.stringify(activeProviders, null, 2));
console.log(`Wrote ${activeProviders.length} providers to providers.json`);

// --- Build cities.json ---
// Group providers by city+stateCode
const cityProviderMap = new Map<string, RawProvider[]>();
for (const p of activeProviders) {
  const key = `${slugify(p.address.city)}|${p.address.stateCode}`;
  if (!cityProviderMap.has(key)) cityProviderMap.set(key, []);
  cityProviderMap.get(key)!.push(p);
}

// Merge with seed cities (ensures empty city pages exist)
const citySet = new Map<string, RawCity>();
for (const c of rawCities) {
  if (!VALID_STATE_CODES.has(c.stateCode)) {
    rejectedLocalities.push({ reason: "invalid-state-code", city: c.name, stateCode: c.stateCode, state: c.state });
    continue;
  }
  if (!isValidCityName(c.name)) {
    rejectedLocalities.push({ reason: "invalid-city-name", city: c.name, stateCode: c.stateCode, state: c.state });
    continue;
  }
  citySet.set(`${slugify(c.name)}|${c.stateCode}`, c);
}
// Also add any cities from providers not in seed list
for (const p of activeProviders) {
  if (!VALID_STATE_CODES.has(p.address.stateCode)) {
    rejectedLocalities.push({ reason: "invalid-state-code", city: p.address.city, stateCode: p.address.stateCode, state: p.address.state });
    continue;
  }
  if (!isValidCityName(p.address.city)) {
    rejectedLocalities.push({ reason: "invalid-city-name", city: p.address.city, stateCode: p.address.stateCode, state: p.address.state });
    continue;
  }
  const key = `${slugify(p.address.city)}|${p.address.stateCode}`;
  if (!citySet.has(key)) {
    citySet.set(key, {
      name: p.address.city,
      stateCode: p.address.stateCode,
      state: p.address.state,
    });
  }
}

interface CityOutput {
  slug: string;
  name: string;
  stateCode: string;
  state: string;
  stateSlug: string;
  providerCount: number;
  clinicCount: number;
  pharmacyCount: number;
  wellnessCenterCount: number;
  providers: string[];
  services: string[];
  peptides: string[];
}

const cities: CityOutput[] = [];
for (const [key, rawCity] of citySet) {
  const provs = cityProviderMap.get(key) || [];
  const servicesSet = new Set<string>();
  const peptidesSet = new Set<string>();
  for (const p of provs) {
    p.services.forEach((s) => servicesSet.add(s));
    p.peptides.forEach((s) => peptidesSet.add(s));
  }

  cities.push({
    slug: slugify(rawCity.name),
    name: rawCity.name,
    stateCode: rawCity.stateCode,
    state: rawCity.state,
    stateSlug: stateSlug(rawCity.state),
    providerCount: provs.length,
    clinicCount: provs.filter((p) => p.type === "clinic").length,
    pharmacyCount: provs.filter((p) => p.type === "pharmacy").length,
    wellnessCenterCount: provs.filter((p) => p.type === "wellness-center").length,
    providers: provs.map((p) => p.slug),
    services: [...servicesSet].sort(),
    peptides: [...peptidesSet].sort(),
  });
}

// Sort by provider count desc, then alphabetically
cities.sort((a, b) => b.providerCount - a.providerCount || a.name.localeCompare(b.name));

writeFileSync(resolve(OUT, "cities.json"), JSON.stringify(cities, null, 2));
console.log(`Wrote ${cities.length} cities to cities.json`);

// Write locality rejection log for Supabase cleanup pass
if (rejectedLocalities.length > 0) {
  const logPath = resolve(ROOT, "data/malformed-locality-cleanup.log");
  writeFileSync(logPath, JSON.stringify(rejectedLocalities, null, 2));
  console.log(`Logged ${rejectedLocalities.length} rejected locality entries to malformed-locality-cleanup.log`);
}

// --- Build states.json ---
const stateMap = new Map<string, { name: string; code: string; cities: Set<string>; providerCount: number }>();
for (const c of cities) {
  if (!VALID_STATE_CODES.has(c.stateCode)) continue;
  if (!stateMap.has(c.stateCode)) {
    stateMap.set(c.stateCode, {
      name: c.state,
      code: c.stateCode,
      cities: new Set(),
      providerCount: 0,
    });
  }
  const st = stateMap.get(c.stateCode)!;
  st.cities.add(c.slug);
  st.providerCount += c.providerCount;
}

interface StateOutput {
  slug: string;
  name: string;
  code: string;
  providerCount: number;
  cityCount: number;
  cities: string[];
}

const states: StateOutput[] = [...stateMap.values()]
  .map((s) => ({
    slug: stateSlug(s.name),
    name: s.name,
    code: s.code,
    providerCount: s.providerCount,
    cityCount: s.cities.size,
    cities: [...s.cities].sort(),
  }))
  .sort((a, b) => b.providerCount - a.providerCount || a.name.localeCompare(b.name));

writeFileSync(resolve(OUT, "states.json"), JSON.stringify(states, null, 2));
console.log(`Wrote ${states.length} states to states.json`);

// --- Build services.json ---
// Services derived from peptides offered across providers
const serviceDescriptions: Record<string, { name: string; type: "peptide" | "therapy" | "treatment"; description: string }> = {
  "bpc-157": { name: "BPC-157", type: "peptide", description: "BPC-157 is a peptide used for tissue repair, joint healing, and gut health." },
  "semaglutide": { name: "Semaglutide", type: "peptide", description: "Semaglutide is a GLP-1 receptor agonist used for weight management." },
  "tirzepatide": { name: "Tirzepatide", type: "peptide", description: "Tirzepatide is a dual GIP/GLP-1 receptor agonist for weight loss and blood sugar control." },
  "ghk-cu": { name: "GHK-Cu", type: "peptide", description: "GHK-Cu is a copper peptide used for skin rejuvenation and wound healing." },
  "cjc-1295-ipamorelin": { name: "CJC-1295 / Ipamorelin", type: "peptide", description: "CJC-1295 and Ipamorelin are growth hormone-releasing peptides used for anti-aging and body composition." },
  "pt-141": { name: "PT-141", type: "peptide", description: "PT-141 (Bremelanotide) is a peptide used for sexual health and libido." },
  "sermorelin": { name: "Sermorelin", type: "peptide", description: "Sermorelin is a growth hormone-releasing hormone analog used for anti-aging therapy." },
  "tb-500": { name: "TB-500", type: "peptide", description: "TB-500 (Thymosin Beta-4) is a peptide used for tissue repair and recovery." },
  "nad-plus": { name: "NAD+", type: "therapy", description: "NAD+ therapy supports cellular energy, metabolism, and anti-aging." },
  "peptide-therapy": { name: "Peptide Therapy", type: "therapy", description: "Peptide therapy uses targeted peptides for wellness, anti-aging, weight loss, and recovery." },
  "hormone-therapy": { name: "Hormone Therapy", type: "therapy", description: "Hormone replacement therapy (HRT) for testosterone, estrogen, and thyroid optimization." },
  "iv-therapy": { name: "IV Therapy", type: "therapy", description: "Intravenous vitamin and nutrient therapy for hydration, recovery, and wellness." },
  "weight-loss": { name: "Weight Loss", type: "treatment", description: "Medical weight loss programs including GLP-1 peptides, semaglutide, and tirzepatide." },
  "epithalon": { name: "Epithalon", type: "peptide", description: "Epithalon (Epitalon) is a synthetic tetrapeptide studied for anti-aging and telomere support." },
  "selank": { name: "Selank", type: "peptide", description: "Selank is a synthetic peptide used for anxiety, mood, and cognitive function." },
  "semax": { name: "Semax", type: "peptide", description: "Semax is a synthetic peptide used for cognitive enhancement and neuroprotection." },
  "kisspeptin": { name: "Kisspeptin", type: "peptide", description: "Kisspeptin is a peptide involved in reproductive hormone regulation and fertility." },
  "tesamorelin": { name: "Tesamorelin", type: "peptide", description: "Tesamorelin is a growth hormone-releasing hormone analog used for visceral fat reduction." },
  "ghrp-6": { name: "GHRP-6", type: "peptide", description: "GHRP-6 is a growth hormone-releasing peptide used for GH stimulation and recovery." },
  "ghrp-2": { name: "GHRP-2", type: "peptide", description: "GHRP-2 is a growth hormone-releasing peptide used for GH stimulation and body composition." },
  "hexarelin": { name: "Hexarelin", type: "peptide", description: "Hexarelin is a potent growth hormone-releasing peptide used for GH stimulation." },
  "mots-c": { name: "MOTS-c", type: "peptide", description: "MOTS-c is a mitochondrial-derived peptide studied for metabolic health and exercise capacity." },
  "glutathione": { name: "Glutathione", type: "peptide", description: "Glutathione is a tripeptide antioxidant used for detoxification, immune support, and skin health." },
  "hcg": { name: "HCG", type: "peptide", description: "HCG (human chorionic gonadotropin) is used for hormone optimization, fertility, and TRT support." },
  "liraglutide": { name: "Liraglutide", type: "peptide", description: "Liraglutide is a GLP-1 receptor agonist used for weight loss and blood sugar control (Saxenda, Victoza)." },
  "5-amino-1mq": { name: "5-Amino-1MQ", type: "peptide", description: "5-Amino-1MQ is a small molecule studied for fat loss and metabolic health by inhibiting NNMT." },
  "retatrutide": { name: "Retatrutide", type: "peptide", description: "Retatrutide is a triple GIP/GLP-1/glucagon receptor agonist studied for weight loss." },
  "oxytocin": { name: "Oxytocin", type: "peptide", description: "Oxytocin is a peptide hormone used for bonding, mood, and intimacy support." },
  "aod-9604": { name: "AOD-9604", type: "peptide", description: "AOD-9604 is a modified fragment of human growth hormone studied for fat loss." },
  "thymosin-alpha-1": { name: "Thymosin Alpha-1", type: "peptide", description: "Thymosin Alpha-1 is a peptide used for immune modulation and chronic infection support." },
  "igf-1-lr3": { name: "IGF-1 LR3", type: "peptide", description: "IGF-1 LR3 is a modified form of insulin-like growth factor-1 used for muscle growth and recovery." },
  "dsip": { name: "DSIP", type: "peptide", description: "DSIP (Delta Sleep-Inducing Peptide) is used for sleep quality and stress reduction." },
  "ss-31": { name: "SS-31", type: "peptide", description: "SS-31 (Elamipretide) is a mitochondrial-targeted peptide studied for cellular energy and aging." },
  "melanotan-2": { name: "Melanotan-2", type: "peptide", description: "Melanotan-2 is a synthetic peptide used for tanning and libido support." },
};

interface ServiceOutput {
  slug: string;
  name: string;
  type: "peptide" | "therapy" | "treatment";
  providerCount: number;
  cityCount: number;
  description: string;
}

const serviceCountMap = new Map<string, { providers: Set<string>; cities: Set<string> }>();

for (const p of activeProviders) {
  const allServices = [...p.peptides, ...p.services];
  for (const s of allServices) {
    const slug = slugify(s);
    if (!serviceCountMap.has(slug)) {
      serviceCountMap.set(slug, { providers: new Set(), cities: new Set() });
    }
    const entry = serviceCountMap.get(slug)!;
    entry.providers.add(p.slug);
    entry.cities.add(`${slugify(p.address.city)}|${p.address.stateCode}`);
  }
}

const services: ServiceOutput[] = [];
for (const [slug, counts] of serviceCountMap) {
  const desc = serviceDescriptions[slug];
  services.push({
    slug,
    name: desc?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    type: desc?.type || "therapy",
    providerCount: counts.providers.size,
    cityCount: counts.cities.size,
    description: desc?.description || `Find providers offering ${slug.replace(/-/g, " ")} near you.`,
  });
}

// Also add services that have descriptions but no providers yet
for (const [slug, desc] of Object.entries(serviceDescriptions)) {
  if (!serviceCountMap.has(slug)) {
    services.push({
      slug,
      name: desc.name,
      type: desc.type,
      providerCount: 0,
      cityCount: 0,
      description: desc.description,
    });
  }
}

services.sort((a, b) => b.providerCount - a.providerCount || a.name.localeCompare(b.name));

writeFileSync(resolve(OUT, "services.json"), JSON.stringify(services, null, 2));
console.log(`Wrote ${services.length} services to services.json`);

// --- Build telehealth.json ---
interface TelehealthStateEntry {
  stateCode: string;
  stateName: string;
  stateSlug: string;
  providerSlugs: string[];
  providerCount: number;
}

const telehealthProviders = activeProviders.filter((p) => p.telehealth?.available);
const telehealthByState = new Map<string, string[]>();

for (const p of telehealthProviders) {
  const served = p.telehealth?.statesServed ?? [p.address.stateCode];
  for (const sc of served) {
    if (!telehealthByState.has(sc)) telehealthByState.set(sc, []);
    telehealthByState.get(sc)!.push(p.slug);
  }
}

// Also include providers' home state
for (const p of telehealthProviders) {
  const sc = p.address.stateCode;
  if (!telehealthByState.has(sc)) telehealthByState.set(sc, []);
  if (!telehealthByState.get(sc)!.includes(p.slug)) {
    telehealthByState.get(sc)!.push(p.slug);
  }
}

// Map state codes to names (from states data we already built)
const stateCodeToName = new Map<string, string>();
for (const s of states) {
  stateCodeToName.set(s.code, s.name);
}

const telehealthStates: TelehealthStateEntry[] = [...telehealthByState.entries()]
  .map(([code, slugs]) => ({
    stateCode: code,
    stateName: stateCodeToName.get(code) ?? code,
    stateSlug: slugify(stateCodeToName.get(code) ?? code),
    providerSlugs: slugs,
    providerCount: slugs.length,
  }))
  .sort((a, b) => b.providerCount - a.providerCount || a.stateName.localeCompare(b.stateName));

// Extend telehealth state entries with aggregated visitTypes
interface TelehealthStateEntryExtended extends TelehealthStateEntry {
  visitTypes: string[];
}

const telehealthStatesExtended: TelehealthStateEntryExtended[] = telehealthStates.map((ts) => {
  const visitTypesSet = new Set<string>();
  for (const slug of ts.providerSlugs) {
    const p = activeProviders.find((ap) => ap.slug === slug);
    if (p?.telehealth?.visitTypes) {
      for (const vt of p.telehealth.visitTypes) {
        visitTypesSet.add(vt);
      }
    }
  }
  return { ...ts, visitTypes: [...visitTypesSet].sort() };
});

writeFileSync(resolve(OUT, "telehealth.json"), JSON.stringify(telehealthStatesExtended, null, 2));
console.log(`Wrote ${telehealthStatesExtended.length} telehealth state entries (${telehealthProviders.length} telehealth providers)`);

// --- Build telehealth-peptides.json ---
const TELEHEALTH_PEPTIDE_THRESHOLD = 3;

interface TelehealthPeptideEntry {
  slug: string;
  name: string;
  description: string;
  providerCount: number;
  providerSlugs: string[];
}

const telehealthPeptideMap = new Map<string, { name: string; providers: Set<string> }>();

for (const p of telehealthProviders) {
  for (const pep of p.peptides) {
    const pepSlug = slugify(pep);
    if (!telehealthPeptideMap.has(pepSlug)) {
      telehealthPeptideMap.set(pepSlug, { name: pep, providers: new Set() });
    }
    telehealthPeptideMap.get(pepSlug)!.providers.add(p.slug);
  }
}

const telehealthPeptides: TelehealthPeptideEntry[] = [...telehealthPeptideMap.entries()]
  .filter(([, data]) => data.providers.size >= TELEHEALTH_PEPTIDE_THRESHOLD)
  .map(([slug, data]) => {
    const svcDesc = serviceDescriptions[slug];
    return {
      slug,
      name: svcDesc?.name ?? data.name,
      description: svcDesc?.description ?? `Find telehealth providers offering ${data.name} therapy.`,
      providerCount: data.providers.size,
      providerSlugs: [...data.providers],
    };
  })
  .sort((a, b) => b.providerCount - a.providerCount || a.name.localeCompare(b.name));

writeFileSync(resolve(OUT, "telehealth-peptides.json"), JSON.stringify(telehealthPeptides, null, 2));
console.log(`Wrote ${telehealthPeptides.length} telehealth peptide entries (threshold: ${TELEHEALTH_PEPTIDE_THRESHOLD})`);

// --- Build goals.json ---
interface GoalEntry {
  slug: string;
  name: string;
  description: string;
  peptides: string[];
  providerCount: number;
  providerSlugs: string[];
}

const GOAL_DEFINITIONS: Record<string, { name: string; description: string; peptides: string[] }> = {
  "weight-loss": {
    name: "Weight Loss",
    description: "Medical weight loss programs using GLP-1 receptor agonists and other peptides to support sustainable weight management.",
    peptides: ["Semaglutide", "Tirzepatide", "Retatrutide", "AOD-9604"],
  },
  "anti-aging": {
    name: "Anti-Aging",
    description: "Peptide therapies targeting cellular regeneration, skin rejuvenation, and longevity to support healthy aging.",
    peptides: ["GHK-Cu", "Epithalon", "NAD+", "Sermorelin", "CJC-1295", "Ipamorelin", "Pinealon"],
  },
  "hormone-optimization": {
    name: "Hormone Optimization",
    description: "Peptide-based hormone replacement and optimization therapies for testosterone, growth hormone, and thyroid function.",
    peptides: ["Sermorelin", "CJC-1295", "Ipamorelin", "Tesamorelin", "Gonadorelin", "Kisspeptin"],
  },
  "injury-recovery": {
    name: "Injury Recovery",
    description: "Peptides that accelerate tissue repair, reduce inflammation, and support musculoskeletal healing.",
    peptides: ["BPC-157", "TB-500", "Thymosin Beta-4", "KPV", "Pentosan Polysulfate"],
  },
  "sexual-health": {
    name: "Sexual Health",
    description: "Peptide therapies for libido enhancement, erectile function, and overall sexual wellness.",
    peptides: ["PT-141", "Bremelanotide", "Kisspeptin"],
  },
  "cognitive-enhancement": {
    name: "Cognitive Enhancement",
    description: "Peptides that support brain health, neuroprotection, memory, and mental clarity.",
    peptides: ["Selank", "Semax", "Dihexa", "Pinealon", "NAD+"],
  },
};

const goals: GoalEntry[] = Object.entries(GOAL_DEFINITIONS).map(([slug, def]) => {
  const peptidesLower = def.peptides.map((p) => p.toLowerCase());
  const matching = activeProviders.filter((p) =>
    p.peptides.some((pep) => peptidesLower.includes(pep.toLowerCase())) ||
    (p.treatmentGoals ?? []).includes(slug)
  );
  return {
    slug,
    name: def.name,
    description: def.description,
    peptides: def.peptides,
    providerCount: matching.length,
    providerSlugs: matching.map((p) => p.slug),
  };
});

writeFileSync(resolve(OUT, "goals.json"), JSON.stringify(goals, null, 2));
console.log(`Wrote ${goals.length} treatment goals to goals.json`);

// --- Build search-index.json (lightweight for client-side search) ---
interface SearchIndexEntry {
  slug: string;
  name: string;
  city: string;
  stateCode: string;
  type: string;
  peptides: string[];
  services: string[];
  treatmentGoals: string[];
  verificationTier: string;
  insurance: string;
  telehealthAvailable: boolean;
}

const searchIndex: SearchIndexEntry[] = activeProviders.map((p) => ({
  slug: p.slug,
  name: p.name,
  city: p.address.city,
  stateCode: p.address.stateCode,
  type: p.type,
  peptides: p.peptides,
  services: p.services,
  treatmentGoals: p.treatmentGoals ?? [],
  verificationTier: p.verificationTier ?? "listed",
  insurance: p.insurance,
  telehealthAvailable: p.telehealth?.available ?? false,
}));

writeFileSync(resolve(OUT, "search-index.json"), JSON.stringify(searchIndex, null, 2));
console.log(`Wrote ${searchIndex.length} entries to search-index.json`);

// --- Generate sitemap.xml ---
const BASE_URL = "https://www.peptidesnearby.com";

// Sitemap quality thresholds — pages below these get excluded from the sitemap
// (they still render, but aren't advertised to Google until they earn their spot)
const MIN_PROVIDERS_PEPTIDE = 3;
const MIN_PROVIDERS_STATE = 10;
const MIN_PROVIDERS_CITY = 3;
const MIN_PROVIDERS_GOAL = 5;
const MIN_PROVIDERS_TELEHEALTH_STATE = 3;

const urls: string[] = [
  "/",
  "/states",
  "/clinics",
  "/pharmacies",
  "/wellness-centers",
  "/search",
  "/compare",
  "/telehealth",
  "/blog",
  "/submit",
  "/about",
  "/privacy",
  "/terms",
];

const sitemapStats = {
  stateIncluded: 0, stateExcluded: 0,
  cityIncluded: 0, cityExcluded: 0,
  providerIncluded: 0,
  peptideIncluded: 0, peptideExcluded: 0,
  telehealthStateIncluded: 0, telehealthStateExcluded: 0,
  goalIncluded: 0, goalExcluded: 0,
  telehealthPeptideIncluded: 0,
};

// State pages — gate on provider count + valid state code
for (const s of states) {
  if (!VALID_STATE_CODES.has(s.code)) { sitemapStats.stateExcluded++; continue; }
  if (s.providerCount < MIN_PROVIDERS_STATE) { sitemapStats.stateExcluded++; continue; }
  urls.push(`/${s.slug}`);
  sitemapStats.stateIncluded++;
}

// City pages — gate on provider count
for (const c of cities) {
  if (c.providerCount < MIN_PROVIDERS_CITY) { sitemapStats.cityExcluded++; continue; }
  urls.push(`/${c.stateSlug}/${c.slug}`);
  sitemapStats.cityIncluded++;
}

// Provider pages — keep all active providers (they're the core inventory)
for (const p of activeProviders) {
  urls.push(`/providers/${p.slug}`);
  sitemapStats.providerIncluded++;
}

// Peptide pages — gate on provider count (this is the big thin-content fix)
for (const s of services) {
  if (s.providerCount < MIN_PROVIDERS_PEPTIDE) { sitemapStats.peptideExcluded++; continue; }
  urls.push(`/peptides/${s.slug}`);
  sitemapStats.peptideIncluded++;
}

// Telehealth state pages
for (const t of telehealthStates) {
  if (t.providerCount < MIN_PROVIDERS_TELEHEALTH_STATE) { sitemapStats.telehealthStateExcluded++; continue; }
  urls.push(`/telehealth/${t.stateSlug}`);
  sitemapStats.telehealthStateIncluded++;
}

// Goal pages — gate on provider count
for (const g of goals) {
  const providerCount = (g as { providerCount?: number }).providerCount ?? 0;
  if (providerCount < MIN_PROVIDERS_GOAL) { sitemapStats.goalExcluded++; continue; }
  urls.push(`/goals/${g.slug}`);
  sitemapStats.goalIncluded++;
}

// Telehealth peptide pages — already filtered upstream (≥3 providers)
for (const tp of telehealthPeptides) {
  urls.push(`/telehealth/peptides/${tp.slug}`);
  sitemapStats.telehealthPeptideIncluded++;
}

console.log(`Sitemap quality gate: ${JSON.stringify(sitemapStats)}`);

const today = new Date().toISOString().split("T")[0];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${today}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`;

writeFileSync(resolve(PUBLIC, "sitemap.xml"), sitemap);
console.log(`Wrote sitemap.xml with ${urls.length} URLs`);

// --- Reviews (copy from raw if exists) ---
import { existsSync } from "fs";
const rawReviewsPath = resolve(RAW, "reviews.json");
const outReviewsPath = resolve(OUT, "reviews.json");
let reviewCount = 0;
if (existsSync(rawReviewsPath)) {
  const reviewsRaw = readFileSync(rawReviewsPath, "utf-8");
  const reviewsData = JSON.parse(reviewsRaw);
  reviewCount = reviewsData.length;
  writeFileSync(outReviewsPath, JSON.stringify(reviewsData, null, 2));
} else {
  writeFileSync(outReviewsPath, "[]");
}
console.log(`Wrote ${reviewCount} reviews to reviews.json`);

// --- Summary ---
console.log("\n--- Build Summary ---");
console.log(`Providers: ${activeProviders.length}`);
console.log(`Cities: ${cities.length} (${cities.filter((c) => c.providerCount > 0).length} with providers)`);
console.log(`States: ${states.length}`);
console.log(`Services: ${services.length}`);
console.log(`Search index: ${searchIndex.length}`);
console.log(`Telehealth states: ${telehealthStates.length}`);
console.log(`Treatment goals: ${goals.length}`);
console.log(`Reviews: ${reviewCount}`);
console.log(`Sitemap URLs: ${urls.length}`);
