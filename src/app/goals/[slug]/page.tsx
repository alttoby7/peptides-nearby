import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviderBySlug } from "@/lib/data/providers";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { FilteredProviderList } from "@/components/filters/ProviderFilters";
import goalsData from "@/lib/data/goals.json";

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface GoalEntry {
  slug: string;
  name: string;
  description: string;
  peptides: string[];
  providerCount: number;
  providerSlugs: string[];
}

const goals: GoalEntry[] = goalsData as GoalEntry[];

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  const params = goals.map((g) => ({ slug: g.slug }));
  if (params.length === 0) return [{ slug: "_" }];
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const goal = goals.find((g) => g.slug === slug);
  if (!goal) return {};
  return {
    title: `${goal.name} Peptide Therapy — ${goal.providerCount} Providers`,
    description: `${goal.description} Find ${goal.providerCount} providers offering peptide therapy for ${goal.name.toLowerCase()}.`,
  };
}

export default async function GoalPage({ params }: Props) {
  const { slug } = await params;
  const goal = goals.find((g) => g.slug === slug);
  if (!goal) notFound();

  const providers = goal.providerSlugs
    .map((s) => getProviderBySlug(s))
    .filter((p) => p !== undefined);

  const BASE = "https://peptidesnearby.com";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: BASE },
        { name: goal.name, url: `${BASE}/goals/${slug}` },
      ])} />

      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <nav className="text-sm text-text-tertiary mb-6">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary">{goal.name}</span>
          </nav>

          <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-2">
            {goal.name} Peptide Therapy
          </h1>
          <p className="text-text-secondary mb-6 max-w-[700px]">
            {goal.description}
          </p>

          {/* Related peptides */}
          {goal.peptides.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-3">
                Common Peptides for {goal.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {goal.peptides.map((p) => (
                  <Link
                    key={p}
                    href={`/peptides/${slugify(p)}`}
                    className="text-sm px-3 py-1.5 bg-accent-dim text-accent rounded-lg hover:bg-accent/20 transition-colors"
                  >
                    {p}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <h2 className="font-semibold text-text-primary mb-4">
            {providers.length} {providers.length === 1 ? "Provider" : "Providers"}
          </h2>

          {providers.length > 0 ? (
            <FilteredProviderList providers={providers} />
          ) : (
            <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
              <p className="text-text-secondary mb-4">
                No providers tagged for {goal.name.toLowerCase()} yet. Try searching by specific peptides above.
              </p>
              <Link href="/states" className="inline-block px-5 py-2.5 bg-accent text-white font-semibold rounded-lg">
                Browse All Providers
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
