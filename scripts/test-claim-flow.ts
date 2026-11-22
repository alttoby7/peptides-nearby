import assert from "node:assert/strict";
import domains from "../functions-lib/provider-domains.json";
import { onRequestPost } from "../functions/api/claim";
import { onRequestGet as verifyGet, onRequestPost as verifyPost } from "../functions/api/claim-verify";
import { domainMatches, signToken } from "../functions-lib/claim-shared";

const env = { PN_RESEND_API_KEY: "test", PN_SUBMIT_NOTIFY_TO: "owner@example.com", PN_CLAIM_SECRET: "s3cret-test" };
const sent: Record<string, unknown>[] = [];
let failSends = false;
globalThis.fetch = (async (_u: unknown, init?: RequestInit) => {
  if (failSends) return new Response("{}", { status: 500 });
  sent.push(JSON.parse(String(init?.body)));
  return new Response("{}", { status: 200 });
}) as typeof fetch;

// Pick test providers from the real lookup: one host listed once, one host shared by several slugs.
const DOMAINS = domains as Record<string, { n: string; d: string }>;
const hostCount = new Map<string, number>();
for (const v of Object.values(DOMAINS)) if (v.d) hostCount.set(v.d, (hostCount.get(v.d) ?? 0) + 1);
const unique = Object.entries(DOMAINS).find(([, v]) => v.d && hostCount.get(v.d) === 1 && domainMatches(`a@${v.d}`, v.d));
const shared = Object.entries(DOMAINS).find(
  ([, v]) => v.d && (hostCount.get(v.d) ?? 0) > 1 && !/facebook|instagram|google|yelp|wix|square|linktr|godaddy|wordpress|\.(edu|gov)$/.test(v.d),
);
assert.ok(unique, "no unique-host provider in provider-domains.json");
assert.ok(shared, "no shared-host provider in provider-domains.json");
const [slug, { d: host }] = unique;
const [sharedSlug, { d: sharedHost }] = shared;

function post(body: Record<string, unknown>, origin = "https://www.peptidesnearby.com") {
  return onRequestPost({
    request: new Request("https://www.peptidesnearby.com/api/claim", {
      method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body),
    }), env,
  } as never);
}
function confirm(token: string) {
  return verifyPost({
    request: new Request("https://www.peptidesnearby.com/api/claim-verify", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ t: token }).toString(),
    }), env,
  } as never);
}
const base = { providerSlug: slug, claimantName: "Test Person", claimantRole: "owner", attest: true, description: "x" };

async function main() {
  assert.equal((await post({ ...base, claimantEmail: `a@${host}` }, "https://evil.example")).status, 403);
  assert.equal((await post({ ...base, providerSlug: "nope", claimantEmail: `a@${host}` })).status, 400);
  assert.equal((await post({ ...base, providerSlug: "constructor", claimantEmail: `a@${host}` })).status, 400);
  assert.equal((await post({ ...base, providerSlug: "__proto__", claimantEmail: `a@${host}` })).status, 400);
  assert.equal((await post({ ...base, attest: false, claimantEmail: `a@${host}` })).status, 400);
  assert.equal((await post({ ...base, bookingUrl: "http://x", claimantEmail: `a@${host}` })).status, 400);
  for (const bad of ["x@evil.com,.clinic.com", `x@evil.com,.${host}`, "x y@clinic.com", "x@clinic", "x@-.c", "x@clinic.com;y@evil.com"]) {
    const r = await post({ ...base, claimantEmail: bad });
    assert.equal(r.status, 400, `email ${JSON.stringify(bad)} should be rejected`);
    assert.equal(((await r.json()) as { error: string }).error, "missing_required_fields");
  }
  assert.equal(sent.length, 0, "no email on rejected claims");

  // honeypot: 200, nothing sent
  assert.equal((await post({ ...base, company: "bot", claimantEmail: `a@${host}` })).status, 200);
  assert.equal(sent.length, 0);

  // owner notification fails → 502, claimant gets nothing
  failSends = true;
  assert.equal((await post({ ...base, claimantEmail: `owner@${host}` })).status, 502);
  failSends = false;
  assert.equal(sent.length, 0);

  // domain match → pending email to owner FIRST, then confirm email to claimant
  const r1 = await post({ ...base, claimantEmail: `owner@${host}`, patientValue: "5000-plus", patientSources: "sensitive business detail" });
  assert.equal(r1.status, 200);
  assert.equal(((await r1.json()) as { mode: string }).mode, "email-domain");
  assert.equal(sent.length, 2);
  assert.deepEqual(sent[0].to, ["owner@example.com"]);
  assert.match(String(sent[0].subject), /Claim pending/);
  const id = String(sent[0].subject).match(/\(([0-9a-f]{12})\)$/)![1];
  assert.match(String(sent[0].text), new RegExp(`"claimId": "${id}"`), "payload carries claimId");
  assert.match(String(sent[0].text), /-----BEGIN CLAIM JSON-----\n\{[\s\S]+\}\n-----END CLAIM JSON-----/, "payload wrapped in parse markers");
  assert.doesNotMatch(String(sent[0].text), /patientValue|patientSources|sensitive business detail/, "legacy commercial fields are ignored");
  assert.deepEqual(sent[1].to, [`owner@${host}`]);
  assert.match(String(sent[1].html), /^<p>Hi,<\/p>/);
  assert.doesNotMatch(String(sent[1].html) + String(sent[1].text), /Test Person/, "claimant name not echoed to the clinic inbox");
  const link = String(sent[1].text).match(/https:\/\/www\.peptidesnearby\.com\/api\/claim-verify\?t=\S+/)![0];
  const token = decodeURIComponent(new URL(link).searchParams.get("t")!);

  // GET only shows a confirm form; nothing is verified or sent
  const g = await verifyGet({ request: new Request(link), env } as never);
  assert.equal(g.status, 200);
  assert.equal(g.headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(g.headers.get("Cache-Control"), "no-store");
  const gHtml = await g.text();
  assert.match(gHtml, /<form method="post" action="\/api\/claim-verify">/);
  assert.match(gHtml, /<input type="hidden" name="t" value="[^"]+">/);
  assert.match(gHtml, /Confirm my claim/);
  assert.doesNotMatch(gHtml, /You're verified/);
  assert.equal(sent.length, 2, "GET must not send the VERIFIED email");

  // POST with the token → VERIFIED email to owner
  const v = await confirm(token);
  assert.equal(v.status, 200);
  assert.equal(v.headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(v.headers.get("Cache-Control"), "no-store");
  const confirmation = await v.text();
  assert.match(confirmation, /You're verified/);
  assert.match(confirmation, /Nothing is published automatically/);
  assert.equal(sent.length, 3);
  assert.match(String(sent[2].subject), new RegExp(`Claim VERIFIED: .*\\(${id}\\)`));

  // tampered / expired / missing tokens rejected on GET and POST, nothing sent
  const n = sent.length;
  const tampered = link.replace(/t=([^.]+)\./, (_m, b) => `t=${b}x.`);
  const tamperedToken = decodeURIComponent(new URL(tampered).searchParams.get("t")!);
  const expired = await signToken(env.PN_CLAIM_SECRET, { s: slug, e: `owner@${host}`, c: "abc", x: 1 });
  for (const bad of [tamperedToken, expired, ""]) {
    const rg = await verifyGet({ request: new Request(`https://www.peptidesnearby.com/api/claim-verify?t=${encodeURIComponent(bad)}`), env } as never);
    assert.equal(rg.status, 400);
    assert.equal(rg.headers.get("Referrer-Policy"), "no-referrer");
    assert.equal((await confirm(bad)).status, 400);
  }
  assert.equal(sent.length, n);

  // free mail → manual review, owner email only
  const r2 = await post({ ...base, claimantEmail: "someone@gmail.com" });
  assert.equal(((await r2.json()) as { mode: string }).mode, "manual");
  assert.equal(sent.length, n + 1);
  assert.match(String(sent[n].subject), /manual check/);

  // host shared by several listings → manual review even with an exact-domain email
  const r3 = await post({ ...base, providerSlug: sharedSlug, claimantEmail: `owner@${sharedHost}` });
  assert.equal(((await r3.json()) as { mode: string }).mode, "manual");
  assert.equal(sent.length, n + 2);
  assert.deepEqual(sent[n + 1].to, ["owner@example.com"]);
  assert.match(String(sent[n + 1].subject), /manual check/);

  // exact-domain rule
  assert.equal(domainMatches("a@clinic-test-xyz.com", "clinic-test-xyz.com"), true);
  assert.equal(domainMatches("a@clinic-test-xyz.com", "www.clinic-test-xyz.com"), true);
  assert.equal(domainMatches("a@mail.clinic-test-xyz.com", "clinic-test-xyz.com"), false);
  assert.equal(domainMatches("a@clinic-test-xyz.com", "shop.clinic-test-xyz.com"), false);
  assert.equal(domainMatches("a@ucdavis.edu", "ucdmc.ucdavis.edu"), false);
  assert.equal(domainMatches("a@ucdmc.ucdavis.edu", "ucdmc.ucdavis.edu"), false, ".edu goes to manual");
  assert.equal(domainMatches("a@agency.gov", "agency.gov"), false, ".gov goes to manual");
  assert.equal(domainMatches(`a@${sharedHost}`, sharedHost), false, "shared host goes to manual");
  assert.equal(domainMatches("a@gmail.com", "gmail.com"), false);
  assert.equal(domainMatches("a@clinic.com", "facebook.com"), false);
  assert.equal(domainMatches("a@otherclinic.com", "clinic.com"), false);
  console.log(`claim flow: all checks passed (${sent.length} stubbed emails; unique ${slug} @${host}; shared ${sharedSlug} @${sharedHost})`);
}
main().catch((e) => { console.error(e); process.exit(1); });
