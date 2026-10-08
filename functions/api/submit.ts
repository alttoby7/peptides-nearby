/**
 * Peptides Nearby "Add Your Practice" — Cloudflare Pages Function.
 * Same-origin POST /api/submit → emails the submission via Resend for manual review.
 *
 * Replaces the retired Supabase edge function (project eikpivjiznbjekstwjmo no
 * longer exists). No database: each submission is one notification email.
 *
 * Required CF Pages env vars:
 *   PN_RESEND_API_KEY     (secret) Resend key for the account where peptidesnearby.com is verified
 *   PN_SUBMIT_NOTIFY_TO   inbox that receives submissions
 *   PN_SUBMIT_FROM        optional, default "Peptides Nearby <submissions@peptidesnearby.com>"
 */

interface Env {
  PN_RESEND_API_KEY?: string;
  PN_SUBMIT_NOTIFY_TO?: string;
  PN_SUBMIT_FROM?: string;
}

interface SubmissionPayload {
  action?: string;
  providerSlug?: string;
  providerName?: string;
  claimantName?: string;
  claimantRole?: string;
  claimantEmail?: string;
  claimantPhone?: string;
  notes?: string;
  planInterest?: string;
  name?: string;
  type?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  website?: string;
  services?: string;
  email?: string;
  company?: string; // honeypot — real users never see this field
}

const FIELDS: (keyof SubmissionPayload)[] = [
  "name",
  "type",
  "city",
  "state",
  "address",
  "phone",
  "website",
  "services",
  "email",
];

const VALID_TYPES = new Set(["clinic", "pharmacy", "wellness-center"]);
const VALID_ACTIONS = new Set(["listing", "claim"]);
const VALID_PLAN_INTEREST = new Set(["free-claim", "founding-featured"]);

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function trim(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sameOrigin(request: Request): boolean {
  const site = request.headers.get("Sec-Fetch-Site");
  const origin = request.headers.get("Origin") || request.headers.get("Referer") || "";
  return (
    site === "same-origin" ||
    site === "same-site" ||
    /^https?:\/\/(www\.)?peptidesnearby\.com(\/|$)/.test(origin)
  );
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!sameOrigin(request)) {
    return json({ error: "forbidden" }, 403);
  }

  const apiKey = (env.PN_RESEND_API_KEY || "").trim();
  const to = (env.PN_SUBMIT_NOTIFY_TO || "").trim();
  const from = (env.PN_SUBMIT_FROM || "Peptides Nearby <submissions@peptidesnearby.com>").trim();
  if (!apiKey || !to) {
    return json({ error: "misconfigured" }, 500);
  }

  let payload: SubmissionPayload;
  try {
    payload = (await request.json()) as SubmissionPayload;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  // Honeypot: bots fill every field. Pretend success so they don't retry.
  if (trim(payload.company)) {
    return json({ ok: true }, 200);
  }

  const action = trim(payload.action || "listing", 20);
  if (!VALID_ACTIONS.has(action)) {
    return json({ error: "invalid_action" }, 400);
  }

  if (action === "claim") {
    const claim = {
      providerSlug: trim(payload.providerSlug),
      providerName: trim(payload.providerName),
      claimantName: trim(payload.claimantName),
      claimantRole: trim(payload.claimantRole),
      claimantEmail: trim(payload.claimantEmail),
      claimantPhone: trim(payload.claimantPhone),
      notes: trim(payload.notes, 2000),
      planInterest: trim(payload.planInterest, 40),
    };
    if (!claim.providerSlug || !claim.providerName || !claim.claimantName || !claim.claimantRole || !claim.claimantEmail) {
      return json({ error: "missing_required_fields" }, 400);
    }
    if (!VALID_PLAN_INTEREST.has(claim.planInterest)) {
      return json({ error: "invalid_plan_interest" }, 400);
    }

    const lines = Object.entries(claim)
      .map(([key, value]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${key}</td><td style="padding:4px 0">${escapeHtml(value) || "—"}</td></tr>`)
      .join("");
    const html = `<p>Provider claim request from peptidesnearby.com</p><table>${lines}</table><p style="color:#999;font-size:12px">IP: ${escapeHtml(request.headers.get("CF-Connecting-IP") || "?")} · ${new Date().toISOString()}</p>`;
    const text = Object.entries(claim).map(([key, value]) => `${key}: ${value || "-"}`).join("\n");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: claim.claimantEmail,
        subject: `[Peptides Nearby] Claim request: ${claim.providerName}${claim.planInterest === "founding-featured" ? " — founding plan interest" : ""}`,
        html,
        text,
      }),
    });
    if (!res.ok) {
      console.error("resend_failed", res.status, await res.text());
      return json({ error: "send_failed" }, 502);
    }
    return json({ ok: true }, 200);
  }

  const row: Record<string, string> = {};
  for (const key of FIELDS) row[key] = trim(payload[key], key === "services" ? 2000 : 500);

  if (!row.name || !row.type || !row.city || !row.state) {
    return json({ error: "missing_required_fields" }, 400);
  }
  if (!VALID_TYPES.has(row.type)) {
    return json({ error: "invalid_type" }, 400);
  }

  const lines = FIELDS.map(
    (key) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${key}</td><td style="padding:4px 0">${escapeHtml(row[key]) || "—"}</td></tr>`
  ).join("");
  const html = `<p>New practice submission from peptidesnearby.com/submit</p><table>${lines}</table><p style="color:#999;font-size:12px">IP: ${escapeHtml(request.headers.get("CF-Connecting-IP") || "?")} · ${new Date().toISOString()}</p>`;
  const text = FIELDS.map((key) => `${key}: ${row[key] || "-"}`).join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: row.email || undefined,
      subject: `[Peptides Nearby] New listing: ${row.name} (${row.city}, ${row.state})`,
      html,
      text,
    }),
  });

  if (!res.ok) {
    console.error("resend_failed", res.status, await res.text());
    return json({ error: "send_failed" }, 502);
  }

  return json({ ok: true }, 200);
};
