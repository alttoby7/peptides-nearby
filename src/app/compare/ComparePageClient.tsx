"use client";

import { useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import providersData from "@/lib/data/providers.json";
import reviewsData from "@/lib/data/reviews.json";
import { ProviderSchema, type Provider, type ProviderReview } from "@/lib/data/schemas";

const allProviders: Provider[] = (providersData as unknown[]).map((p) =>
  ProviderSchema.parse(p)
);
const allReviews: ProviderReview[] = reviewsData as ProviderReview[];

// ─── Labels & Config ───────────────────────────────────────────────

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

const TYPE_BORDER: Record<string, string> = {
  clinic: "border-t-clinic",
  pharmacy: "border-t-pharmacy",
  "wellness-center": "border-t-wellness",
};

const TIER_LABELS: Record<string, { label: string; className: string } | null> = {
  listed: null,
  verified: { label: "Verified", className: "bg-verified-bg text-verified" },
  claimed: { label: "Claimed", className: "bg-accent-dim text-accent" },
  trusted: { label: "Trusted", className: "bg-amber-50 text-amber-700" },
};

const INSURANCE_LABELS: Record<string, string> = {
  accepted: "Accepted",
  "not-accepted": "Not Accepted",
  varies: "Varies",
  unknown: "Not Listed",
};

const INSURANCE_COLORS: Record<string, string> = {
  accepted: "text-verified font-medium",
  "not-accepted": "text-text-tertiary",
  varies: "text-amber-600",
  unknown: "text-text-tertiary",
};

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

// ─── Helpers ────────────────────────────────────────────────────────

function getReviewStats(slug: string) {
  const reviews = allReviews.filter((r) => r.providerSlug === slug);
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { count: reviews.length, avgRating: Math.round(avg * 10) / 10 };
}

function boolDisplay(val: boolean | undefined) {
  if (val === true) return <Check />;
  if (val === false) return <X />;
  return <Dash />;
}

function Check() {
  return <span className="text-verified font-medium">&#10003;</span>;
}
function X() {
  return <span className="text-text-tertiary">&#10007;</span>;
}
function Dash() {
  return <span className="text-text-tertiary">&mdash;</span>;
}

function valuesAllEqual(values: (string | boolean | number | null | undefined)[]) {
  const strs = values.map((v) => String(v ?? ""));
  return strs.every((s) => s === strs[0]);
}

function getTodayKey(): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
}

// ─── Component ──────────────────────────────────────────────────────

export function ComparePageClient() {
  const searchParams = useSearchParams();
  const slugsParam = searchParams.get("providers") ?? "";
  const slugs = slugsParam.split(",").filter(Boolean);

  const [diffsOnly, setDiffsOnly] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedPeptides, setExpandedPeptides] = useState(false);
  const [expandedServices, setExpandedServices] = useState(false);
  const [expandedHours, setExpandedHours] = useState<Record<string, boolean>>({});

  const providers = useMemo(() => {
    return slugs
      .map((slug) => allProviders.find((p) => p.slug === slug))
      .filter((p): p is Provider => p !== undefined);
  }, [slugs]);

  const reviewStats = useMemo(() => {
    const map: Record<string, { count: number; avgRating: number } | null> = {};
    providers.forEach((p) => { map[p.slug] = getReviewStats(p.slug); });
    return map;
  }, [providers]);

  // Collect unions for matrix rows
  const allPeptides = useMemo(() => {
    const all = [...new Set(providers.flatMap((p) => p.peptides))];
    // Sort by how many providers have it (desc), then alpha
    return all.sort((a, b) => {
      const countA = providers.filter((p) => p.peptides.includes(a)).length;
      const countB = providers.filter((p) => p.peptides.includes(b)).length;
      return countB - countA || a.localeCompare(b);
    });
  }, [providers]);

  const allServices = useMemo(() => {
    const all = [...new Set(providers.flatMap((p) => p.services))];
    return all.sort((a, b) => {
      const countA = providers.filter((p) => p.services.includes(a)).length;
      const countB = providers.filter((p) => p.services.includes(b)).length;
      return countB - countA || a.localeCompare(b);
    });
  }, [providers]);

  const allGoals = useMemo(() => {
    return [...new Set(providers.flatMap((p) => p.treatmentGoals))].sort();
  }, [providers]);

  const hasPharmacy = providers.some((p) => p.type === "pharmacy");

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: "Compare Providers — Peptides Nearby", url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const colCount = providers.length;

  // ── Empty state ──
  if (providers.length === 0) {
    return (
      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <h1 className="font-display text-3xl text-text-primary mb-4">Compare Providers</h1>
          <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
            <p className="text-text-secondary mb-4">
              No providers selected for comparison. Browse providers and click &ldquo;+ Compare&rdquo; to add them.
            </p>
            <Link href="/states" className="inline-block px-5 py-2.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent-hover transition-colors">
              Browse Providers
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ── Grid style helper ──
  const gridCols = `180px repeat(${colCount}, minmax(0, 1fr))`;

  return (
    <section className="pt-8 pb-24">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <nav className="text-sm text-text-tertiary mb-4">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-text-secondary">Compare</span>
        </nav>

        {/* Page header + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="font-display text-2xl sm:text-3xl text-text-primary">
            Compare {providers.length} Provider{providers.length !== 1 ? "s" : ""}
          </h1>
          <div className="flex items-center gap-3">
            {/* Differences toggle */}
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
              <span className={`relative inline-block w-9 h-5 rounded-full transition-colors ${diffsOnly ? "bg-accent" : "bg-surface-3"}`}>
                <input
                  type="checkbox"
                  checked={diffsOnly}
                  onChange={(e) => setDiffsOnly(e.target.checked)}
                  className="sr-only peer"
                />
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${diffsOnly ? "translate-x-4" : ""}`} />
              </span>
              Differences only
            </label>
            {/* Share */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-secondary border border-border-medium rounded-lg hover:border-accent hover:text-accent transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
        </div>

        {/* ── Provider Header Cards (sticky on desktop) ── */}
        <div className="sticky top-0 z-30 bg-surface-0 pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
          <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}>
            {providers.map((p) => {
              const tier = p.verificationTier ?? "listed";
              const tierBadge = TIER_LABELS[tier];
              return (
                <div
                  key={p.slug}
                  className={`bg-white border border-border-subtle rounded-xl p-4 shadow-sm border-t-2 ${TYPE_BORDER[p.type]}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <Link href={`/providers/${p.slug}`} className="font-semibold text-text-primary hover:text-accent transition-colors text-sm leading-tight block truncate">
                        {p.name}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[p.type]}`}>
                          {TYPE_LABELS[p.type]}
                        </span>
                        {tierBadge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tierBadge.className}`}>
                            {tierBadge.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-text-tertiary mb-3">{p.address.city}, {p.address.stateCode}</p>
                  <Link
                    href={`/providers/${p.slug}`}
                    className="block text-center text-xs font-semibold px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Sections ── */}
        <div className="mt-4 space-y-4">

          {/* SNAPSHOT */}
          <CompareSection title="Snapshot" defaultOpen>
            <DesktopGrid gridCols={gridCols}>
              <GridRow label="Insurance" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => p.insurance)}
                render={(p) => (
                  <span className={INSURANCE_COLORS[p.insurance]}>{INSURANCE_LABELS[p.insurance]}</span>
                )}
              />
              <GridRow label="Telehealth" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => String(p.telehealth?.available ?? false))}
                render={(p) => {
                  const th = p.telehealth;
                  if (!th?.available) return <span className="text-text-tertiary">No</span>;
                  return (
                    <span className="text-accent font-medium">
                      Yes
                      {th.visitTypes.length > 0 && (
                        <span className="text-text-tertiary font-normal text-xs ml-1">
                          ({th.visitTypes.join(", ")})
                        </span>
                      )}
                    </span>
                  );
                }}
              />
              <GridRow label="Consult Fee" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => p.pricing?.consultFee ?? "")}
                render={(p) => (
                  <span className="font-mono text-sm">{p.pricing?.consultFee || <Dash />}</span>
                )}
              />
              <GridRow label="HSA / FSA" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => `${p.pricing?.acceptsHSA ?? ""},${p.pricing?.acceptsFSA ?? ""}`)}
                render={(p) => {
                  const parts = [p.pricing?.acceptsHSA && "HSA", p.pricing?.acceptsFSA && "FSA"].filter(Boolean);
                  return parts.length > 0 ? <span className="text-verified font-medium">{parts.join(" / ")}</span> : <Dash />;
                }}
              />
              <GridRow label="Peptides" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => String(p.peptides.length))}
                render={(p) => <span className="font-mono text-sm">{p.peptides.length}</span>}
              />
              <GridRow label="Services" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => String(p.services.length))}
                render={(p) => <span className="font-mono text-sm">{p.services.length}</span>}
              />
            </DesktopGrid>

            <MobileCards providers={providers}>
              {(p) => (
                <div className="space-y-2 text-sm">
                  <MobileField label="Insurance"><span className={INSURANCE_COLORS[p.insurance]}>{INSURANCE_LABELS[p.insurance]}</span></MobileField>
                  <MobileField label="Telehealth">{p.telehealth?.available ? <span className="text-accent font-medium">Yes</span> : "No"}</MobileField>
                  <MobileField label="Consult Fee"><span className="font-mono">{p.pricing?.consultFee || "—"}</span></MobileField>
                  <MobileField label="HSA / FSA">{[p.pricing?.acceptsHSA && "HSA", p.pricing?.acceptsFSA && "FSA"].filter(Boolean).join(" / ") || "—"}</MobileField>
                  <MobileField label="Peptides"><span className="font-mono">{p.peptides.length}</span></MobileField>
                  <MobileField label="Services"><span className="font-mono">{p.services.length}</span></MobileField>
                </div>
              )}
            </MobileCards>
          </CompareSection>

          {/* SERVICES & PEPTIDES */}
          <CompareSection title="Services & Peptides" defaultOpen>
            {/* Treatment goals */}
            {allGoals.length > 0 && (
              <>
                <DesktopGrid gridCols={gridCols}>
                  <GridRow label="Treatment Goals" providers={providers} diffsOnly={false}
                    values={providers.map(() => "")}
                    render={(p) => (
                      <div className="flex flex-wrap gap-1">
                        {p.treatmentGoals.map((g) => (
                          <span key={g} className="text-[10px] px-2 py-0.5 bg-accent-dim text-accent rounded-full">
                            {g.replace(/-/g, " ")}
                          </span>
                        ))}
                        {p.treatmentGoals.length === 0 && <Dash />}
                      </div>
                    )}
                  />
                </DesktopGrid>
                <MobileCards providers={providers}>
                  {(p) => (
                    <MobileField label="Goals">
                      <div className="flex flex-wrap gap-1">
                        {p.treatmentGoals.map((g) => (
                          <span key={g} className="text-[10px] px-2 py-0.5 bg-accent-dim text-accent rounded-full">{g.replace(/-/g, " ")}</span>
                        ))}
                        {p.treatmentGoals.length === 0 && <span className="text-text-tertiary">—</span>}
                      </div>
                    </MobileField>
                  )}
                </MobileCards>
              </>
            )}

            {/* Peptide matrix */}
            {allPeptides.length > 0 && (
              <div className="mt-3">
                <div className="hidden md:block">
                  <div className="text-xs text-text-tertiary font-medium uppercase tracking-wider px-3 mb-2">
                    Peptides ({allPeptides.length})
                  </div>
                  {(expandedPeptides ? allPeptides : allPeptides.slice(0, 8)).map((pep) => {
                    const vals = providers.map((p) => String(p.peptides.includes(pep)));
                    if (diffsOnly && valuesAllEqual(vals)) return null;
                    const isDiff = !valuesAllEqual(vals);
                    return (
                      <div key={pep} className={`grid items-center text-sm hover:bg-surface-0 ${isDiff ? "bg-accent-glow" : ""}`}
                        style={{ gridTemplateColumns: gridCols }}>
                        <div className="p-2 px-3 text-xs text-text-secondary font-medium">{pep}</div>
                        {providers.map((p) => (
                          <div key={p.slug} className={`p-2 px-3 ${isDiff ? "border-l-2 border-accent-dim" : ""}`}>
                            {p.peptides.includes(pep) ? <Check /> : <X />}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {allPeptides.length > 8 && (
                    <button onClick={() => setExpandedPeptides(!expandedPeptides)}
                      className="text-xs text-accent hover:text-accent-hover font-medium px-3 py-2 transition-colors">
                      {expandedPeptides ? "Show less" : `Show all ${allPeptides.length} peptides`}
                    </button>
                  )}
                </div>
                <MobileCards providers={providers}>
                  {(p) => (
                    <MobileField label={`Peptides (${p.peptides.length})`}>
                      <div className="flex flex-wrap gap-1">
                        {p.peptides.slice(0, 6).map((pep) => (
                          <span key={pep} className="text-[10px] px-2 py-0.5 bg-surface-3 text-text-secondary rounded">{pep}</span>
                        ))}
                        {p.peptides.length > 6 && <span className="text-[10px] px-2 py-0.5 bg-surface-3 text-text-tertiary rounded">+{p.peptides.length - 6}</span>}
                      </div>
                    </MobileField>
                  )}
                </MobileCards>
              </div>
            )}

            {/* Services matrix */}
            {allServices.length > 0 && (
              <div className="mt-3">
                <div className="hidden md:block">
                  <div className="text-xs text-text-tertiary font-medium uppercase tracking-wider px-3 mb-2">
                    Services ({allServices.length})
                  </div>
                  {(expandedServices ? allServices : allServices.slice(0, 6)).map((svc) => {
                    const vals = providers.map((p) => String(p.services.includes(svc)));
                    if (diffsOnly && valuesAllEqual(vals)) return null;
                    const isDiff = !valuesAllEqual(vals);
                    return (
                      <div key={svc} className={`grid items-center text-sm hover:bg-surface-0 ${isDiff ? "bg-accent-glow" : ""}`}
                        style={{ gridTemplateColumns: gridCols }}>
                        <div className="p-2 px-3 text-xs text-text-secondary font-medium">{svc}</div>
                        {providers.map((p) => (
                          <div key={p.slug} className={`p-2 px-3 ${isDiff ? "border-l-2 border-accent-dim" : ""}`}>
                            {p.services.includes(svc) ? <Check /> : <X />}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {allServices.length > 6 && (
                    <button onClick={() => setExpandedServices(!expandedServices)}
                      className="text-xs text-accent hover:text-accent-hover font-medium px-3 py-2 transition-colors">
                      {expandedServices ? "Show less" : `Show all ${allServices.length} services`}
                    </button>
                  )}
                </div>
                <MobileCards providers={providers}>
                  {(p) => (
                    <MobileField label={`Services (${p.services.length})`}>
                      <div className="flex flex-wrap gap-1">
                        {p.services.slice(0, 4).map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 bg-surface-3 text-text-secondary rounded">{s}</span>
                        ))}
                        {p.services.length > 4 && <span className="text-[10px] px-2 py-0.5 bg-surface-3 text-text-tertiary rounded">+{p.services.length - 4}</span>}
                      </div>
                    </MobileField>
                  )}
                </MobileCards>
              </div>
            )}
          </CompareSection>

          {/* PRICING & PAYMENT */}
          <CompareSection title="Pricing & Payment">
            <DesktopGrid gridCols={gridCols}>
              <GridRow label="Consult Fee" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => p.pricing?.consultFee ?? "")}
                render={(p) => <span className="font-mono text-sm">{p.pricing?.consultFee || <Dash />}</span>}
              />
              <GridRow label="HSA" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => String(p.pricing?.acceptsHSA ?? ""))}
                render={(p) => boolDisplay(p.pricing?.acceptsHSA)}
              />
              <GridRow label="FSA" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => String(p.pricing?.acceptsFSA ?? ""))}
                render={(p) => boolDisplay(p.pricing?.acceptsFSA)}
              />
              <GridRow label="Membership" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => String(p.pricing?.membershipAvailable ?? ""))}
                render={(p) => boolDisplay(p.pricing?.membershipAvailable)}
              />
              <GridRow label="Financing" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => String(p.pricing?.financingAvailable ?? ""))}
                render={(p) => boolDisplay(p.pricing?.financingAvailable)}
              />
            </DesktopGrid>
            <MobileCards providers={providers}>
              {(p) => (
                <div className="space-y-2 text-sm">
                  <MobileField label="Consult Fee"><span className="font-mono">{p.pricing?.consultFee || "—"}</span></MobileField>
                  <MobileField label="HSA">{p.pricing?.acceptsHSA ? "Yes" : p.pricing?.acceptsHSA === false ? "No" : "—"}</MobileField>
                  <MobileField label="FSA">{p.pricing?.acceptsFSA ? "Yes" : p.pricing?.acceptsFSA === false ? "No" : "—"}</MobileField>
                  <MobileField label="Membership">{p.pricing?.membershipAvailable ? "Yes" : "—"}</MobileField>
                  <MobileField label="Financing">{p.pricing?.financingAvailable ? "Yes" : "—"}</MobileField>
                </div>
              )}
            </MobileCards>
          </CompareSection>

          {/* CONSULTATION */}
          <CompareSection title="Consultation">
            <DesktopGrid gridCols={gridCols}>
              <GridRow label="Requires Labs" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => String(p.consultation?.requiresLabs ?? ""))}
                render={(p) => boolDisplay(p.consultation?.requiresLabs)}
              />
              <GridRow label="Labs Included" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => String(p.consultation?.initialLabsIncluded ?? ""))}
                render={(p) => boolDisplay(p.consultation?.initialLabsIncluded)}
              />
              <GridRow label="Follow-up" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => p.consultation?.followUpCadence ?? "")}
                render={(p) => <span className="text-sm">{p.consultation?.followUpCadence || <Dash />}</span>}
              />
              <GridRow label="Refill Policy" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => p.consultation?.refillPolicy ?? "")}
                render={(p) => <span className="text-sm">{p.consultation?.refillPolicy || <Dash />}</span>}
              />
            </DesktopGrid>
            <MobileCards providers={providers}>
              {(p) => (
                <div className="space-y-2 text-sm">
                  <MobileField label="Requires Labs">{p.consultation?.requiresLabs ? "Yes" : p.consultation?.requiresLabs === false ? "No" : "—"}</MobileField>
                  <MobileField label="Labs Included">{p.consultation?.initialLabsIncluded ? "Yes" : p.consultation?.initialLabsIncluded === false ? "No" : "—"}</MobileField>
                  <MobileField label="Follow-up">{p.consultation?.followUpCadence || "—"}</MobileField>
                  <MobileField label="Refill Policy">{p.consultation?.refillPolicy || "—"}</MobileField>
                </div>
              )}
            </MobileCards>
          </CompareSection>

          {/* ACCESS & LOGISTICS */}
          <CompareSection title="Access & Logistics">
            <DesktopGrid gridCols={gridCols}>
              <GridRow label="Telehealth States" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => String(p.telehealth?.statesServed?.length ?? 0))}
                render={(p) => {
                  const states = p.telehealth?.statesServed ?? [];
                  if (states.length === 0) return <Dash />;
                  return <span className="text-sm">{states.length} state{states.length !== 1 ? "s" : ""}</span>;
                }}
              />
              <GridRow label="Today&rsquo;s Hours" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => {
                  const today = getTodayKey();
                  const h = p.hours?.[today];
                  return h ? `${h.open}-${h.close}` : "";
                })}
                render={(p) => {
                  const today = getTodayKey();
                  const h = p.hours?.[today];
                  if (!h) return <Dash />;
                  return (
                    <div>
                      <span className="font-mono text-sm">{h.open} – {h.close}</span>
                      <button
                        onClick={() => setExpandedHours((prev) => ({ ...prev, [p.slug]: !prev[p.slug] }))}
                        className="text-[10px] text-accent ml-2 hover:underline"
                      >
                        {expandedHours[p.slug] ? "hide" : "all hours"}
                      </button>
                      {expandedHours[p.slug] && p.hours && (
                        <div className="mt-1 space-y-0.5">
                          {DAY_ORDER.map((day) => {
                            const dh = p.hours?.[day];
                            return (
                              <div key={day} className="text-xs text-text-tertiary">
                                <span className="inline-block w-8">{DAY_LABELS[day]}</span>
                                {dh ? <span className="font-mono">{dh.open}–{dh.close}</span> : "Closed"}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <GridRow label="Phone" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => p.phone ?? "")}
                render={(p) => <span className="text-sm">{p.phone || <Dash />}</span>}
              />
              <GridRow label="Website" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => p.website ?? "")}
                render={(p) => p.website ? (
                  <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline truncate block max-w-[180px]">
                    Visit
                  </a>
                ) : <Dash />}
              />
            </DesktopGrid>
            <MobileCards providers={providers}>
              {(p) => (
                <div className="space-y-2 text-sm">
                  <MobileField label="Telehealth States">{p.telehealth?.statesServed?.length ?? "—"}</MobileField>
                  <MobileField label="Phone">{p.phone || "—"}</MobileField>
                  <MobileField label="Website">{p.website ? <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Visit</a> : "—"}</MobileField>
                </div>
              )}
            </MobileCards>
          </CompareSection>

          {/* PHARMACY DETAILS (conditional) */}
          {hasPharmacy && (
            <CompareSection title="Pharmacy Details">
              <DesktopGrid gridCols={gridCols}>
                <GridRow label="Compounding" providers={providers} diffsOnly={diffsOnly}
                  values={providers.map((p) => p.pharmacyDetails?.compoundingType ?? "")}
                  render={(p) => <span className="text-sm font-medium">{p.pharmacyDetails?.compoundingType ?? <Dash />}</span>}
                />
                <GridRow label="PCAB Accredited" providers={providers} diffsOnly={diffsOnly}
                  values={providers.map((p) => String(p.pharmacyDetails?.pcabAccredited ?? ""))}
                  render={(p) => boolDisplay(p.pharmacyDetails?.pcabAccredited)}
                />
                <GridRow label="Ships To" providers={providers} diffsOnly={diffsOnly}
                  values={providers.map((p) => String(p.pharmacyDetails?.shipsToStates?.length ?? 0))}
                  render={(p) => {
                    const states = p.pharmacyDetails?.shipsToStates ?? [];
                    if (states.length === 0) return <Dash />;
                    return <span className="text-sm">{states.length} state{states.length !== 1 ? "s" : ""}</span>;
                  }}
                />
              </DesktopGrid>
              <MobileCards providers={providers}>
                {(p) => (
                  <div className="space-y-2 text-sm">
                    <MobileField label="Compounding">{p.pharmacyDetails?.compoundingType ?? "—"}</MobileField>
                    <MobileField label="PCAB">{p.pharmacyDetails?.pcabAccredited ? "Yes" : "—"}</MobileField>
                    <MobileField label="Ships To">{p.pharmacyDetails?.shipsToStates?.length ?? "—"} states</MobileField>
                  </div>
                )}
              </MobileCards>
            </CompareSection>
          )}

          {/* TRUST */}
          <CompareSection title="Trust">
            <DesktopGrid gridCols={gridCols}>
              <GridRow label="Verification" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => p.verificationTier ?? "listed")}
                render={(p) => {
                  const tier = p.verificationTier ?? "listed";
                  const badge = TIER_LABELS[tier];
                  return badge ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>{badge.label}</span>
                  ) : (
                    <span className="text-text-tertiary text-sm">Listed</span>
                  );
                }}
              />
              <GridRow label="Reviews" providers={providers} diffsOnly={diffsOnly}
                values={providers.map((p) => String(reviewStats[p.slug]?.count ?? 0))}
                render={(p) => {
                  const stats = reviewStats[p.slug];
                  if (!stats) return <span className="text-text-tertiary text-sm">No reviews</span>;
                  return (
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500 text-sm">{"★".repeat(Math.round(stats.avgRating))}</span>
                      <span className="font-mono text-sm">{stats.avgRating}</span>
                      <span className="text-text-tertiary text-xs">({stats.count})</span>
                    </div>
                  );
                }}
              />
            </DesktopGrid>
            <MobileCards providers={providers}>
              {(p) => {
                const stats = reviewStats[p.slug];
                return (
                  <div className="space-y-2 text-sm">
                    <MobileField label="Verification">{(p.verificationTier ?? "listed").charAt(0).toUpperCase() + (p.verificationTier ?? "listed").slice(1)}</MobileField>
                    <MobileField label="Reviews">{stats ? `${stats.avgRating} (${stats.count} reviews)` : "No reviews"}</MobileField>
                  </div>
                );
              }}
            </MobileCards>
          </CompareSection>

        </div>
      </div>
    </section>
  );
}

// ─── Reusable Section Components ────────────────────────────────────

function CompareSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group bg-white border border-border-subtle rounded-xl shadow-sm overflow-hidden" open={defaultOpen || undefined}>
      <summary className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-surface-0 transition-colors list-none">
        <h2 className="font-display text-lg text-text-primary">{title}</h2>
        <svg className="w-5 h-5 text-text-tertiary transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="border-t border-border-subtle">
        {children}
      </div>
    </details>
  );
}

function DesktopGrid({ gridCols, children }: { gridCols: string; children: React.ReactNode }) {
  return (
    <div className="hidden md:block" data-grid-cols={gridCols}>
      {children}
    </div>
  );
}

function GridRow({
  label,
  providers,
  diffsOnly,
  values,
  render,
}: {
  label: string;
  providers: Provider[];
  diffsOnly: boolean;
  values: string[];
  render: (p: Provider) => React.ReactNode;
}) {
  if (diffsOnly && valuesAllEqual(values)) return null;
  const isDiff = !valuesAllEqual(values);

  // Get gridCols from parent — read from closest DesktopGrid
  // We pass it via CSS custom property instead
  return (
    <div className={`grid items-center text-sm border-b border-border-subtle last:border-b-0 hover:bg-surface-0 transition-colors ${isDiff ? "bg-accent-glow" : ""}`}
      style={{ gridTemplateColumns: `180px repeat(${providers.length}, minmax(0, 1fr))` }}>
      <div className="p-3 text-xs text-text-tertiary font-medium">{label}</div>
      {providers.map((p) => (
        <div key={p.slug} className={`p-3 ${isDiff ? "border-l-2 border-accent-dim" : ""}`}>
          {render(p)}
        </div>
      ))}
    </div>
  );
}

function MobileCards({ providers, children }: { providers: Provider[]; children: (p: Provider) => React.ReactNode }) {
  return (
    <div className="md:hidden divide-y divide-border-subtle">
      {providers.map((p) => (
        <div key={p.slug} className="p-4">
          <div className="text-xs font-semibold text-text-primary mb-2">{p.name}</div>
          {children(p)}
        </div>
      ))}
    </div>
  );
}

function MobileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-text-tertiary shrink-0">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
