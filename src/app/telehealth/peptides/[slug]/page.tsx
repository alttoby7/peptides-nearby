import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviderBySlug } from "@/lib/data/providers";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { FilteredProviderList } from "@/components/filters/ProviderFilters";
import telehealthPeptidesData from "@/lib/data/telehealth-peptides.json";

interface TelehealthPeptideEntry {
  slug: string;
  name: string;
  description: string;
  providerCount: number;
  providerSlugs: string[];
}

const telehealthPeptides: TelehealthPeptideEntry[] = telehealthPeptidesData as TelehealthPeptideEntry[];

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  const params = telehealthPeptides.map((tp) => ({ slug: tp.slug }));
  if (params.length === 0) return [{ slug: "_" }];
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = telehealthPeptides.find((tp) => tp.slug === slug);
  if (!entry) return {};
  return {
    title: `Telehealth ${entry.name} Therapy — ${entry.providerCount} Virtual Providers`,
    description: `Find ${entry.providerCount} telehealth providers offering ${entry.name} therapy via virtual visits. Compare clinics, pharmacies, and book online.`,
  };
}

export default async function TelehealthPeptidePage({ params }: Props) {
  const { slug } = await params;
  const entry = telehealthPeptides.find((tp) => tp.slug === slug);
  if (!entry) notFound();

  const providers = entry.providerSlugs
    .map((s) => getProviderBySlug(s))
    .filter((p) => p !== undefined);

  const BASE = "https://www.peptidesnearby.com";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: BASE },
        { name: "Telehealth", url: `${BASE}/telehealth` },
        { name: entry.name, url: `${BASE}/telehealth/peptides/${slug}` },
      ])} />

      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <nav className="text-sm text-text-tertiary mb-6">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/telehealth" className="hover:text-accent">Telehealth</Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary">{entry.name}</span>
          </nav>

          <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-3">
            Telehealth {entry.name} Therapy
          </h1>

          <p className="text-text-secondary mb-4 max-w-[700px]">
            {entry.description}
          </p>

          <p className="text-text-secondary mb-8 max-w-[700px]">
            {providers.length} {providers.length === 1 ? "provider offers" : "providers offer"} {entry.name} therapy via telehealth.
            {" "}Virtual visits let you consult with a licensed provider from home — no travel, no waiting rooms.
          </p>

          {/* Why telehealth for this peptide */}
          <div className="bg-surface-0 border border-border-subtle rounded-xl p-6 mb-8">
            <h2 className="font-display text-xl text-text-primary mb-3">
              Why Get {entry.name} via Telehealth?
            </h2>
            <ul className="space-y-2 text-text-secondary text-sm">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span><strong>Convenience</strong> — Consult from anywhere in your state via video or phone</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span><strong>Wider access</strong> — Connect with specialists even if none are local</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span><strong>Prescription shipped</strong> — Most providers ship {entry.name} directly to your door</span>
              </li>
            </ul>
          </div>

          {providers.length > 0 ? (
            <FilteredProviderList
              providers={providers}
              config={{ showTelehealthFilter: false, showVisitTypeFilter: true }}
            />
          ) : (
            <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
              <p className="text-text-secondary mb-4">No telehealth providers offering {entry.name} yet.</p>
              <Link href={`/peptides/${slug}`} className="inline-block px-5 py-2.5 bg-accent text-white font-semibold rounded-lg">
                Browse Local {entry.name} Providers
              </Link>
            </div>
          )}

          {/* Cross-link to local providers */}
          <div className="mt-8 p-4 bg-surface-0 border border-border-subtle rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">
                Prefer an in-person visit?
              </p>
              <p className="text-sm text-text-primary font-medium">
                Find local {entry.name} providers near you
              </p>
            </div>
            <Link
              href={`/peptides/${slug}`}
              className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors shrink-0"
            >
              Local Providers
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
