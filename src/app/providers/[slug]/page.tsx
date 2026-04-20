import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviderBySlug, getProviderSlugs, getProvidersByCity } from "@/lib/data/providers";
import { getStateBySlug } from "@/lib/data/states";
import { getReviewsByProvider } from "@/lib/data/reviews";
import { JsonLd, breadcrumbJsonLd, medicalBusinessJsonLd } from "@/components/seo/JsonLd";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewForm } from "@/components/reviews/ReviewForm";

type Props = { params: Promise<{ slug: string }> };

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function generateStaticParams() {
  return getProviderSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const provider = getProviderBySlug(slug);
  if (!provider) return { title: "Provider Not Found" };
  return {
    title: `${provider.name} — Peptide Therapy in ${provider.address.city}, ${provider.address.stateCode}`,
    description: provider.description,
  };
}

const TYPE_LABELS: Record<string, string> = {
  clinic: "Clinic",
  pharmacy: "Compounding Pharmacy",
  "wellness-center": "Wellness Center",
};

const TYPE_COLORS: Record<string, string> = {
  clinic: "bg-clinic-bg text-clinic",
  pharmacy: "bg-pharmacy-bg text-pharmacy",
  "wellness-center": "bg-wellness-bg text-wellness",
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function ProviderPage({ params }: Props) {
  const { slug } = await params;
  const provider = getProviderBySlug(slug);
  if (!provider) notFound();

  const stateSlug = slugify(provider.address.state);
  const citySlug = slugify(provider.address.city);
  const state = getStateBySlug(stateSlug);
  const reviews = getReviewsByProvider(slug);
  const BASE = "https://peptidesnearby.com";

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: BASE },
          { name: state?.name || provider.address.state, url: `${BASE}/${stateSlug}` },
          { name: provider.address.city, url: `${BASE}/${stateSlug}/${citySlug}` },
          { name: provider.name, url: `${BASE}/providers/${slug}` },
        ])}
      />
      <JsonLd data={medicalBusinessJsonLd(provider)} />

      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="text-sm text-text-tertiary mb-6">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <Link href={`/${stateSlug}`} className="hover:text-accent">{state?.name || provider.address.state}</Link>
            <span className="mx-2">/</span>
            <Link href={`/${stateSlug}/${citySlug}`} className="hover:text-accent">{provider.address.city}</Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary">{provider.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            {/* Main content */}
            <div>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h1 className="font-display text-3xl text-text-primary">
                  {provider.name}
                </h1>
                {(() => {
                  const tier = provider.verificationTier ?? (provider.verified ? "verified" : "listed");
                  if (tier === "listed") return null;
                  const badges: Record<string, { label: string; className: string }> = {
                    verified: { label: "Verified", className: "bg-verified-bg text-verified" },
                    claimed: { label: "Claimed", className: "bg-accent-dim text-accent" },
                    trusted: { label: "Trusted", className: "bg-amber-50 text-amber-700" },
                  };
                  const b = badges[tier];
                  return b ? <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${b.className}`}>{b.label}</span> : null;
                })()}
              </div>

              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_COLORS[provider.type]}`}>
                  {TYPE_LABELS[provider.type]}
                </span>
                <span className="text-sm text-text-tertiary">
                  {provider.address.city}, {provider.address.stateCode}
                </span>
                {provider.telehealth?.available && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-accent-dim text-accent">
                    Telehealth Available
                  </span>
                )}
              </div>

              <p className="text-text-secondary mb-8 leading-relaxed">
                {provider.description}
              </p>

              {/* Peptides offered */}
              {provider.peptides.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-semibold text-text-primary mb-3">Peptides Offered</h2>
                  <div className="flex flex-wrap gap-2">
                    {provider.peptides.map((p) => (
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

              {/* Services */}
              {provider.services.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-semibold text-text-primary mb-3">Services</h2>
                  <div className="flex flex-wrap gap-2">
                    {provider.services.map((s) => (
                      <span key={s} className="text-sm px-3 py-1.5 bg-surface-3 text-text-secondary rounded-lg">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Telehealth */}
              {provider.telehealth?.available && (
                <div className="mb-8">
                  <h2 className="font-semibold text-text-primary mb-3">Telehealth</h2>
                  <div className="bg-white border border-border-subtle rounded-xl shadow-sm p-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                      {provider.telehealth.visitTypes.length > 0 && (
                        <div>
                          <span className="text-text-tertiary">Visit types: </span>
                          <span className="text-text-primary">{provider.telehealth.visitTypes.join(", ")}</span>
                        </div>
                      )}
                      {provider.telehealth.statesServed.length > 0 && (
                        <div>
                          <span className="text-text-tertiary">Serves: </span>
                          <span className="text-text-primary">
                            {provider.telehealth.statesServed.length > 10
                              ? `${provider.telehealth.statesServed.length} states`
                              : provider.telehealth.statesServed.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing */}
              {provider.pricing && (
                <div className="mb-8">
                  <h2 className="font-semibold text-text-primary mb-3">Pricing</h2>
                  <div className="bg-white border border-border-subtle rounded-xl shadow-sm p-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                      {provider.pricing.consultFee && (
                        <div>
                          <span className="text-text-tertiary">Initial consult: </span>
                          <span className="text-text-primary font-medium">{provider.pricing.consultFee}</span>
                        </div>
                      )}
                      {provider.pricing.acceptsHSA && (
                        <span className="text-xs px-2 py-1 bg-verified-bg text-verified rounded-full">HSA Accepted</span>
                      )}
                      {provider.pricing.acceptsFSA && (
                        <span className="text-xs px-2 py-1 bg-verified-bg text-verified rounded-full">FSA Accepted</span>
                      )}
                      {provider.pricing.membershipAvailable && (
                        <span className="text-xs px-2 py-1 bg-accent-dim text-accent rounded-full">Membership Available</span>
                      )}
                      {provider.pricing.financingAvailable && (
                        <span className="text-xs px-2 py-1 bg-accent-dim text-accent rounded-full">Financing Available</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Consultation */}
              {provider.consultation && (
                <div className="mb-8">
                  <h2 className="font-semibold text-text-primary mb-3">Consultation Details</h2>
                  <div className="bg-white border border-border-subtle rounded-xl shadow-sm p-4">
                    <div className="flex flex-col gap-2 text-sm">
                      {provider.consultation.requiresLabs !== undefined && (
                        <div>
                          <span className="text-text-tertiary">Lab work required: </span>
                          <span className="text-text-primary">{provider.consultation.requiresLabs ? "Yes" : "No"}</span>
                          {provider.consultation.initialLabsIncluded && (
                            <span className="text-verified ml-1">(included in consult)</span>
                          )}
                        </div>
                      )}
                      {provider.consultation.followUpCadence && (
                        <div>
                          <span className="text-text-tertiary">Follow-up: </span>
                          <span className="text-text-primary">{provider.consultation.followUpCadence}</span>
                        </div>
                      )}
                      {provider.consultation.refillPolicy && (
                        <div>
                          <span className="text-text-tertiary">Refills: </span>
                          <span className="text-text-primary">{provider.consultation.refillPolicy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Pharmacy Details */}
              {provider.pharmacyDetails && provider.type === "pharmacy" && (
                <div className="mb-8">
                  <h2 className="font-semibold text-text-primary mb-3">Pharmacy Details</h2>
                  <div className="bg-white border border-border-subtle rounded-xl shadow-sm p-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                      {provider.pharmacyDetails.compoundingType && (
                        <div>
                          <span className="text-text-tertiary">Type: </span>
                          <span className="text-text-primary font-medium">{provider.pharmacyDetails.compoundingType}</span>
                        </div>
                      )}
                      {provider.pharmacyDetails.pcabAccredited && (
                        <span className="text-xs px-2 py-1 bg-verified-bg text-verified rounded-full">PCAB Accredited</span>
                      )}
                      {provider.pharmacyDetails.shipsToStates && provider.pharmacyDetails.shipsToStates.length > 0 && (
                        <div>
                          <span className="text-text-tertiary">Ships to: </span>
                          <span className="text-text-primary">
                            {provider.pharmacyDetails.shipsToStates.length > 10
                              ? `${provider.pharmacyDetails.shipsToStates.length} states`
                              : provider.pharmacyDetails.shipsToStates.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Hours */}
              {provider.hours && Object.keys(provider.hours).length > 0 && (
                <div className="mb-8">
                  <h2 className="font-semibold text-text-primary mb-3">Hours</h2>
                  <div className="bg-white border border-border-subtle rounded-xl shadow-sm overflow-hidden">
                    {DAY_ORDER.filter((d) => provider.hours?.[d]).map((day) => (
                      <div key={day} className="flex justify-between px-4 py-2.5 border-b border-border-subtle last:border-b-0">
                        <span className="text-sm text-text-secondary">{day}</span>
                        <span className="text-sm text-text-primary font-medium">
                          {provider.hours![day].open} – {provider.hours![day].close}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map embed */}
              <div className="mb-8">
                <h2 className="font-semibold text-text-primary mb-3">Location</h2>
                <div className="rounded-xl overflow-hidden border border-border-subtle">
                  <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      `${provider.address.street}, ${provider.address.city}, ${provider.address.stateCode} ${provider.address.zip}`
                    )}&output=embed`}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <div className="bg-white border border-border-subtle rounded-xl shadow-sm p-6">
                <h2 className="font-semibold text-text-primary mb-4">Contact</h2>

                <div className="flex flex-col gap-3 mb-6">
                  <div>
                    <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Address</div>
                    <div className="text-sm text-text-secondary">
                      {provider.address.street}<br />
                      {provider.address.city}, {provider.address.stateCode} {provider.address.zip}
                    </div>
                  </div>

                  {provider.phone && (
                    <div>
                      <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Phone</div>
                      <a href={`tel:${provider.phone}`} className="text-sm text-accent hover:underline">
                        {provider.phone}
                      </a>
                    </div>
                  )}

                  {provider.email && (
                    <div>
                      <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Email</div>
                      <a href={`mailto:${provider.email}`} className="text-sm text-accent hover:underline">
                        {provider.email}
                      </a>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Insurance</div>
                    <div className="text-sm text-text-secondary capitalize">
                      {provider.insurance.replace(/-/g, " ")}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {provider.bookingUrl && (
                    <a
                      href={provider.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center px-4 py-2.5 bg-accent text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Book Now
                    </a>
                  )}
                  {provider.website && (
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center px-4 py-2.5 border border-border-medium text-text-secondary rounded-lg hover:border-accent hover:text-accent transition-colors"
                    >
                      Visit Website
                    </a>
                  )}
                </div>
              </div>

              {/* Claim CTA */}
              {(() => {
                const t = provider.verificationTier ?? "listed";
                if (t === "claimed" || t === "trusted") return null;
                return (
                  <div className="mt-4 p-4 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
                    <p className="text-xs text-text-tertiary mb-2">Is this your practice?</p>
                    <Link
                      href={`/providers/${slug}/claim`}
                      className="text-sm text-accent hover:underline font-medium"
                    >
                      Claim this listing &rarr;
                    </Link>
                  </div>
                );
              })()}

              {/* Cross-link */}
              <div className="mt-4 p-4 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
                <p className="text-xs text-text-tertiary mb-2">Prefer to order online?</p>
                <a
                  href="https://peptidegrades.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  See online vendor rankings &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-12">
            <h2 className="font-display text-2xl text-text-primary mb-4">
              Patient Reviews
            </h2>
            {reviews.length > 0 ? (
              <ReviewList reviews={reviews} />
            ) : (
              <p className="text-sm text-text-tertiary mb-4">
                No reviews yet. Be the first to share your experience.
              </p>
            )}
            <div className="mt-6 bg-white border border-border-subtle rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-text-primary mb-4">Write a Review</h3>
              <ReviewForm providerSlug={slug} />
            </div>
          </div>

          {/* Similar Providers */}
          {(() => {
            const similar = getProvidersByCity(citySlug, provider.address.stateCode)
              .filter((p) => p.slug !== provider.slug)
              .slice(0, 4);
            if (similar.length === 0) return null;
            return (
              <div className="mt-12">
                <h2 className="font-display text-2xl text-text-primary mb-4">
                  Similar Providers in {provider.address.city}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {similar.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/providers/${p.slug}`}
                      className="card-lift p-4 bg-white border border-border-subtle rounded-xl shadow-sm hover:border-accent/30"
                    >
                      <div className="font-semibold text-text-primary text-sm group-hover:text-accent">{p.name}</div>
                      <div className="text-xs text-text-tertiary mt-1">
                        <span className={`px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[p.type]}`}>
                          {TYPE_LABELS[p.type]}
                        </span>
                        <span className="ml-2">{p.peptides.length} peptides</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </section>
    </>
  );
}
