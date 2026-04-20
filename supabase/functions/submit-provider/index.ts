interface SubmissionPayload {
  name?: string;
  type?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  website?: string;
  services?: string;
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

  let payload: SubmissionPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const row = {
    name: trim(payload.name),
    type: trim(payload.type),
    city: trim(payload.city),
    state: trim(payload.state),
    address: trim(payload.address),
    phone: trim(payload.phone),
    website: trim(payload.website),
    services: trim(payload.services),
    raw_payload: payload,
  };

  if (!row.name || !row.type || !row.city || !row.state) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["clinic", "pharmacy", "wellness-center"].includes(row.type)) {
    return json({ error: "Invalid provider type" }, { status: 400 });
  }

  const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/provider_submissions`, {
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
      { error: "Failed to save submission", details: await res.text() },
      { status: 500 }
    );
  }

  return json({ ok: true }, { status: 201 });
});
