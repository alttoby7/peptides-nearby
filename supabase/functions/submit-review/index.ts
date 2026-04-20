interface ReviewPayload {
  providerSlug?: string;
  reviewerName?: string;
  reviewerEmail?: string;
  rating?: number;
  visitDate?: string;
  visitType?: string;
  title?: string;
  body?: string;
  peptidesUsed?: string;
  wouldRecommend?: boolean;
}

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      ...init.headers,
    },
  });
}

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return json({ ok: true });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  let payload: ReviewPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const providerSlug = trim(payload.providerSlug);
  const reviewerName = trim(payload.reviewerName);
  const reviewerEmail = trim(payload.reviewerEmail);
  const body = trim(payload.body);
  const rating = Number(payload.rating);
  const visitDate = trim(payload.visitDate);

  if (!providerSlug || !reviewerName || !reviewerEmail || !body || !visitDate) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  // Validate visit date is not in the future
  const visit = new Date(visitDate);
  if (isNaN(visit.getTime()) || visit > new Date()) {
    return json({ error: "Visit date must be a valid past date" }, { status: 400 });
  }

  const visitType = trim(payload.visitType) || "in-person";
  if (!["in-person", "telehealth"].includes(visitType)) {
    return json({ error: "Invalid visit type" }, { status: 400 });
  }

  // Look up provider
  const providerRes = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/providers?slug=eq.${encodeURIComponent(providerSlug)}&select=id`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );

  if (!providerRes.ok) {
    return json({ error: "Failed to look up provider" }, { status: 500 });
  }

  const providers = await providerRes.json();
  if (!providers || providers.length === 0) {
    return json({ error: "Provider not found" }, { status: 404 });
  }

  const providerId = providers[0].id;

  // Parse peptides used
  const peptidesUsed = trim(payload.peptidesUsed)
    .split(/[,;]+/)
    .map((s: string) => s.trim())
    .filter(Boolean);

  const row = {
    provider_id: providerId,
    reviewer_name: reviewerName,
    reviewer_email: reviewerEmail,
    rating,
    visit_date: visitDate,
    visit_type: visitType,
    title: trim(payload.title),
    body,
    peptides_used: peptidesUsed,
    would_recommend: payload.wouldRecommend !== false,
  };

  const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/provider_reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    return json(
      { error: "Failed to save review", details: await res.text() },
      { status: 500 }
    );
  }

  return json({ ok: true }, { status: 201 });
});
