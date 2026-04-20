import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCities, getCityBySlugAndStateSlug } from "@/lib/data/cities";
import { getProvidersByCity } from "@/lib/data/providers";
import { getStateBySlug } from "@/lib/data/states";
import { JsonLd, breadcrumbJsonLd, itemListJsonLd } from "@/components/seo/JsonLd";
import { FilteredProviderList } from "@/components/filters/ProviderFilters";

type Props = { params: Promise<{ state: string; city: string }> };

export function generateStaticParams() {
  return getAllCities().map((c) => ({
    state: c.stateSlug,
    city: c.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params;
  const city = getCityBySlugAndStateSlug(citySlug, stateSlug);
  if (!city) return {};
  return {
    title: `Peptide Therapy in ${city.name}, ${city.stateCode} — ${city.providerCount} Providers`,
    description: `Find ${city.providerCount} peptide therapy clinics, compounding pharmacies, and wellness centers in ${city.name}, ${city.stateCode}. Compare providers, services, and book your visit.`,
  };
}

export default async function CityPage({ params }: Props) {
  const { state: stateSlug, city: citySlug } = await params;
  const city = getCityBySlugAndStateSlug(citySlug, stateSlug);
  if (!city) notFound();

  const state = getStateBySlug(stateSlug);
  if (!state) notFound();

  const providers = getProvidersByCity(citySlug, city.stateCode);
  const BASE = "https://peptidesnearby.com";

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: BASE },
          { name: state.name, url: `${BASE}/${state.slug}` },
          { name: city.name, url: `${BASE}/${state.slug}/${city.slug}` },
        ])}
      />
      {providers.length > 0 && (
        <JsonLd
          data={itemListJsonLd(
            providers.map((p) => ({
              name: p.name,
              url: `${BASE}/providers/${p.slug}`,
            })),
            `Peptide Therapy Providers in ${city.name}, ${city.stateCode}`,
            `${providers.length} peptide therapy providers in ${city.name}, ${city.stateCode}.`
          )}
        />
      )}

      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="text-sm text-text-tertiary mb-6">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <Link href={`/${state.slug}`} className="hover:text-accent">{state.name}</Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary">{city.name}</span>
          </nav>

          <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-2">
            Peptide Therapy in {city.name}, {city.stateCode}
          </h1>
          <p className="text-text-secondary mb-8">
            {providers.length > 0
              ? `${providers.length} ${providers.length === 1 ? "provider" : "providers"} offering peptide therapy in ${city.name}.`
              : `No providers listed in ${city.name} yet.`}
          </p>

          {providers.length > 0 ? (
            <FilteredProviderList providers={providers} />
          ) : (
            <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
              <h2 className="font-display text-xl text-text-primary mb-2">
                No Providers Listed Yet
              </h2>
              <p className="text-text-secondary mb-4 max-w-[500px] mx-auto">
                We haven&apos;t found any peptide therapy providers in {city.name} yet.
                Know one? Help us grow our directory.
              </p>
              <div className="flex justify-center gap-4">
                <Link
                  href="/submit"
                  className="px-5 py-2.5 bg-accent text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Submit a Practice
                </Link>
                <a
                  href="https://peptidegrades.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 border border-border-medium text-text-secondary rounded-lg hover:border-accent hover:text-accent transition-colors"
                >
                  Try Online Vendors
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
