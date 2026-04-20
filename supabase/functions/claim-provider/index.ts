interface ClaimPayload {
  providerSlug?: string;
  claimantName?: string;
  claimantEmail?: string;
  claimantPhone?: string;
  claimantRole?: string;
  notes?: string;
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

  let payload: ClaimPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const providerSlug = trim(payload.providerSlug);
  const claimantName = trim(payload.claimantName);
  const claimantEmail = trim(payload.claimantEmail);
  const claimantRole = trim(payload.claimantRole);

  if (!providerSlug || !claimantName || !claimantEmail || !claimantRole) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["owner", "manager", "staff", "other"].includes(claimantRole)) {
    return json({ error: "Invalid role" }, { status: 400 });
  }

  // Look up provider by slug to get its ID
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

  // Check for existing pending claim
  const existingRes = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/provider_claims?provider_id=eq.${providerId}&status=eq.pending&select=id`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );

  if (existingRes.ok) {
    const existing = await existingRes.json();
    if (existing && existing.length > 0) {
      return json({ error: "A claim is already pending for this provider" }, { status: 409 });
    }
  }

  // Insert claim
  const row = {
    provider_id: providerId,
    claimant_name: claimantName,
    claimant_email: claimantEmail,
    claimant_phone: trim(payload.claimantPhone),
    claimant_role: claimantRole,
    notes: trim(payload.notes),
  };

  const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/provider_claims`, {
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
      { error: "Failed to save claim", details: await res.text() },
      { status: 500 }
    );
  }

  return json({ ok: true }, { status: 201 });
});
