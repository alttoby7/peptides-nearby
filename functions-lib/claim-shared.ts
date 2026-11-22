/**
 * Shared helpers for the listing claim flow (functions/api/claim.ts and
 * functions/api/claim-verify.ts). Stateless: no database. Ownership is proven by
 * a signed link sent to a work email on the practice's own website domain.
 */
import domains from "./provider-domains.json";

export interface ClaimEnv {
  PN_RESEND_API_KEY?: string;
  PN_SUBMIT_NOTIFY_TO?: string;
  PN_CLAIM_SECRET?: string;
  PN_CLAIM_FROM?: string;
}

export const SITE = "https://www.peptidesnearby.com";
export const TOKEN_TTL_SECONDS = 72 * 3600;

const DOMAINS = domains as Record<string, { n: string; d: string }>;

export function lookupProvider(slug: string): { name: string; domain: string } | null {
  if (!Object.hasOwn(DOMAINS, slug)) return null;
  const hit = DOMAINS[slug];
  return hit ? { name: hit.n, domain: hit.d } : null;
}

// Hosts listed for more than one provider (franchises, chains, shared booking sites):
// an email on that domain cannot tell us WHICH location is claiming.
const SHARED_HOSTS: Set<string> = (() => {
  const counts = new Map<string, number>();
  for (const v of Object.values(DOMAINS)) {
    const h = (v.d || "").toLowerCase().replace(/^www\./, "");
    if (h) counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, n]) => n > 1).map(([h]) => h));
})();

// Free mail never proves ownership of a practice.
const FREEMAIL = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "hotmail.com", "outlook.com", "live.com", "msn.com",
  "aol.com", "icloud.com", "me.com", "mac.com", "proton.me", "protonmail.com", "gmx.com", "mail.com", "zoho.com",
  "comcast.net", "att.net", "sbcglobal.net", "verizon.net", "bellsouth.net", "cox.net", "charter.net", "yandex.com",
]);

// Website hosts where a matching email would not prove ownership of THIS practice.
const PLATFORM_HOST = /(^|\.)(facebook\.com|instagram\.com|linktr\.ee|wixsite\.com|business\.site|square\.site|squarespace\.com|godaddysites\.com|sites\.google\.com|google\.com|yelp\.com|vagaro\.com|mindbodyonline\.com|janeapp\.com|wordpress\.com|weebly\.com|webflow\.io|carrd\.co|cvs\.com|walgreens\.com|walmart\.com|kroger\.com)$/i;

export function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at > 0 ? email.slice(at + 1).toLowerCase().trim() : "";
}

/**
 * true when the work email domain is exactly the practice website's host (ignoring a
 * leading www.). Subdomains and parent domains never match; .edu/.gov hosts and hosts
 * shared by several listings go to manual review.
 */
export function domainMatches(email: string, siteHost: string): boolean {
  const ed = emailDomain(email).replace(/^www\./, "");
  const sh = siteHost.toLowerCase().trim().replace(/^www\./, "");
  if (!ed || !sh) return false;
  if (FREEMAIL.has(ed) || PLATFORM_HOST.test(sh)) return false;
  if (/\.(edu|gov)$/.test(sh) || SHARED_HOSTS.has(sh)) return false;
  return ed === sh;
}

export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export function trim(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function sameOrigin(request: Request): boolean {
  const site = request.headers.get("Sec-Fetch-Site");
  const origin = request.headers.get("Origin") || request.headers.get("Referer") || "";
  return site === "same-origin" || site === "same-site" || /^https?:\/\/(www\.)?peptidesnearby\.com(\/|$)/.test(origin);
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64url(new Uint8Array(sig));
}

export interface ClaimToken {
  s: string; // provider slug
  e: string; // claimant email
  c: string; // claim id (matches the pending-claim email)
  x: number; // expiry, unix seconds
}

export async function signToken(secret: string, t: ClaimToken): Promise<string> {
  const body = b64url(new TextEncoder().encode(JSON.stringify(t)));
  return `${body}.${await hmac(secret, body)}`;
}

export async function verifyToken(secret: string, token: string): Promise<ClaimToken | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await hmac(secret, body);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const t = JSON.parse(new TextDecoder().decode(fromB64url(body))) as ClaimToken;
    if (typeof t.x !== "number" || t.x < Math.floor(Date.now() / 1000)) return null;
    return t;
  } catch {
    return null;
  }
}

export async function claimId(payload: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return [...new Uint8Array(digest)].slice(0, 6).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sendEmail(
  env: ClaimEnv,
  msg: { to: string; subject: string; html: string; text: string; replyTo?: string },
): Promise<boolean> {
  const from = (env.PN_CLAIM_FROM || "Peptides Nearby <claims@peptidesnearby.com>").trim();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${(env.PN_RESEND_API_KEY || "").trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [msg.to], reply_to: msg.replyTo, subject: msg.subject, html: msg.html, text: msg.text }),
  });
  if (!res.ok) console.error("resend_failed", res.status, await res.text());
  return res.ok;
}
