import type { Metadata } from "next";
import Link from "next/link";
import { getAllStates } from "@/lib/data/states";
import { getCitiesByStateSlug } from "@/lib/data/cities";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { StatesPageClient } from "./StatesPageClient";

export const metadata: Metadata = {
  title: "All States — Peptide Therapy Providers",
  description:
    "Browse peptide therapy providers by state. Find clinics, compounding pharmacies, and wellness centers across the United States.",
};

const REGIONS: Record<string, string[]> = {
  South: ["FL", "TX", "NC", "VA", "GA", "TN", "SC", "AL", "LA", "KY", "OK", "MS", "AR", "WV", "DC"],
  West: ["CA", "WA", "CO", "AZ", "OR", "ID", "UT", "NV", "NM", "HI", "AK"],
  Midwest: ["OH", "WI", "IN", "MO", "IL", "MI", "MN", "IA", "KS", "NE"],
  Northeast: ["PA", "NY", "MA", "MD", "NJ", "ME", "NH", "RI"],
};

function getTopCityNames(stateSlug: string, count: number): string[] {
  return getCitiesByStateSlug(stateSlug)
    .sort((a, b) => b.providerCount - a.providerCount)
    .slice(0, count)
    .map((c) => c.name);
}

export default function StatesPage() {
  const states = getAllStates();
  const totalProviders = states.reduce((s, st) => s + st.providerCount, 0);

  const featured = [...states]
    .sort((a, b) => b.providerCount - a.providerCount)
    .slice(0, 6)
    .map((s) => ({
      ...s,
      topCities: getTopCityNames(s.slug, 3),
    }));

  const regionData = Object.entries(REGIONS).map(([region, codes]) => {
    const regionStates = codes
      .map((code) => states.find((s) => s.code === code))
      .filter(Boolean)
      .sort((a, b) => b!.providerCount - a!.providerCount) as typeof states;
    return {
      name: region,
      states: regionStates,
      providerCount: regionStates.reduce((s, st) => s + st.providerCount, 0),
    };
  });

  const clientStates = states.map((s) => ({ name: s.name, slug: s.slug, code: s.code }));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://www.peptidesnearby.com" },
          { name: "States", url: "https://www.peptidesnearby.com/states" },
        ])}
      />

      <section className="pt-10 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          {/* Header */}
          <div className="mb-10">
            <h1 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-text-primary mb-3">
              Browse by State
            </h1>
            <p className="text-text-secondary text-lg max-w-[600px]">
              {totalProviders.toLocaleString()} providers across {states.length} states.
              Find peptide therapy clinics, pharmacies, and wellness centers near you.
            </p>
          </div>

          {/* Search (client island) */}
          <StatesPageClient states={clientStates} />

          {/* Featured States */}
          <div className="mb-12">
            <h2 className="font-display text-xl text-text-primary mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
              </svg>
              Most Popular
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
              {featured.map((state) => (
                <Link
                  key={state.slug}
                  href={`/${state.slug}`}
                  className="card-lift shrink-0 w-[280px] lg:w-auto snap-start p-5 bg-white border border-border-subtle rounded-xl shadow-sm hover:border-accent/30 relative overflow-hidden"
                >
                  <div className="absolute -right-1 -bottom-2 text-[4rem] font-bold leading-none text-text-primary/[0.03] select-none pointer-events-none">
                    {state.code}
                  </div>
                  <div className="relative">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-semibold text-lg text-text-primary">{state.name}</span>
                      <span className="text-xs font-medium text-accent bg-accent-dim px-2 py-0.5 rounded-full">
                        {state.providerCount}
                      </span>
                    </div>
                    <div className="text-xs text-text-tertiary mb-3">
                      {state.cityCount} {state.cityCount === 1 ? "city" : "cities"}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {state.topCities.map((city) => (
                        <span key={city} className="text-[11px] text-text-secondary bg-surface-2 px-2 py-0.5 rounded">
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Map CTA */}
          <Link
            href="/map"
            className="flex items-center gap-3 p-4 mb-12 bg-accent-dim border border-accent/15 rounded-xl hover:border-accent/30 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-text-primary">Prefer to browse visually?</div>
              <div className="text-xs text-text-secondary">View all {totalProviders.toLocaleString()} providers on our interactive map</div>
            </div>
            <svg className="w-5 h-5 text-accent shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>

          {/* Regional Sections */}
          {regionData.map((region) => (
            <div key={region.name} className="mb-10" id={`region-${region.name.toLowerCase()}`}>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-display text-xl text-text-primary">{region.name}</h2>
                <span className="text-xs text-text-tertiary">
                  {region.providerCount.toLocaleString()} providers
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {region.states.map((state) => {
                  const tier = state.providerCount >= 100 ? "hot" : state.providerCount >= 10 ? "mid" : "low";
                  return (
                    <Link
                      key={state.slug}
                      href={`/${state.slug}`}
                      id={`section-${state.name.charAt(0).toUpperCase()}`}
                      className={`card-lift relative overflow-hidden p-4 bg-white rounded-xl shadow-sm transition-colors ${
                        tier === "hot"
                          ? "border-l-[3px] border-l-accent border border-border-subtle hover:border-accent/30"
                          : tier === "low"
                          ? "border border-border-subtle hover:border-accent/30"
                          : "border border-border-subtle hover:border-accent/30"
                      }`}
                    >
                      <div className="absolute -right-1 -bottom-1.5 text-[2.5rem] font-bold leading-none text-text-primary/[0.03] select-none pointer-events-none">
                        {state.code}
                      </div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`font-semibold ${tier === "low" ? "text-text-secondary" : "text-text-primary"}`}>
                            {state.name}
                          </span>
                          {tier === "hot" && (
                            <span className="text-[10px] font-semibold text-accent bg-accent-dim px-1.5 py-px rounded">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className={`text-sm ${tier === "low" ? "text-text-tertiary/70" : "text-text-tertiary"}`}>
                          {state.providerCount} {state.providerCount === 1 ? "provider" : "providers"} &middot; {state.cityCount} {state.cityCount === 1 ? "city" : "cities"}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
