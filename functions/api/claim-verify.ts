/**
 * /api/claim-verify: the claimant clicked the confirm link.
 *
 * GET ?t=<signed token>: checks the HMAC + expiry and shows a "Confirm my claim"
 *   button. It does NOT verify: mail scanners and link previewers fetch GET links.
 * POST (form body t=<signed token>): checks the token again, tells the owner inbox
 *   the claim is VERIFIED, and shows the claimant a confirmation page.
 * Stateless; no database write.
 */
import { type ClaimEnv, type ClaimToken, SITE, claimNotifyTo, escapeHtml, lookupProvider, sendEmail, verifyToken } from "../../functions-lib/claim-shared";

function page(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)} | Peptides Nearby</title><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f7f8fa;color:#1a1f2b;margin:0;padding:48px 16px}main{max-width:560px;margin:0 auto;background:#fff;border:1px solid #e3e6eb;border-radius:12px;padding:32px}h1{font-size:22px;margin:0 0 12px}p{line-height:1.55;color:#454c59}a{color:#0f766e}button{font:inherit;font-weight:600;background:#0f766e;color:#fff;border:0;border-radius:8px;padding:12px 20px;cursor:pointer}</style></head><body><main><h1>${escapeHtml(title)}</h1>${body}</main></body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}

function misconfigured(): Response {
  return page("Something went wrong", "<p>We couldn't check this link right now. Please try again later.</p>", 500);
}

function invalidLink(): Response {
  return page(
    "This link has expired or isn't valid",
    `<p>Confirm links work for 72 hours. You can start a new claim from your listing page.</p><p><a href="${SITE}/">Back to Peptides Nearby</a></p>`,
    400,
  );
}

async function check(env: ClaimEnv, token: string): Promise<{ t: ClaimToken; provider: { name: string; domain: string } } | null> {
  const t = await verifyToken(env.PN_CLAIM_SECRET as string, token);
  const provider = t ? lookupProvider(t.s) : null;
  return t && provider ? { t, provider } : null;
}

export const onRequestGet: PagesFunction<ClaimEnv> = async ({ request, env }) => {
  if (!env.PN_CLAIM_SECRET || !env.PN_RESEND_API_KEY || !claimNotifyTo(env)) return misconfigured();
  const token = new URL(request.url).searchParams.get("t") || "";
  const ok = await check(env, token);
  if (!ok) return invalidLink();

  return page(
    "Confirm your listing claim",
    `<p>You're claiming the free Peptides Nearby listing for <strong>${escapeHtml(ok.provider.name)}</strong>. Press the button to confirm it's you.</p><form method="post" action="/api/claim-verify"><input type="hidden" name="t" value="${escapeHtml(token)}"><button type="submit">Confirm my claim</button></form><p>If you didn't ask for this, close this page and nothing changes.</p>`,
  );
};

export const onRequestPost: PagesFunction<ClaimEnv> = async ({ request, env }) => {
  if (!env.PN_CLAIM_SECRET || !env.PN_RESEND_API_KEY || !claimNotifyTo(env)) return misconfigured();
  let token = "";
  try {
    const v = (await request.formData()).get("t");
    token = typeof v === "string" ? v : "";
  } catch {
    token = "";
  }
  const ok = await check(env, token);
  if (!ok) return invalidLink();
  const { t, provider } = ok;

  await sendEmail(env, {
    to: claimNotifyTo(env),
    replyTo: t.e,
    subject: `[Peptides Nearby] Claim VERIFIED: ${provider.name} (${t.c})`,
    html: `<p>Claim <strong>${escapeHtml(t.c)}</strong> for <a href="${SITE}/providers/${escapeHtml(t.s)}">${escapeHtml(provider.name)}</a> was confirmed from ${escapeHtml(t.e)} (domain ${escapeHtml(provider.domain)}) at ${new Date().toISOString()}.</p><p>Apply the payload from the "Claim pending" email with the same id: <code>npx tsx scripts/apply-claim.ts claim-${escapeHtml(t.c)}.json --method email-domain</code></p>`,
    text: `Claim ${t.c} for ${provider.name} (${SITE}/providers/${t.s}) confirmed from ${t.e} (domain ${provider.domain}) at ${new Date().toISOString()}.\nApply: npx tsx scripts/apply-claim.ts claim-${t.c}.json --method email-domain`,
  });

  return page(
    "You're verified",
    `<p>Thanks. Your claim for <strong>${escapeHtml(provider.name)}</strong> is confirmed. We'll review the details you sent before any listing change. Nothing is published automatically.</p><p>Need a factual correction later? Use the review link on the listing.</p><p><a href="${SITE}/providers/${escapeHtml(t.s)}">View your listing</a></p>`,
  );
};
