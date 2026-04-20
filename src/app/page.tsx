import Link from "next/link";
import { getTopCities } from "@/lib/data/cities";
import { getAllServices } from "@/lib/data/services";
import { getAllProviders } from "@/lib/data/providers";
import { getAllStates } from "@/lib/data/states";
import { JsonLd, websiteJsonLd } from "@/components/seo/JsonLd";
import { HeroSearch } from "@/components/search/HeroSearch";

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const PROVIDER_TYPES = [
  {
    title: "Clinics",
    href: "/clinics",
    desc: "Medical clinics specializing in peptide therapy and regenerative medicine.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "text-clinic bg-clinic-bg",
  },
  {
    title: "Compounding Pharmacies",
    href: "/pharmacies",
    desc: "Licensed pharmacies preparing custom peptide formulations.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 5.608a1.5 1.5 0 01-1.452 1.892H4.25a1.5 1.5 0 01-1.452-1.892L4.2 15.3" />
      </svg>
    ),
    color: "text-pharmacy bg-pharmacy-bg",
  },
  {
    title: "Wellness Centers",
    href: "/wellness-centers",
    desc: "Integrative wellness centers offering peptide and hormone therapies.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    color: "text-wellness bg-wellness-bg",
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

  return (
    <>
      <JsonLd data={websiteJsonLd()} />

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #f0f9ff 0%, #fefce8 50%, #f0fdf4 100%)",
        }}
      >
        {/* Decorative dots */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(circle, #94a3b8 0.8px, transparent 0.8px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative max-w-[1240px] mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-[680px]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-border-subtle text-sm text-text-secondary mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-[pulse-soft_2s_ease-in-out_infinite]" />
              {providerCount > 0
                ? `${providerCount} providers across ${cityCount} cities`
                : `${cityCount} cities and growing`}
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
        <section className="py-10 bg-white border-y border-border-subtle">
          <div className="max-w-[1240px] mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { value: providerCount, label: "Providers" },
                { value: cityCount, label: "Cities" },
                { value: stateCount, label: "States" },
                { value: peptideCount, label: "Peptides Tracked" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-text-primary tabular-nums">
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
                <p className="text-sm text-text-secondary leading-relaxed">
                  {type.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Cities */}
      <section className="py-16 md:py-20 bg-white">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {topCities.map((city) => (
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
      <section className="py-16 md:py-20">
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
                className="card-lift group flex items-start gap-4 p-5 bg-white rounded-xl border border-border-subtle shadow-sm"
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
      <section className="py-16 md:py-20 bg-white">
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
                className="card-lift text-center p-4 bg-surface-0 rounded-xl border border-border-subtle hover:border-accent/30"
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

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-white">
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
      <section className="py-16 md:py-20">
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

      {/* Cross-link CTA */}
      <section className="pb-20">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="flex items-center gap-5 p-5 bg-white rounded-xl border border-border-subtle shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary">Prefer to order online?</div>
              <div className="text-sm text-text-tertiary">Compare vendors on our sister site with independent rankings.</div>
            </div>
            <a
              href="https://peptidegrades.com"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-sm text-accent font-medium hover:underline whitespace-nowrap"
            >
              Peptide Grades &rarr;
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
