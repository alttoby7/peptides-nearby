import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllServices, getServiceBySlug } from "@/lib/data/services";
import { getProvidersByService } from "@/lib/data/providers";
import { canonical } from "@/lib/seo/canonical";
import { peptideUrl } from "@/lib/seo/paths";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { FilteredProviderList } from "@/components/filters/ProviderFilters";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllServices().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  const thin = service.providerCount < 3;
  const titleCount = service.providerCount > 0 ? ` — ${service.providerCount} Providers` : "";
  return {
    title: `Find ${service.name}${service.name.toLowerCase().includes("therapy") ? "" : " Therapy"} Near You${titleCount}`,
    description: service.providerCount > 0
      ? `${service.description} Browse ${service.providerCount} providers offering ${service.name} in ${service.cityCount} cities.`
      : service.description,
    robots: thin ? { index: false, follow: true } : undefined,
    alternates: { canonical: canonical(peptideUrl(slug)) },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const providers = getProvidersByService(slug);
  const BASE = "https://www.peptidesnearby.com";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: BASE },
        { name: service.name, url: `${BASE}/peptides/${slug}` },
      ])} />

      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <nav className="text-sm text-text-tertiary mb-6">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary">{service.name}</span>
          </nav>

          <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-2">
            Find {service.name}{service.name.toLowerCase().includes("therapy") ? "" : " Therapy"} Near You
          </h1>
          <p className="text-text-secondary mb-8 max-w-[700px]">
            {service.description}
          </p>

          {providers.length > 0 ? (
            <FilteredProviderList providers={providers} config={{ showPeptideFilter: false }} />
          ) : (
            <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
              <h2 className="font-display text-xl text-text-primary mb-2">
                No {service.name} Providers Listed Yet
              </h2>
              <p className="text-text-secondary mb-4 max-w-[500px] mx-auto">
                We&apos;re building our directory. Know a provider offering {service.name}?
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/submit" className="px-5 py-2.5 bg-accent text-white font-semibold rounded-lg">
                  Submit a Practice
                </Link>
                <a
                  href={`https://peptidegrades.com/peptides/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 border border-border-medium text-text-secondary rounded-lg hover:border-accent hover:text-accent transition-colors"
                >
                  Compare Online Vendors
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
