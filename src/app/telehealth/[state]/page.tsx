import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviderBySlug } from "@/lib/data/providers";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { FilteredProviderList } from "@/components/filters/ProviderFilters";
import telehealthData from "@/lib/data/telehealth.json";

interface TelehealthStateEntry {
  stateCode: string;
  stateName: string;
  stateSlug: string;
  providerSlugs: string[];
  providerCount: number;
  visitTypes: string[];
}

const telehealthStates: TelehealthStateEntry[] = telehealthData as TelehealthStateEntry[];

type Props = { params: Promise<{ state: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  const params = telehealthStates.map((s) => ({ state: s.stateSlug }));
  if (params.length === 0) return [{ state: "_" }];
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const entry = telehealthStates.find((s) => s.stateSlug === stateSlug);
  if (!entry) return {};
  return {
    title: `Telehealth Peptide Therapy in ${entry.stateName} — ${entry.providerCount} Providers`,
    description: `Find ${entry.providerCount} telehealth peptide therapy providers licensed in ${entry.stateName}. Virtual visits for BPC-157, semaglutide, and more.`,
  };
}

const VISIT_TYPE_LABELS: Record<string, string> = {
  video: "Video Visits",
  phone: "Phone Visits",
  async: "Async / Messaging",
};

export default async function TelehealthStatePage({ params }: Props) {
  const { state: stateSlug } = await params;
  const entry = telehealthStates.find((s) => s.stateSlug === stateSlug);
  if (!entry) notFound();

  const providers = entry.providerSlugs
    .map((slug) => getProviderBySlug(slug))
    .filter((p) => p !== undefined);

  const BASE = "https://www.peptidesnearby.com";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: BASE },
        { name: "Telehealth", url: `${BASE}/telehealth` },
        { name: entry.stateName, url: `${BASE}/telehealth/${stateSlug}` },
      ])} />

      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <nav className="text-sm text-text-tertiary mb-6">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/telehealth" className="hover:text-accent">Telehealth</Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary">{entry.stateName}</span>
          </nav>

          <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-3">
            Telehealth Peptide Therapy in {entry.stateName}
          </h1>

          <p className="text-text-secondary mb-4 max-w-[700px]">
            {providers.length} {providers.length === 1 ? "provider offers" : "providers offer"} virtual peptide therapy visits to patients in {entry.stateName}.
            These providers are licensed to treat patients located in {entry.stateName} via telehealth — they may be based in-state or out-of-state.
          </p>

          {/* Visit types available in this state */}
          {entry.visitTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-xs text-text-tertiary leading-6">Available visit types:</span>
              {entry.visitTypes.map((vt) => (
                <span
                  key={vt}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium"
                >
                  {VISIT_TYPE_LABELS[vt] ?? vt}
                </span>
              ))}
            </div>
          )}

          {/* What to ask checklist */}
          <div className="bg-surface-0 border border-border-subtle rounded-xl p-5 mb-8">
            <h2 className="font-semibold text-text-primary text-sm mb-3">
              Before You Book — What to Ask
            </h2>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">&#10003;</span>
                <span>Confirm the provider is licensed to practice in {entry.stateName}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">&#10003;</span>
                <span>Ask if lab work is required and where to complete it locally</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">&#10003;</span>
                <span>Confirm the consultation fee and what&apos;s included (follow-ups, labs, peptide cost)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">&#10003;</span>
                <span>Ask which compounding pharmacy they use and whether it ships to {entry.stateName}</span>
              </li>
            </ul>
          </div>

          {/* Provider list */}
          {providers.length > 0 ? (
            <FilteredProviderList
              providers={providers}
              config={{ showTelehealthFilter: false, showVisitTypeFilter: true }}
            />
          ) : (
            <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
              <p className="text-text-secondary mb-4">No telehealth providers serving {entry.stateName} yet.</p>
              <Link href="/states" className="inline-block px-5 py-2.5 bg-accent text-white font-semibold rounded-lg">
                Browse Local Providers
              </Link>
            </div>
          )}

          {/* Cross-link to local providers */}
          <div className="mt-8 p-4 bg-surface-0 border border-border-subtle rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">
                Looking for in-person providers?
              </p>
              <p className="text-sm text-text-primary font-medium">
                Browse local peptide therapy clinics in {entry.stateName}
              </p>
            </div>
            <Link
              href={`/${entry.stateSlug}`}
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
