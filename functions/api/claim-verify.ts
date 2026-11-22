/**
 * GET /api/claim-verify?t=<signed token>: the claimant clicked the confirm link.
 * Verifies the HMAC + expiry, tells the owner inbox the claim is VERIFIED, and
 * shows the claimant a confirmation page. Stateless; no database write.
 */
import { type ClaimEnv, SITE, escapeHtml, lookupProvider, sendEmail, verifyToken } from "../../functions-lib/claim-shared";

function page(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)} | Peptides Nearby</title><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f7f8fa;color:#1a1f2b;margin:0;padding:48px 16px}main{max-width:560px;margin:0 auto;background:#fff;border:1px solid #e3e6eb;border-radius:12px;padding:32px}h1{font-size:22px;margin:0 0 12px}p{line-height:1.55;color:#454c59}a{color:#0f766e}</style></head><body><main><h1>${escapeHtml(title)}</h1>${body}</main></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export const onRequestGet: PagesFunction<ClaimEnv> = async ({ request, env }) => {
  if (!env.PN_CLAIM_SECRET || !env.PN_RESEND_API_KEY || !env.PN_SUBMIT_NOTIFY_TO) {
    return page("Something went wrong", "<p>We couldn't check this link right now. Please try again later.</p>", 500);
  }
  const token = new URL(request.url).searchParams.get("t") || "";
  const t = await verifyToken(env.PN_CLAIM_SECRET, token);
  const provider = t ? lookupProvider(t.s) : null;
  if (!t || !provider) {
    return page(
      "This link has expired or isn't valid",
      `<p>Confirm links work for 72 hours. You can start a new claim from your listing page.</p><p><a href="${SITE}/">Back to Peptides Nearby</a></p>`,
      400,
    );
  }

  await sendEmail(env, {
    to: env.PN_SUBMIT_NOTIFY_TO,
    replyTo: t.e,
    subject: `[Peptides Nearby] Claim VERIFIED: ${provider.name} (${t.c})`,
    html: `<p>Claim <strong>${escapeHtml(t.c)}</strong> for <a href="${SITE}/providers/${escapeHtml(t.s)}">${escapeHtml(provider.name)}</a> was confirmed from ${escapeHtml(t.e)} (domain ${escapeHtml(provider.domain)}) at ${new Date().toISOString()}.</p><p>Apply the payload from the "Claim pending" email with the same id: <code>npx tsx scripts/apply-claim.ts claim-${escapeHtml(t.c)}.json --method email-domain</code></p>`,
    text: `Claim ${t.c} for ${provider.name} (${SITE}/providers/${t.s}) confirmed from ${t.e} (domain ${provider.domain}) at ${new Date().toISOString()}.\nApply: npx tsx scripts/apply-claim.ts claim-${t.c}.json --method email-domain`,
  });

  return page(
    "You're verified",
    `<p>Thanks. Your claim for <strong>${escapeHtml(provider.name)}</strong> is confirmed. We'll publish the details you sent within two business days and mark the listing as claimed.</p><p>Need a change later? Reply to the confirmation email.</p><p><a href="${SITE}/providers/${escapeHtml(t.s)}">View your listing</a></p>`,
  );
};
