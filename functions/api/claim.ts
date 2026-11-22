/**
 * POST /api/claim: start a free listing claim.
 *
 * 1. Validates the claim (provider exists, required fields, attestation).
 * 2. Emails the owner inbox the full payload + claim id (first; if that fails, 502
 *    and nothing goes to the claimant). Applying a verified claim to the site:
 *    `npx tsx scripts/apply-claim.ts <payload.json>`.
 * 3. If the work email domain is exactly the practice website's host, emails the
 *    claimant a signed confirm link (72 h) → /api/claim-verify.
 *    Otherwise the claim goes to manual review (we call the listed number).
 *
 * Env (CF Pages): PN_RESEND_API_KEY, PN_SUBMIT_NOTIFY_TO, PN_CLAIM_SECRET, PN_CLAIM_FROM (optional).
 */
import {
  type ClaimEnv, SITE, TOKEN_TTL_SECONDS, claimId, domainMatches, escapeHtml, json, lookupProvider,
  sameOrigin, sendEmail, signToken, trim,
} from "../../functions-lib/claim-shared";

const ROLES = new Set(["owner", "medical-director", "practice-manager", "marketing", "other"]);
const INSURANCE = new Set(["accepted", "not-accepted", "varies", ""]);
const EMAIL_RE = /^[a-z0-9._%+-]+@([a-z0-9-]+\.)+[a-z]{2,}$/i;

export const onRequestPost: PagesFunction<ClaimEnv> = async ({ request, env }) => {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (!env.PN_RESEND_API_KEY || !env.PN_SUBMIT_NOTIFY_TO || !env.PN_CLAIM_SECRET) return json({ error: "misconfigured" }, 500);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (trim(body.company)) return json({ ok: true, mode: "manual" }, 200); // honeypot

  const slug = trim(body.providerSlug, 200);
  const provider = lookupProvider(slug);
  if (!provider) return json({ error: "unknown_provider" }, 400);

  const claim = {
    slug,
    providerName: provider.name,
    claimantName: trim(body.claimantName, 120),
    claimantRole: trim(body.claimantRole, 40),
    claimantEmail: trim(body.claimantEmail, 200).toLowerCase(),
    claimantPhone: trim(body.claimantPhone, 40),
    description: trim(body.description, 4000),
    services: trim(body.services, 600),
    peptides: trim(body.peptides, 600),
    telehealth: trim(body.telehealth, 10),
    hours: trim(body.hours, 600),
    bookingUrl: trim(body.bookingUrl, 300),
    insurance: trim(body.insurance, 20),
    corrections: trim(body.corrections, 2000),
    attest: body.attest === true || body.attest === "on" || body.attest === "true",
  };
  if (!claim.claimantName || !ROLES.has(claim.claimantRole) || !EMAIL_RE.test(claim.claimantEmail)) {
    return json({ error: "missing_required_fields" }, 400);
  }
  if (!claim.attest) return json({ error: "attestation_required" }, 400);
  if (!INSURANCE.has(claim.insurance)) return json({ error: "invalid_choice" }, 400);
  if (claim.bookingUrl && !/^https:\/\//i.test(claim.bookingUrl)) return json({ error: "invalid_booking_url" }, 400);

  const submittedAt = new Date().toISOString();
  const id = await claimId(JSON.stringify({ ...claim, submittedAt }));
  const payloadJson = JSON.stringify({ claimId: id, ...claim, submittedAt }, null, 2);
  const match = domainMatches(claim.claimantEmail, provider.domain);
  const mode = match ? "email-domain" : "manual";

  const headline = match
    ? `Claim ${id} pending email confirmation (domain match: ${claim.claimantEmail} ↔ ${provider.domain})`
    : `Claim ${id} needs MANUAL verification (no domain match: ${claim.claimantEmail} vs ${provider.domain || "no website"}). Call the listed number before applying.`;
  const notified = await sendEmail(env, {
    to: env.PN_SUBMIT_NOTIFY_TO,
    replyTo: claim.claimantEmail,
    subject: `[Peptides Nearby] ${match ? "Claim pending" : "Claim needs manual check"}: ${provider.name} (${id})`,
    html: `<p>${escapeHtml(headline)}</p><p>Listing: <a href="${SITE}/providers/${escapeHtml(slug)}">${SITE}/providers/${escapeHtml(slug)}</a></p><p>Apply after verification: save the JSON below as claim-${id}.json, then <code>npx tsx scripts/apply-claim.ts claim-${id}.json --method ${mode}</code></p><pre style="white-space:pre-wrap;font-size:12px">${escapeHtml(payloadJson)}</pre>`,
    text: `${headline}\n\nListing: ${SITE}/providers/${slug}\nApply: npx tsx scripts/apply-claim.ts claim-${id}.json --method ${mode}\n\n${payloadJson}`,
  });
  // The owner inbox must hold the payload before the claimant can verify it.
  if (!notified) return json({ error: "send_failed" }, 502);

  if (match) {
    const token = await signToken(env.PN_CLAIM_SECRET, {
      s: slug, e: claim.claimantEmail, c: id, x: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    });
    const link = `${SITE}/api/claim-verify?t=${encodeURIComponent(token)}`;
    const sent = await sendEmail(env, {
      to: claim.claimantEmail,
      subject: `Confirm your listing claim: ${provider.name}`,
      html: `<p>Hi,</p><p>Someone (hopefully you) asked to claim the free Peptides Nearby listing for <strong>${escapeHtml(provider.name)}</strong>. Confirm it's you:</p><p><a href="${link}">Confirm my claim</a></p><p>The link works for 72 hours. If you didn't ask for this, ignore this email and nothing changes.</p><p>Peptides Nearby<br>${SITE}/providers/${escapeHtml(slug)}</p>`,
      text: `Hi,\n\nSomeone (hopefully you) asked to claim the free Peptides Nearby listing for ${provider.name}. Confirm it's you:\n\n${link}\n\nThe link works for 72 hours. If you didn't ask for this, ignore this email and nothing changes.\n\nPeptides Nearby\n${SITE}/providers/${slug}`,
    });
    if (!sent) return json({ error: "send_failed" }, 502);
  }

  return json({ ok: true, mode }, 200);
};
