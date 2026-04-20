import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllStates, getStateBySlug } from "@/lib/data/states";
import { getCitiesByStateSlug } from "@/lib/data/cities";
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from "@/components/seo/JsonLd";

type Props = { params: Promise<{ state: string }> };

export function generateStaticParams() {
  return getAllStates().map((s) => ({ state: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  if (!state) return {};
  const thin = state.providerCount < 10;
  return {
    title: `Peptide Therapy in ${state.name}${state.providerCount > 0 ? ` — ${state.providerCount} Providers` : ""}`,
    description: `Find peptide therapy clinics, compounding pharmacies, and wellness centers in ${state.name}. Browse ${state.cityCount} cities with ${state.providerCount} providers.`,
    robots: thin ? { index: false, follow: true } : undefined,
  };
}

export default async function StatePage({ params }: Props) {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  if (!state) notFound();

  const cities = getCitiesByStateSlug(stateSlug);
  const BASE = "https://www.peptidesnearby.com";

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: BASE },
          { name: "States", url: `${BASE}/states` },
          { name: state.name, url: `${BASE}/${state.slug}` },
        ])}
      />
      <JsonLd
        data={itemListJsonLd(
          cities.map((c) => ({
            name: `${c.name}, ${c.stateCode}`,
            url: `${BASE}/${state.slug}/${c.slug}`,
          })),
          `Peptide Therapy in ${state.name}`,
          `${state.providerCount} peptide therapy providers across ${state.cityCount} cities in ${state.name}.`
        )}
      />

      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="text-sm text-text-tertiary mb-6">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/states" className="hover:text-accent">States</Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary">{state.name}</span>
          </nav>

          <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-2">
            Peptide Therapy in {state.name}
          </h1>
          <p className="text-text-secondary mb-8">
            {state.providerCount} {state.providerCount === 1 ? "provider" : "providers"} across {state.cityCount} {state.cityCount === 1 ? "city" : "cities"}.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cities.map((city) => (
              <Link
                key={city.slug}
                href={`/${state.slug}/${city.slug}`}
                className="card-lift p-4 bg-white border border-border-subtle rounded-xl shadow-sm hover:border-accent/30"
              >
                <div className="font-semibold text-text-primary">
                  {city.name}
                </div>
                <div className="text-sm text-text-tertiary mt-1">
                  {city.providerCount} {city.providerCount === 1 ? "provider" : "providers"}
                </div>
              </Link>
            ))}
          </div>

          {state.providerCount === 0 && (
            <div className="mt-8 p-6 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
              <p className="text-text-secondary mb-4">
                No providers listed in {state.name} yet. Know a peptide therapy provider?
              </p>
              <Link
                href="/submit"
                className="inline-block px-5 py-2.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent-hover transition-colors"
              >
                Submit a Practice
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
