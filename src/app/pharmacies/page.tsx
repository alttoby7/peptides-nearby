import type { Metadata } from "next";
import Link from "next/link";
import { getProvidersByType } from "@/lib/data/providers";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { FilteredProviderList } from "@/components/filters/ProviderFilters";

export const metadata: Metadata = {
  title: "Compounding Pharmacies",
  description: "Find compounding pharmacies near you that offer peptide therapy, custom formulations, and specialty medications.",
};

export default function PharmaciesPage() {
  const pharmacies = getProvidersByType("pharmacy");
  const BASE = "https://www.peptidesnearby.com";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: BASE },
        { name: "Pharmacies", url: `${BASE}/pharmacies` },
      ])} />

      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-2">
            Compounding Pharmacies
          </h1>
          <p className="text-text-secondary mb-8">
            {pharmacies.length > 0
              ? `${pharmacies.length} compounding ${pharmacies.length === 1 ? "pharmacy" : "pharmacies"} offering peptide formulations.`
              : "No pharmacies listed yet. Be the first to submit your pharmacy."}
          </p>

          {pharmacies.length > 0 ? (
            <FilteredProviderList providers={pharmacies} config={{ showTypeFilter: false }} />
          ) : (
            <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
              <p className="text-text-secondary mb-4">No pharmacies listed yet.</p>
              <Link href="/submit" className="inline-block px-5 py-2.5 bg-accent text-white font-semibold rounded-lg">
                Submit Your Pharmacy
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
