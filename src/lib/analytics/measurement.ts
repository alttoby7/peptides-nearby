const PRODUCTION_HOSTS = new Set(["peptidesnearby.com", "www.peptidesnearby.com"]);
const QA_EXCLUSION_KEY = "pn_analytics_excluded";
const IMPRESSION_KEY_PREFIX = "pn_analytics_impression:";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export type DirectorySurface = "provider_profile" | "local_page";
export type ProviderDestination = "website" | "booking";

export function sanitizedPageLocation(location: Pick<Location, "origin" | "pathname">): string {
  return `${location.origin}${location.pathname}`;
}

export function safeCampaignFields(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const fields: Record<string, string> = {};
  const mappings = [
    ["utm_source", "campaign_source"],
    ["utm_medium", "campaign_medium"],
    ["utm_campaign", "campaign_name"],
    ["utm_content", "campaign_content"],
  ] as const;

  for (const [queryName, fieldName] of mappings) {
    const value = params.get(queryName);
    if (value && /^[a-z0-9_-]{1,80}$/i.test(value)) fields[fieldName] = value;
  }

  return fields;
}

export function isAnalyticsEligible(win: AnalyticsWindow = window as AnalyticsWindow): boolean {
  if (!PRODUCTION_HOSTS.has(win.location.hostname)) return false;
  if (win.navigator.webdriver) return false;

  try {
    if (new URLSearchParams(win.location.search).get("pn_analytics_exclude") === "1") {
      win.sessionStorage.setItem(QA_EXCLUSION_KEY, "1");
    }
    return win.sessionStorage.getItem(QA_EXCLUSION_KEY) !== "1";
  } catch {
    // Session storage is required for a credible session-deduplicated denominator.
    return false;
  }
}

export function ensureGoogleTag(win: AnalyticsWindow = window as AnalyticsWindow): void {
  win.dataLayer = win.dataLayer || [];
  win.gtag = win.gtag || function gtag(...args: unknown[]) {
    win.dataLayer!.push(args);
  };
}

export function analyticsConfig(win: AnalyticsWindow = window as AnalyticsWindow): Record<string, unknown> {
  return {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: sanitizedPageLocation(win.location),
    page_path: win.location.pathname,
    ...safeCampaignFields(win.location.search),
  };
}

export function initializeGoogleAnalytics(
  measurementId: string,
  win: AnalyticsWindow = window as AnalyticsWindow,
  doc: Document = document
): boolean {
  if (!isAnalyticsEligible(win)) return false;

  ensureGoogleTag(win);
  win.gtag?.("js", new Date());
  win.gtag?.("config", measurementId, analyticsConfig(win));

  if (!doc.querySelector("script[data-peptides-nearby-analytics]")) {
    const script = doc.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.dataset.peptidesNearbyAnalytics = "true";
    doc.head.appendChild(script);
  }

  return true;
}

export function trackPageView(win: AnalyticsWindow = window as AnalyticsWindow): boolean {
  if (!isAnalyticsEligible(win) || !win.gtag) return false;
  win.gtag("event", "page_view", {
    page_location: sanitizedPageLocation(win.location),
    page_path: win.location.pathname,
    ...safeCampaignFields(win.location.search),
  });
  return true;
}

export function trackDirectoryImpression(
  surface: DirectorySurface,
  surfaceKey: string,
  win: AnalyticsWindow = window as AnalyticsWindow
): boolean {
  if (!isAnalyticsEligible(win) || !win.gtag) return false;

  const eventName = surface === "provider_profile"
    ? "eligible_provider_profile_impression"
    : "eligible_local_page_impression";
  const sessionKey = `${IMPRESSION_KEY_PREFIX}${surface}:${surfaceKey}`;

  try {
    if (win.sessionStorage.getItem(sessionKey) === "1") return false;
    win.sessionStorage.setItem(sessionKey, "1");
  } catch {
    return false;
  }

  win.gtag("event", eventName, {
    denominator_scope: "browser_tab_session_per_page",
    page_location: sanitizedPageLocation(win.location),
    page_path: win.location.pathname,
  });
  return true;
}

export function trackProviderSiteClick(
  destination: ProviderDestination,
  win: AnalyticsWindow = window as AnalyticsWindow
): boolean {
  if (!isAnalyticsEligible(win) || !win.gtag) return false;
  win.gtag("event", "provider_site_click", {
    destination_type: destination,
    page_location: sanitizedPageLocation(win.location),
    page_path: win.location.pathname,
  });
  return true;
}

export function trackProviderCallClick(win: AnalyticsWindow = window as AnalyticsWindow): boolean {
  if (!isAnalyticsEligible(win) || !win.gtag) return false;
  win.gtag("event", "provider_call_click", {
    page_location: sanitizedPageLocation(win.location),
    page_path: win.location.pathname,
  });
  return true;
}

