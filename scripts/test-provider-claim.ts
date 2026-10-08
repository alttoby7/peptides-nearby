import assert from "node:assert/strict";
import { onRequestPost } from "../functions/api/submit";

const originalFetch = globalThis.fetch;

function request(body: Record<string, string>) {
  return new Request("https://www.peptidesnearby.com/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://www.peptidesnearby.com",
      "Sec-Fetch-Site": "same-origin",
    },
    body: JSON.stringify(body),
  });
}

async function submit(body: Record<string, string>) {
  return onRequestPost({
    request: request(body),
    env: {
      PN_RESEND_API_KEY: "test-key",
      PN_SUBMIT_NOTIFY_TO: "owner@example.com",
      PN_SUBMIT_FROM: "Peptides Nearby <submissions@example.com>",
    },
  } as never);
}

async function main() {
  const sent: Record<string, unknown>[] = [];
  globalThis.fetch = async (_input, init) => {
    sent.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return new Response(JSON.stringify({ id: "test" }), { status: 200 });
  };

  const missing = await submit({ action: "claim" });
  assert.equal(missing.status, 400);

  const invalidPlan = await submit({
    action: "claim",
    providerSlug: "sample-clinic",
    providerName: "Sample Clinic",
    claimantName: "Owner",
    claimantRole: "owner",
    claimantEmail: "owner@example.com",
    planInterest: "unknown",
  });
  assert.equal(invalidPlan.status, 400);

  const success = await submit({
    action: "claim",
    providerSlug: "sample-clinic",
    providerName: "Sample <Clinic>",
    claimantName: "Owner",
    claimantRole: "owner",
    claimantEmail: "owner@example.com",
    planInterest: "founding-featured",
  });
  assert.equal(success.status, 200);
  assert.equal(sent.length, 1);
  assert.match(String(sent[0].subject), /founding plan interest/);
  assert.doesNotMatch(String(sent[0].html), /Sample <Clinic>/);
  assert.match(String(sent[0].html), /Sample &lt;Clinic&gt;/);

  console.log("Provider claim handler checks passed.");
}

main()
  .finally(() => {
    globalThis.fetch = originalFetch;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
