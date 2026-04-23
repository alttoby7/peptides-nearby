import type { Metadata } from "next";
import { canonical } from "@/lib/seo/canonical";
import Link from "next/link";
import { getProvidersByType } from "@/lib/data/providers";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { FilteredProviderList } from "@/components/filters/ProviderFilters";

export const metadata: Metadata = {
  title: "Peptide Therapy Clinics",
  description: "Find peptide therapy clinics near you. Browse verified clinics offering BPC-157, semaglutide, tirzepatide, and more.",
  alternates: { canonical: canonical("/clinics") },
};

export default function ClinicsPage() {
  const clinics = getProvidersByType("clinic");
  const BASE = "https://www.peptidesnearby.com";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: BASE },
        { name: "Clinics", url: `${BASE}/clinics` },
      ])} />

      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-2">
            Peptide Therapy Clinics
          </h1>
          <p className="text-text-secondary mb-8">
            {clinics.length > 0
              ? `${clinics.length} ${clinics.length === 1 ? "clinic" : "clinics"} offering peptide therapy.`
              : "No clinics listed yet. Be the first to submit your practice."}
          </p>

          {clinics.length > 0 ? (
            <FilteredProviderList providers={clinics} config={{ showTypeFilter: false }} />
          ) : (
            <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
              <p className="text-text-secondary mb-4">No clinics listed yet.</p>
              <Link href="/submit" className="inline-block px-5 py-2.5 bg-accent text-white font-semibold rounded-lg">
                Submit Your Clinic
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
