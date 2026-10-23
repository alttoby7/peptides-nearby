import assert from "node:assert/strict";
import {
  analyticsConfig,
  ensureGoogleTag,
  initializeGoogleAnalytics,
  isAnalyticsEligible,
  safeCampaignFields,
  sanitizedPageLocation,
  trackDirectoryImpression,
  trackProviderCallClick,
  trackProviderSiteClick,
} from "../src/lib/analytics/measurement";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

function fakeWindow(url: string, webdriver = false) {
  const location = new URL(url);
  return {
    location,
    navigator: { webdriver },
    sessionStorage: new MemoryStorage(),
    dataLayer: [] as unknown[],
  } as unknown as Window & { dataLayer: unknown[]; gtag?: (...args: unknown[]) => void };
}

function interceptingDocument() {
  const requests: string[] = [];
  const doc = {
    querySelector: () => requests.length > 0 ? {} : null,
    createElement: () => ({ async: false, src: "", dataset: {} }),
    head: { appendChild: (node: { src: string }) => { requests.push(node.src); } },
  } as unknown as Document;
  return { doc, requests };
}

let checks = 0;
const check = (condition: unknown, message: string) => { assert.ok(condition, message); checks += 1; };

const local = fakeWindow("http://localhost:3000/arizona/scottsdale?email=private@example.com");
check(!isAnalyticsEligible(local), "localhost must be excluded");
const localNetwork = interceptingDocument();
check(!initializeGoogleAnalytics("G-JXV379RS99", local, localNetwork.doc), "local initialization must stay disabled");
check(localNetwork.requests.length === 0, "local network interceptor must see no analytics request");
ensureGoogleTag(local);
check(!trackDirectoryImpression("local_page", "arizona/scottsdale", local), "local stub must not emit");
check(local.dataLayer.length === 0, "local stub must not queue analytics");

const automated = fakeWindow("https://www.peptidesnearby.com/arizona/scottsdale", true);
ensureGoogleTag(automated);
check(!trackDirectoryImpression("local_page", "arizona/scottsdale", automated), "webdriver QA must be excluded");

const qa = fakeWindow("https://www.peptidesnearby.com/arizona/scottsdale?pn_analytics_exclude=1");
ensureGoogleTag(qa);
check(!trackProviderCallClick(qa), "explicit QA sessions must be excluded");
qa.location = new URL("https://www.peptidesnearby.com/providers/example");
check(!trackProviderCallClick(qa), "QA exclusion must persist for the browser session");

const childFirst = fakeWindow("https://www.peptidesnearby.com/providers/fresh-load");
const childFirstNetwork = interceptingDocument();
check(trackDirectoryImpression("provider_profile", "fresh-load", childFirst), "child-first impression must enter the pending queue");
check(childFirst.dataLayer.length === 0, "pending impression must wait for GA configuration");
check(initializeGoogleAnalytics("G-JXV379RS99", childFirst, childFirstNetwork.doc), "later initializer must succeed");
check((childFirst.dataLayer as unknown[][]).filter((entry) => entry[1] === "eligible_provider_profile_impression").length === 1, "initializer must drain the pending impression exactly once");
check(initializeGoogleAnalytics("G-JXV379RS99", childFirst, childFirstNetwork.doc), "repeated initialization must remain safe");
check((childFirst.dataLayer as unknown[][]).filter((entry) => entry[0] === "config").length === 1, "GA configuration must not duplicate");
check((childFirst.dataLayer as unknown[][]).filter((entry) => entry[1] === "eligible_provider_profile_impression").length === 1, "drained impression must not duplicate");
check(childFirstNetwork.requests.length === 1, "GA loader must be requested exactly once");

const production = fakeWindow("https://www.peptidesnearby.com/providers/example?utm_source=founding_outreach&utm_medium=email&utm_campaign=scottsdale_founding_2026q4&utm_content=example&email=private@example.com");
const productionNetwork = interceptingDocument();
check(initializeGoogleAnalytics("G-JXV379RS99", production, productionNetwork.doc), "eligible production initialization must run");
check(productionNetwork.requests.length === 1 && productionNetwork.requests[0].includes("G-JXV379RS99"), "network interceptor must capture only the GA loader request");
check(trackDirectoryImpression("provider_profile", "example", production), "first eligible profile impression must emit");
check(!trackDirectoryImpression("provider_profile", "example", production), "same-session profile impression must deduplicate");
check(trackProviderSiteClick("website", production), "provider website click must emit");
check(trackProviderSiteClick("booking", production), "provider booking click must emit as a site click");
check(trackProviderCallClick(production), "provider call click must emit");

const queued = production.dataLayer as unknown[][];
check(queued.filter((entry) => entry[1] === "eligible_provider_profile_impression").length === 1, "one impression event expected");
check(queued.some((entry) => entry[1] === "provider_site_click"), "site click event expected");
check(queued.some((entry) => entry[1] === "provider_call_click"), "call click event expected");
check(!JSON.stringify(queued).includes("private@example.com"), "query PII must not enter event payloads");

const config = analyticsConfig(production);
check(config.page_location === "https://www.peptidesnearby.com/providers/example", "page location must omit query text");
check(config.allow_google_signals === false && config.allow_ad_personalization_signals === false, "advertising signals must remain disabled");
check(JSON.stringify(config).includes("founding_outreach"), "safe campaign attribution must be preserved");
check(!JSON.stringify(config).includes("private@example.com"), "raw query values must be excluded from config");
check(sanitizedPageLocation(production.location) === "https://www.peptidesnearby.com/providers/example", "sanitized location expected");
check(Object.keys(safeCampaignFields("?utm_source=a%20b&utm_medium=email")).length === 1, "unsafe campaign values must be dropped");

console.log(`Measurement checks passed (${checks}). Stubbed gtag captured emissions; non-production and QA paths queued no analytics requests.`);
