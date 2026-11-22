import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviderBySlug, getProviderSlugs } from "@/lib/data/providers";
import { stateSlugFromAny } from "@/lib/geo/states";
import { ClaimForm } from "./ClaimForm";

function slugifyCity(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
  let siteHost = "";
  try {
    if (provider.website) siteHost = new URL(provider.website.startsWith("http") ? provider.website : `http://${provider.website}`).hostname.toLowerCase().replace(/^www\./, "");
  } catch { siteHost = ""; }

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
                <span><strong>Instant verification</strong>: use a work email on your practice&apos;s website domain{siteHost ? ` (@${siteHost})` : ""}. Otherwise we confirm by phone.</span>
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
