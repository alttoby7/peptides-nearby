import type { Metadata } from "next";
import { canonical } from "@/lib/seo/canonical";
import Link from "next/link";
import { getProvidersByType } from "@/lib/data/providers";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { FilteredProviderList } from "@/components/filters/ProviderFilters";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "Wellness Centers",
  description: "Find wellness centers near you offering peptide therapy, hormone optimization, and integrative medicine.",
  alternates: { canonical: canonical("/wellness-centers") },
};

export default function WellnessCentersPage() {
  const centers = getProvidersByType("wellness-center");
  const BASE = "https://www.peptidesnearby.com";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: BASE },
        { name: "Wellness Centers", url: `${BASE}/wellness-centers` },
      ])} />

      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-2">
            Wellness Centers
          </h1>
          <p className="text-text-secondary mb-8">
            {centers.length > 0
              ? `${centers.length} wellness ${centers.length === 1 ? "center" : "centers"} offering peptide therapy.`
              : "No wellness centers listed yet. Be the first to submit your practice."}
          </p>

          {centers.length > 0 ? (
            <FilteredProviderList providers={centers} config={{ showTypeFilter: false }} />
          ) : (
            <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
              <p className="text-text-secondary mb-4">No wellness centers listed yet.</p>
              <Link href="/submit" className="inline-block px-5 py-2.5 bg-accent text-white font-semibold rounded-lg">
                Submit Your Practice
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
