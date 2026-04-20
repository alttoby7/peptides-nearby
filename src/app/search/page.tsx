import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "./SearchPageClient";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Search Providers — Peptides Nearby",
  description: "Search for peptide therapy clinics, compounding pharmacies, and wellness centers by city, peptide, or provider name.",
};

export default function SearchPage() {
  const BASE = "https://peptidesnearby.com";
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: BASE },
        { name: "Search", url: `${BASE}/search` },
      ])} />
      <Suspense>
        <SearchPageClient />
      </Suspense>
    </>
  );
}
