import type { Metadata } from "next";
import Link from "next/link";
import { getTopCities } from "@/lib/data/cities";
import { getAllServices } from "@/lib/data/services";
import { getAllProviders } from "@/lib/data/providers";
import { getAllStates } from "@/lib/data/states";
import { canonical } from "@/lib/seo/canonical";
import { JsonLd, websiteJsonLd } from "@/components/seo/JsonLd";
import { HeroSearch } from "@/components/search/HeroSearch";

export const metadata: Metadata = {
  alternates: { canonical: canonical("/") },
};

const PROVIDER_TYPES = [
  {
    title: "Clinics",
    href: "/clinics",
    desc: "Medical clinics specializing in peptide therapy and regenerative medicine.",
    typeKey: "clinic" as const,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "text-clinic bg-clinic-bg",
    dot: "bg-[#2563eb]",
  },
  {
    title: "Compounding Pharmacies",
    href: "/pharmacies",
    desc: "Licensed pharmacies preparing custom peptide formulations.",
    typeKey: "pharmacy" as const,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 5.608a1.5 1.5 0 01-1.452 1.892H4.25a1.5 1.5 0 01-1.452-1.892L4.2 15.3" />
      </svg>
    ),
    color: "text-pharmacy bg-pharmacy-bg",
    dot: "bg-[#7c3aed]",
  },
  {
    title: "Wellness Centers",
    href: "/wellness-centers",
    desc: "Integrative wellness centers offering peptide and hormone therapies.",
    typeKey: "wellness-center" as const,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    color: "text-wellness bg-wellness-bg",
    dot: "bg-[#059669]",
  },
];

export default function HomePage() {
  const topCities = getTopCities(12);
  const services = getAllServices().slice(0, 6);
  const allProviders = getAllProviders();
  const providerCount = allProviders.length;
  const stateCount = getAllStates().length;
  const cityCount = getTopCities(999).length;
  const peptideCount = new Set(allProviders.flatMap((p) => p.peptides)).size;

  const typeCounts = {
    clinic: allProviders.filter((p) => p.type === "clinic").length,
    pharmacy: allProviders.filter((p) => p.type === "pharmacy").length,
    "wellness-center": allProviders.filter((p) => p.type === "wellness-center").length,
  };

  return (
    <>
      <JsonLd data={websiteJsonLd()} />

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(14,165,233,0.04) 0%, rgba(249,250,251,1) 30%, rgba(5,150,105,0.03) 60%, rgba(249,250,251,1) 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 600px 400px at 15% 20%, rgba(14,165,233,0.08), transparent), radial-gradient(ellipse 500px 350px at 85% 70%, rgba(5,150,105,0.06), transparent), radial-gradient(ellipse 400px 300px at 50% 50%, rgba(124,58,237,0.04), transparent)",
          }}
        />
        <div className="relative max-w-[1240px] mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-[680px]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-border-subtle text-sm text-text-secondary mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-[pulse-soft_2s_ease-in-out_infinite]" />
              {providerCount.toLocaleString()} providers across {cityCount} cities
            </div>

            <h1 className="font-display text-[2.5rem] md:text-[3.25rem] lg:text-[3.75rem] leading-[1.1] text-text-primary mb-5">
              Find peptide therapy{" "}
              <span className="relative">
                <span className="text-accent">near you</span>
                <svg className="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                  <path d="M1 5.5C40 2 80 2 100 4C120 6 160 3 199 5" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
                </svg>
              </span>
            </h1>

            <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-[540px]">
              Browse clinics, compounding pharmacies, and wellness centers offering BPC-157, semaglutide, and more — all in one directory.
            </p>

            <div className="mb-6 max-w-[540px]">
              <HeroSearch />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/states"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-colors shadow-[0_2px_12px_rgba(14,165,233,0.25)]"
              >
                Browse by State
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/map"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-text-primary font-semibold rounded-xl border border-border-medium hover:border-accent hover:text-accent transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                Find Near Me
              </Link>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-text-primary font-semibold rounded-xl border border-border-medium hover:border-accent hover:text-accent transition-colors shadow-sm"
              >
                Add Your Practice
              </Link>
            </div>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-12 text-sm text-text-tertiary">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-verified" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Verified providers
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {stateCount} states covered
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Free to use, always
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {providerCount > 0 && (
        <section className="py-12 bg-white border-y border-border-subtle">
          <div className="max-w-[1240px] mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { value: providerCount.toLocaleString(), label: "Providers", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg> },
                { value: cityCount.toLocaleString(), label: "Cities", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg> },
                { value: stateCount.toString(), label: "States", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg> },
                { value: peptideCount.toString(), label: "Peptides Tracked", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082" /></svg> },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center mx-auto mb-3 text-accent">
                    {stat.icon}
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-accent tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-sm text-text-tertiary mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Provider Types */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-2xl md:text-3xl text-text-primary mb-2">
            Browse by provider type
          </h2>
          <p className="text-text-secondary mb-8">
            Find the right type of practice for your needs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PROVIDER_TYPES.map((type) => (
              <Link
                key={type.href}
                href={type.href}
                className="card-lift group p-6 bg-white rounded-2xl border border-border-subtle shadow-sm"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${type.color}`}>
                  {type.icon}
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">
                  {type.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-3">
                  {type.desc}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${type.dot}`} />
                  <span className="text-sm font-medium text-text-primary">
                    {typeCounts[type.typeKey].toLocaleString()}
                  </span>
                  <span className="text-sm text-text-tertiary">providers</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Map Preview */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-[1240px] mx-auto px-6">
          <Link
            href="/map"
            className="group relative block overflow-hidden rounded-2xl border border-border-subtle shadow-sm hover:border-accent/30 transition-colors"
          >
            <div
              className="relative h-[200px] md:h-[280px]"
              style={{
                background: "linear-gradient(145deg, #e0f2fe 0%, #f0fdf4 40%, #ede9fe 70%, #e0f2fe 100%)",
              }}
            >
              <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle, rgba(14,165,233,0.15) 2px, transparent 2px), radial-gradient(circle, rgba(124,58,237,0.12) 1.5px, transparent 1.5px), radial-gradient(circle, rgba(5,150,105,0.12) 1.5px, transparent 1.5px)", backgroundSize: "60px 40px, 90px 70px, 75px 55px", backgroundPosition: "0 0, 30px 20px, 15px 35px" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/90 border border-border-subtle shadow-md flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                    <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div className="font-display text-xl text-text-primary mb-1">Explore the Interactive Map</div>
                  <div className="text-sm text-text-secondary">{providerCount.toLocaleString()} providers with geolocation &middot; Find Near Me</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Top Cities */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl text-text-primary mb-2">
                Top cities
              </h2>
              <p className="text-text-secondary">
                Explore peptide therapy providers in major US cities.
              </p>
            </div>
            <Link href="/states" className="hidden md:flex items-center gap-1 text-sm text-accent font-medium hover:underline">
              All states
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {topCities.slice(0, 3).map((city) => (
              <Link
                key={`${city.stateSlug}-${city.slug}`}
                href={`/${city.stateSlug}/${city.slug}`}
                className="card-lift group p-5 bg-white rounded-xl border border-border-subtle shadow-sm hover:border-accent/30 lg:col-span-1 md:col-span-1"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-semibold text-lg text-text-primary group-hover:text-accent transition-colors">{city.name}</span>
                  <span className="text-xs font-medium text-accent bg-accent-dim px-2 py-0.5 rounded-full">
                    {city.providerCount}
                  </span>
                </div>
                <div className="text-xs text-text-tertiary mb-2">{city.stateCode}</div>
                <div className="h-1.5 rounded-full overflow-hidden bg-surface-2 flex">
                  {city.clinicCount > 0 && <div className="bg-[#2563eb]" style={{ width: `${(city.clinicCount / city.providerCount) * 100}%` }} />}
                  {city.pharmacyCount > 0 && <div className="bg-[#7c3aed]" style={{ width: `${(city.pharmacyCount / city.providerCount) * 100}%` }} />}
                  {city.wellnessCenterCount > 0 && <div className="bg-[#059669]" style={{ width: `${(city.wellnessCenterCount / city.providerCount) * 100}%` }} />}
                </div>
                <div className="flex gap-3 mt-2 text-[11px] text-text-tertiary">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />{city.clinicCount}</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />{city.pharmacyCount}</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />{city.wellnessCenterCount}</span>
                </div>
              </Link>
            ))}
            <div className="grid grid-cols-1 gap-3 lg:col-span-1">
              {topCities.slice(3, 6).map((city) => (
                <Link
                  key={`${city.stateSlug}-${city.slug}`}
                  href={`/${city.stateSlug}/${city.slug}`}
                  className="card-lift group flex items-center gap-3 p-3 bg-white rounded-xl border border-border-subtle hover:border-accent/30"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent-dim flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors truncate">
                      {city.name}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {city.stateCode} &middot; {city.providerCount} providers
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
            {topCities.slice(6).map((city) => (
              <Link
                key={`${city.stateSlug}-${city.slug}`}
                href={`/${city.stateSlug}/${city.slug}`}
                className="card-lift group flex items-center gap-3 p-4 bg-surface-0 rounded-xl border border-border-subtle hover:border-accent/30"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-text-primary text-[15px] group-hover:text-accent transition-colors truncate">
                    {city.name}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {city.stateCode} &middot; {city.providerCount} {city.providerCount === 1 ? "provider" : "providers"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8 md:hidden">
            <Link href="/states" className="text-sm text-accent font-medium hover:underline">
              View all {stateCount} states &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Treatments */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-2xl md:text-3xl text-text-primary mb-2">
            Popular treatments
          </h2>
          <p className="text-text-secondary mb-8">
            Find providers by the specific peptide or therapy you need.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/peptides/${service.slug}`}
                className="card-lift group flex items-start gap-4 p-5 bg-surface-0 rounded-xl border border-border-subtle shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 5.608a1.5 1.5 0 01-1.452 1.892H4.25a1.5 1.5 0 01-1.452-1.892L4.2 15.3" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                  <div className="text-xs text-text-tertiary mt-2">
                    {service.providerCount} {service.providerCount === 1 ? "provider" : "providers"} &middot; {service.cityCount} {service.cityCount === 1 ? "city" : "cities"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Treatment Goals */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-2xl md:text-3xl text-text-primary mb-2">
            Browse by treatment goal
          </h2>
          <p className="text-text-secondary mb-8">
            Find providers based on what you want to achieve.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { slug: "weight-loss", label: "Weight Loss" },
              { slug: "anti-aging", label: "Anti-Aging" },
              { slug: "hormone-optimization", label: "Hormones" },
              { slug: "injury-recovery", label: "Recovery" },
              { slug: "sexual-health", label: "Sexual Health" },
              { slug: "cognitive-enhancement", label: "Cognitive" },
            ].map((goal) => (
              <Link
                key={goal.slug}
                href={`/goals/${goal.slug}`}
                className="card-lift text-center p-4 bg-white rounded-xl border border-border-subtle hover:border-accent/30 shadow-sm"
              >
                <div className="font-semibold text-text-primary text-sm">{goal.label}</div>
              </Link>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Link
              href="/telehealth"
              className="inline-flex items-center gap-2 text-sm text-accent font-medium hover:underline"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3" />
              </svg>
              Browse telehealth providers by state
            </Link>
          </div>
        </div>
      </section>

      {/* Why Peptides Nearby */}
      <section className="py-16 md:py-20 bg-white border-y border-border-subtle">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-2xl md:text-3xl text-text-primary mb-8 text-center">
            Why Peptides Nearby
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: `${providerCount.toLocaleString()}+ Verified Providers`, desc: "Every listing checked for active practice and proper licensing." },
              { title: "Free Forever", desc: "No paywalls, no premium tiers. Open directory for patients." },
              { title: "Updated Weekly", desc: "New providers added and existing data refreshed continuously." },
              { title: "Interactive Map", desc: "Browse visually with geolocation to find the closest providers." },
            ].map((item) => (
              <div key={item.title} className="p-5 bg-surface-0 rounded-xl border border-border-subtle">
                <div className="font-semibold text-text-primary text-sm mb-1">{item.title}</div>
                <div className="text-xs text-text-secondary leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20">
        <div className="max-w-[900px] mx-auto px-6">
          <h2 className="font-display text-2xl md:text-3xl text-text-primary mb-2 text-center">
            How it works
          </h2>
          <p className="text-text-secondary text-center mb-12">
            Three steps to finding the right provider.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "1",
                title: "Search your city",
                desc: "Browse by state or city to find peptide therapy providers in your area.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                ),
              },
              {
                step: "2",
                title: "Compare providers",
                desc: "View services, peptides offered, hours, and patient reviews at a glance.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                  </svg>
                ),
              },
              {
                step: "3",
                title: "Book your visit",
                desc: "Contact the provider directly or use their online booking to schedule.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent-dim text-accent flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-mono text-text-tertiary uppercase tracking-widest mb-2">
                  Step {item.step}
                </div>
                <h3 className="font-semibold text-text-primary mb-2 text-lg">
                  {item.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA: Add Practice */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-[800px] mx-auto px-6">
          <div
            className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle at 20% 50%, #0ea5e9 0%, transparent 50%), radial-gradient(circle at 80% 50%, #059669 0%, transparent 50%)",
              }}
            />
            <div className="relative">
              <h2 className="font-display text-2xl md:text-3xl text-white mb-3">
                Are you a provider?
              </h2>
              <p className="text-slate-300 mb-6 max-w-[480px] mx-auto">
                List your clinic, pharmacy, or wellness center for free. Reach patients searching for peptide therapy in your area.
              </p>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-text-primary font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Submit Your Practice
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
