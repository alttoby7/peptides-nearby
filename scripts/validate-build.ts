/**
 * Build-time validation gates for the canonical URL fix.
 *
 * Hard-fails the build if structural invariants are violated. See the plan at
 * /home/trisha/.claude/plans/indexed-knitting-pine.md Phase 0.4.
 *
 * Run order: after `next build` completes (so `out/` exists). Can also run
 * standalone after `prepare-data.ts` for fast feedback on data integrity.
 *
 * Gates:
 *   1. DATA INTEGRITY — every state/city/telehealth slug resolves via
 *      stateSlugFromAny. No orphan slugs.
 *   2. EXPORT INTEGRITY (most important) — zero unexpected 404 fallback HTML
 *      files. Anything that Next exports as a 404 fallback is a route/data
 *      mismatch.
 *   3. SITEMAP INTEGRITY — every <loc> in out/sitemap.xml maps to a real
 *      exported non-error HTML file.
 *   4. SOURCE/LINK INTEGRITY — zero raw `slugify(...state...)` calls in src/
 *      outside the canonical allowlist.
 *
 * Locality-exclusions log is NOT a hard-fail gate in the first pass —
 * heuristic rejects are surfaced for manual review per the plan.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";
import { stateSlugFromAny } from "../src/lib/geo/states";

const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "out");
const SRC = resolve(ROOT, "src");
const DATA = resolve(ROOT, "src/lib/data");
const PUBLIC = resolve(ROOT, "public");

const failures: string[] = [];
const warnings: string[] = [];

function fail(gate: string, msg: string) {
  failures.push(`[${gate}] ${msg}`);
}

function warn(gate: string, msg: string) {
  warnings.push(`[${gate}] ${msg}`);
}

// ---------- GATE 1: DATA INTEGRITY ----------
function gateData() {
  const cities: { slug: string; stateCode: string; stateSlug: string }[] =
    JSON.parse(readFileSync(resolve(DATA, "cities.json"), "utf-8"));
  const states: { slug: string; code: string }[] = JSON.parse(
    readFileSync(resolve(DATA, "states.json"), "utf-8")
  );
  const telehealth: { stateCode: string; stateSlug: string }[] = JSON.parse(
    readFileSync(resolve(DATA, "telehealth.json"), "utf-8")
  );

  const stateSlugSet = new Set(states.map((s) => s.slug));

  let orphanCities = 0;
  for (const c of cities) {
    const expected = stateSlugFromAny(c.stateCode);
    if (!expected) {
      fail("data", `city ${c.slug} has unresolvable stateCode '${c.stateCode}'`);
      orphanCities++;
    } else if (expected !== c.stateSlug) {
      fail("data", `city ${c.slug} has stateSlug '${c.stateSlug}', expected '${expected}'`);
      orphanCities++;
    } else if (!stateSlugSet.has(c.stateSlug)) {
      fail("data", `city ${c.slug} references stateSlug '${c.stateSlug}' which has no state page`);
      orphanCities++;
    }
  }

  for (const s of states) {
    const expected = stateSlugFromAny(s.code);
    if (!expected) {
      fail("data", `state ${s.code} ('${s.slug}') has unresolvable code`);
    } else if (expected !== s.slug) {
      fail("data", `state ${s.code} has slug '${s.slug}', expected '${expected}'`);
    }
  }

  for (const t of telehealth) {
    const expected = stateSlugFromAny(t.stateCode);
    if (!expected) {
      fail("data", `telehealth state ${t.stateCode} has unresolvable code`);
    } else if (expected !== t.stateSlug) {
      fail("data", `telehealth state ${t.stateCode} has stateSlug '${t.stateSlug}', expected '${expected}'`);
    }
  }

  console.log(
    `[data] ${cities.length} cities, ${states.length} states, ${telehealth.length} telehealth states checked; orphan cities: ${orphanCities}`
  );
}

// ---------- GATE 2: EXPORT INTEGRITY ----------
// Zero unexpected NEXT_HTTP_ERROR_FALLBACK pages in out/
function gateExport() {
  if (!existsSync(OUT)) {
    warn("export", `out/ does not exist — skip (run \`next build\` first)`);
    return;
  }

  const allowedFallbackPatterns = [
    /\/404\.html$/,
    /\/_not-found\.html$/,
    /\/claim\.html$/, // noindex transactional page; intentional fallback ok
    /\/__/,
  ];

  const offenders: string[] = [];

  function walk(dir: string) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (st.isFile() && name.endsWith(".html")) {
        const rel = "/" + full.slice(OUT.length + 1);
        if (allowedFallbackPatterns.some((p) => p.test(rel))) continue;
        const content = readFileSync(full, "utf-8");
        if (content.includes("NEXT_HTTP_ERROR_FALLBACK")) {
          offenders.push(rel);
        }
      }
    }
  }

  walk(OUT);

  if (offenders.length > 0) {
    fail(
      "export",
      `${offenders.length} unexpected 404 fallback pages in out/. Sample:\n  ${offenders.slice(0, 10).join("\n  ")}`
    );
  } else {
    console.log("[export] zero unexpected 404 fallbacks");
  }
}

// ---------- GATE 3: SITEMAP INTEGRITY ----------
function gateSitemap() {
  const sitemapPath = existsSync(resolve(OUT, "sitemap.xml"))
    ? resolve(OUT, "sitemap.xml")
    : resolve(PUBLIC, "sitemap.xml");

  if (!existsSync(sitemapPath)) {
    fail("sitemap", `sitemap.xml not found at ${sitemapPath}`);
    return;
  }

  const xml = readFileSync(sitemapPath, "utf-8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  const outExists = existsSync(OUT);

  let missing = 0;
  const missingSamples: string[] = [];
  for (const loc of locs) {
    try {
      const url = new URL(loc);
      if (url.hostname !== "www.peptidesnearby.com") {
        fail("sitemap", `loc uses wrong host: ${loc}`);
      }
      if (!outExists) continue;
      // Translate path → file
      let path = url.pathname;
      if (path === "/") path = "/index";
      const candidate = resolve(OUT, "." + path + ".html");
      const candidateIndex = resolve(OUT, "." + path + "/index.html");
      if (!existsSync(candidate) && !existsSync(candidateIndex)) {
        missing++;
        if (missingSamples.length < 10) missingSamples.push(loc);
      }
    } catch {
      fail("sitemap", `invalid URL in sitemap: ${loc}`);
    }
  }

  if (missing > 0) {
    fail(
      "sitemap",
      `${missing} sitemap URLs have no matching exported HTML. Sample:\n  ${missingSamples.join("\n  ")}`
    );
  } else {
    console.log(`[sitemap] ${locs.length} URLs, all valid`);
  }
}

// ---------- GATE 4: SOURCE/LINK INTEGRITY ----------
// Zero direct slugify(state) calls outside the canonical allowlist.
function gateSource() {
  const allowlist = new Set([
    resolve(SRC, "lib/geo/states.ts"),
    resolve(SRC, "lib/seo/paths.ts"),
  ]);

  // Pattern: slugify(...state...) — matches common bad calls like
  //   slugify(state), slugify(provider.address.state), slugify(c.state)
  const pattern = /slugify\s*\([^)]*\bstate\b[^)]*\)/i;

  let offenders = 0;
  function walk(dir: string) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (
        st.isFile() &&
        (name.endsWith(".ts") || name.endsWith(".tsx"))
      ) {
        if (allowlist.has(full)) continue;
        const content = readFileSync(full, "utf-8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i])) {
            const rel = full.slice(ROOT.length + 1);
            fail("source", `${rel}:${i + 1} — direct slugify(*state*): ${lines[i].trim()}`);
            offenders++;
          }
        }
      }
    }
  }

  walk(SRC);

  if (offenders === 0) {
    console.log("[source] zero raw slugify(*state*) calls outside allowlist");
  }
}

// ---------- RUN ----------
console.log("Running validate-build gates...\n");
gateData();
gateExport();
gateSitemap();
gateSource();

console.log("");
if (warnings.length) {
  console.log("Warnings:");
  for (const w of warnings) console.log("  " + w);
  console.log("");
}

if (failures.length > 0) {
  console.error(`FAIL: ${failures.length} validation error(s)\n`);
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}

console.log("All gates passed.");
