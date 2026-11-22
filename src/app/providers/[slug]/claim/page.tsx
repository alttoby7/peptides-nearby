import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProviders, getProviderBySlug, getProviderSlugs } from "@/lib/data/providers";
import { stateSlugFromAny } from "@/lib/geo/states";
import { ClaimForm } from "./ClaimForm";

function slugifyCity(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function hostOf(website?: string): string {
  if (!website) return "";
  try {
    return new URL(website.startsWith("http") ? website : `http://${website}`).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

let shared: Set<string> | null = null;
function sharedHosts(): Set<string> {
  if (shared) return shared;
  const counts = new Map<string, number>();
  for (const p of getAllProviders()) {
    const h = hostOf(p.website);
    if (h) counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  shared = new Set([...counts].filter(([, n]) => n > 1).map(([h]) => h));
  return shared;
}

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getProviderSlugs().map((slug) => ({ slug }));
}

// Claim is a transactional flow — intentionally noindex. No canonical.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const provider = getProviderBySlug(slug);
  if (!provider) return { title: "Provider Not Found", robots: { index: false, follow: false } };
  return {
    title: `Claim ${provider.name} — Peptides Nearby`,
    description: `Are you the owner or manager of ${provider.name}? Claim the free listing, verify ownership with your work email, and publish accurate details.`,
    robots: { index: false, follow: false },
  };
}

export default async function ClaimPage({ params }: Props) {
  const { slug } = await params;
  const provider = getProviderBySlug(slug);
  if (!provider) notFound();

  const stateSlug = stateSlugFromAny(provider.address.stateCode) ?? "";
  const citySlug = slugifyCity(provider.address.city);
  const tier = provider.verificationTier ?? "listed";
  // Email-link verification only works when the listing's website host belongs
  // to this practice alone (mirrors functions-lib/claim-shared.ts domainMatches).
  // Shared franchise hosts and .edu/.gov hosts go to a phone check instead.
  let siteHost = hostOf(provider.website);
  if (siteHost && (/\.(edu|gov)$/.test(siteHost) || sharedHosts().has(siteHost))) siteHost = "";

  return (
    <section className="pt-12 pb-20">
      <div className="max-w-[640px] mx-auto px-6">
        <nav className="text-sm text-text-tertiary mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/${stateSlug}/${citySlug}`} className="hover:text-accent">{provider.address.city}</Link>
          <span className="mx-2">/</span>
          <Link href={`/providers/${slug}`} className="hover:text-accent">{provider.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-text-secondary">Claim</span>
        </nav>

        <h1 className="font-display text-3xl text-text-primary mb-2">
          Claim {provider.name}
        </h1>

        {tier === "claimed" || tier === "trusted" ? (
          <div className="p-6 bg-surface-1 border border-border-subtle rounded-xl mb-8">
            <p className="text-text-secondary">
              This listing has already been claimed. If you believe this is an error, please{" "}
              <Link href="/submit" className="text-accent hover:underline">contact us</Link>.
            </p>
          </div>
        ) : (
          <>
            <p className="text-text-secondary mb-4">
              Claiming is free. Verify that you manage this practice, then tell patients how you actually work.
            </p>
            <ul className="text-sm text-text-secondary mb-8 flex flex-col gap-2">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">&#10003;</span>
                <span><strong>Simple verification</strong>: {siteHost ? `use a work email ending in @${siteHost} and we'll send you a confirm link. Other addresses get a phone check.` : "we confirm by calling the number on the listing."}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">&#10003;</span>
                <span><strong>Your words, not a scraped blurb</strong>: description, services, hours, telehealth and booking link</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">&#10003;</span>
                <span><strong>Claimed badge</strong> with the date you confirmed the details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">&#10003;</span>
                <span><strong>No cost, no contract</strong>. We never change medical or safety information for pay.</span>
              </li>
            </ul>

            <ClaimForm providerSlug={slug} providerName={provider.name} siteHost={siteHost} />
          </>
        )}
      </div>
    </section>
  );
}
