import assert from "node:assert/strict";
import domains from "../functions-lib/provider-domains.json";
import { onRequestPost } from "../functions/api/claim";
import { onRequestGet } from "../functions/api/claim-verify";
import { domainMatches, signToken } from "../functions-lib/claim-shared";

const env = { PN_RESEND_API_KEY: "test", PN_SUBMIT_NOTIFY_TO: "owner@example.com", PN_CLAIM_SECRET: "s3cret-test" };
const sent: Record<string, unknown>[] = [];
globalThis.fetch = (async (_u: unknown, init?: RequestInit) => {
  sent.push(JSON.parse(String(init?.body)));
  return new Response("{}", { status: 200 });
}) as typeof fetch;

const entry = Object.entries(domains as Record<string, { n: string; d: string }>).find(([, v]) => v.d && !v.d.includes("facebook"))!;
const [slug, { d: host }] = entry;

function post(body: Record<string, unknown>, origin = "https://www.peptidesnearby.com") {
  return onRequestPost({
    request: new Request("https://www.peptidesnearby.com/api/claim", {
      method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body),
    }), env,
  } as never);
}
const base = { providerSlug: slug, claimantName: "Test Person", claimantRole: "owner", attest: true, description: "x" };

async function main() {
  assert.equal((await post({ ...base, claimantEmail: `a@${host}` }, "https://evil.example")).status, 403);
  assert.equal((await post({ ...base, providerSlug: "nope", claimantEmail: `a@${host}` })).status, 400);
  assert.equal((await post({ ...base, attest: false, claimantEmail: `a@${host}` })).status, 400);
  assert.equal((await post({ ...base, bookingUrl: "http://x", claimantEmail: `a@${host}` })).status, 400);
  assert.equal(sent.length, 0, "no email on rejected claims");

  // honeypot: 200, nothing sent
  assert.equal((await post({ ...base, company: "bot", claimantEmail: `a@${host}` })).status, 200);
  assert.equal(sent.length, 0);

  // domain match → confirm email to claimant + pending email to owner
  const r1 = await post({ ...base, claimantEmail: `owner@${host}` });
  assert.equal(r1.status, 200);
  assert.equal(((await r1.json()) as { mode: string }).mode, "email-domain");
  assert.equal(sent.length, 2);
  assert.deepEqual(sent[0].to, [`owner@${host}`]);
  assert.deepEqual(sent[1].to, ["owner@example.com"]);
  assert.match(String(sent[1].subject), /Claim pending/);
  const link = String(sent[0].text).match(/https:\/\/www\.peptidesnearby\.com\/api\/claim-verify\?t=\S+/)![0];

  // verify link → VERIFIED email to owner
  const v = await onRequestGet({ request: new Request(link), env } as never);
  assert.equal(v.status, 200);
  assert.match(await v.text(), /You're verified/);
  assert.match(String(sent[2].subject), /Claim VERIFIED/);

  // tampered / expired tokens rejected, nothing sent
  const n = sent.length;
  const tampered = link.replace(/t=([^.]+)\./, (_m, b) => `t=${b}x.`);
  assert.equal((await onRequestGet({ request: new Request(tampered), env } as never)).status, 400);
  const expired = await signToken(env.PN_CLAIM_SECRET, { s: slug, e: `owner@${host}`, c: "abc", x: 1 });
  assert.equal((await onRequestGet({ request: new Request(`https://www.peptidesnearby.com/api/claim-verify?t=${expired}`), env } as never)).status, 400);
  assert.equal(sent.length, n);

  // free mail → manual review, owner email only
  const r2 = await post({ ...base, claimantEmail: "someone@gmail.com" });
  assert.equal(((await r2.json()) as { mode: string }).mode, "manual");
  assert.equal(sent.length, n + 1);
  assert.match(String(sent[n].subject), /manual check/);

  assert.equal(domainMatches("a@mail.clinic.com", "clinic.com"), true);
  assert.equal(domainMatches("a@gmail.com", "gmail.com"), false);
  assert.equal(domainMatches("a@clinic.com", "facebook.com"), false);
  assert.equal(domainMatches("a@otherclinic.com", "clinic.com"), false);
  console.log(`claim flow: all checks passed (${sent.length} stubbed emails; provider ${slug} @${host})`);
}
main().catch((e) => { console.error(e); process.exit(1); });
