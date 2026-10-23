"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  initializeGoogleAnalytics,
  trackPageView,
} from "@/lib/analytics/measurement";

const MEASUREMENT_ID = "G-JXV379RS99";

export function GoogleAnalytics() {
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = initializeGoogleAnalytics(MEASUREMENT_ID);
    }
    if (initialized.current) trackPageView();
  }, [pathname]);

  return null;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

