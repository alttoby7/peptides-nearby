import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllStates, getStateBySlug } from "@/lib/data/states";
import { getCitiesByStateSlug } from "@/lib/data/cities";
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from "@/components/seo/JsonLd";
import { StatePageClient } from "./StatePageClient";

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

  const totalClinics = cities.reduce((s, c) => s + c.clinicCount, 0);
  const totalPharmacies = cities.reduce((s, c) => s + c.pharmacyCount, 0);
  const totalWellness = cities.reduce((s, c) => s + c.wellnessCenterCount, 0);

  const featured = [...cities]
    .sort((a, b) => b.providerCount - a.providerCount)
    .slice(0, 4);

  const clientCities = cities.map((c) => ({ name: c.name, slug: c.slug }));

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

      <section className="pt-10 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="text-sm text-text-tertiary mb-6">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/states" className="hover:text-accent">States</Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary">{state.name}</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-text-primary mb-3">
              Peptide Therapy in {state.name}
            </h1>
            <p className="text-text-secondary text-lg max-w-[600px]">
              {state.providerCount} {state.providerCount === 1 ? "provider" : "providers"} across {state.cityCount} {state.cityCount === 1 ? "city" : "cities"}.
            </p>
          </div>

          {/* Stats Row */}
          {state.providerCount > 0 && (
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border-subtle rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                <span className="text-sm font-medium text-text-primary">{totalClinics}</span>
                <span className="text-sm text-text-tertiary">Clinics</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border-subtle rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" />
                <span className="text-sm font-medium text-text-primary">{totalPharmacies}</span>
                <span className="text-sm text-text-tertiary">Pharmacies</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border-subtle rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                <span className="text-sm font-medium text-text-primary">{totalWellness}</span>
                <span className="text-sm text-text-tertiary">Wellness Centers</span>
              </div>
            </div>
          )}

          {/* Map CTA */}
          <Link
            href="/map"
            className="flex items-center gap-3 p-4 mb-8 bg-accent-dim border border-accent/15 rounded-xl hover:border-accent/30 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-text-primary">View {state.name} on the map</div>
              <div className="text-xs text-text-secondary">Browse all {state.providerCount} providers visually</div>
            </div>
            <svg className="w-5 h-5 text-accent shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>

          {/* Featured Cities */}
          {featured.length > 0 && (
            <div className="mb-10">
              <h2 className="font-display text-xl text-text-primary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                </svg>
                Top Cities
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0">
                {featured.map((city) => {
                  const total = city.clinicCount + city.pharmacyCount + city.wellnessCenterCount;
                  const clinicPct = total > 0 ? (city.clinicCount / total) * 100 : 0;
                  const pharmPct = total > 0 ? (city.pharmacyCount / total) * 100 : 0;
                  const wellPct = total > 0 ? (city.wellnessCenterCount / total) * 100 : 0;
                  return (
                    <Link
                      key={city.slug}
                      href={`/${state.slug}/${city.slug}`}
                      className="card-lift shrink-0 w-[240px] md:w-auto snap-start p-5 bg-white border border-border-subtle rounded-xl shadow-sm hover:border-accent/30"
                    >
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="font-semibold text-lg text-text-primary">{city.name}</span>
                        <span className="text-xs font-medium text-accent bg-accent-dim px-2 py-0.5 rounded-full">
                          {city.providerCount}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-surface-2 flex mb-2">
                        {clinicPct > 0 && <div className="bg-[#2563eb]" style={{ width: `${clinicPct}%` }} />}
                        {pharmPct > 0 && <div className="bg-[#7c3aed]" style={{ width: `${pharmPct}%` }} />}
                        {wellPct > 0 && <div className="bg-[#059669]" style={{ width: `${wellPct}%` }} />}
                      </div>
                      <div className="flex gap-3 text-[11px] text-text-tertiary">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />{city.clinicCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />{city.pharmacyCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />{city.wellnessCenterCount}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* City Search */}
          <StatePageClient cities={clientCities} stateSlug={state.slug} />

          {/* All Cities */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {cities
              .sort((a, b) => b.providerCount - a.providerCount)
              .map((city) => {
                const tier = city.providerCount >= 10 ? "hot" : city.providerCount > 0 ? "mid" : "empty";
                return (
                  <Link
                    key={city.slug}
                    href={`/${state.slug}/${city.slug}`}
                    id={`section-${city.name.charAt(0).toUpperCase()}`}
                    className={`card-lift relative overflow-hidden p-4 bg-white rounded-xl shadow-sm transition-colors ${
                      tier === "hot"
                        ? "border-l-[3px] border-l-accent border border-border-subtle hover:border-accent/30"
                        : "border border-border-subtle hover:border-accent/30"
                    }`}
                  >
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-semibold ${tier === "empty" ? "text-text-tertiary" : "text-text-primary"}`}>
                          {city.name}
                        </span>
                        {tier === "hot" && (
                          <span className="text-[10px] font-semibold text-accent bg-accent-dim px-1.5 py-px rounded">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className={`text-sm ${tier === "empty" ? "text-text-tertiary/70" : "text-text-tertiary"}`}>
                        {city.providerCount} {city.providerCount === 1 ? "provider" : "providers"}
                      </div>
                      {city.providerCount > 0 && (
                        <div className="flex gap-1.5 mt-1.5">
                          {city.clinicCount > 0 && <span className="w-2 h-2 rounded-full bg-[#2563eb]" />}
                          {city.pharmacyCount > 0 && <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />}
                          {city.wellnessCenterCount > 0 && <span className="w-2 h-2 rounded-full bg-[#059669]" />}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
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
