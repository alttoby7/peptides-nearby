import type { Metadata } from "next";
import { Suspense } from "react";
import { ComparePageClient } from "./ComparePageClient";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Compare Providers — Peptides Nearby",
  description: "Compare peptide therapy providers side by side. Compare services, peptides, insurance, telehealth, and more.",
};

export default function ComparePage() {
  const BASE = "https://www.peptidesnearby.com";
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: BASE },
        { name: "Compare", url: `${BASE}/compare` },
      ])} />
      <Suspense>
        <ComparePageClient />
      </Suspense>
    </>
  );
}
