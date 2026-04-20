import type { Metadata } from "next";
import Link from "next/link";
import { getAllStates } from "@/lib/data/states";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "All States — Peptide Therapy Providers",
  description:
    "Browse peptide therapy providers by state. Find clinics, compounding pharmacies, and wellness centers across the United States.",
};

export default function StatesPage() {
  const states = getAllStates();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://www.peptidesnearby.com" },
          { name: "States", url: "https://www.peptidesnearby.com/states" },
        ])}
      />

      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-2">
            Browse by State
          </h1>
          <p className="text-text-secondary mb-8">
            Find peptide therapy providers in {states.length} states across the US.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {states.map((state) => (
              <Link
                key={state.slug}
                href={`/${state.slug}`}
                className="card-lift p-4 bg-white border border-border-subtle rounded-xl shadow-sm hover:border-accent/30"
              >
                <div className="font-semibold text-text-primary">
                  {state.name}
                </div>
                <div className="text-sm text-text-tertiary mt-1">
                  {state.providerCount} {state.providerCount === 1 ? "provider" : "providers"} &middot; {state.cityCount} {state.cityCount === 1 ? "city" : "cities"}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
