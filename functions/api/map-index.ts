// Cloudflare Pages Function — serves the map index only to same-origin browser
// requests. Direct/automated GETs (curl, scrapers) lack Sec-Fetch-Site and a
// peptidesnearby.com Referer, so they get a 403. This is defense-in-depth
// (paired with the WAF rate-limit rule), not absolute privacy.
import data from "../../src/lib/data/map-index.json";

// Pre-serialize once at module load instead of per request.
const body = JSON.stringify(data);

export const onRequestGet = async (context: { request: Request }): Promise<Response> => {
  const { request } = context;
  const site = request.headers.get("Sec-Fetch-Site");
  const referer = request.headers.get("Referer") || "";
  const sameOrigin =
    site === "same-origin" ||
    site === "same-site" ||
    /^https?:\/\/(www\.)?peptidesnearby\.com(\/|$)/.test(referer);

  if (!sameOrigin) {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
