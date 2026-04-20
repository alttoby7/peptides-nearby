import Link from "next/link";
import type { Provider } from "@/lib/data/schemas";

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const TYPE_LABELS: Record<string, string> = {
  clinic: "Clinic",
  pharmacy: "Pharmacy",
  "wellness-center": "Wellness",
};

const TYPE_COLORS: Record<string, string> = {
  clinic: "bg-clinic-bg text-clinic",
  pharmacy: "bg-pharmacy-bg text-pharmacy",
  "wellness-center": "bg-wellness-bg text-wellness",
};

const TIER_BADGES: Record<string, { label: string; className: string } | null> = {
  listed: null,
  verified: { label: "Verified", className: "bg-verified-bg text-verified" },
  claimed: { label: "Claimed", className: "bg-accent-dim text-accent" },
  trusted: { label: "Trusted", className: "bg-amber-50 text-amber-700" },
};

const INSURANCE_LABELS: Record<string, { label: string; className: string }> = {
  accepted: { label: "Insurance Accepted", className: "text-verified" },
  "not-accepted": { label: "No Insurance", className: "text-text-tertiary" },
  varies: { label: "Insurance Varies", className: "text-amber-600" },
  unknown: { label: "", className: "" },
};

export function ProviderCard({ provider }: { provider: Provider }) {
  const tier = provider.verificationTier ?? (provider.verified ? "verified" : "listed");
  const tierBadge = TIER_BADGES[tier];
  const insuranceLabel = INSURANCE_LABELS[provider.insurance];
  const telehealthAvailable = provider.telehealth?.available ?? false;

  return (
    <Link
      href={`/providers/${provider.slug}`}
      className="block card-lift group p-5 bg-white border border-border-subtle rounded-xl shadow-sm hover:border-accent/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="font-semibold text-text-primary text-lg group-hover:text-accent transition-colors">
              {provider.name}
            </h2>
            {tierBadge && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierBadge.className}`}>
                {tierBadge.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[provider.type]}`}>
              {TYPE_LABELS[provider.type]}
            </span>
            <span className="text-xs text-text-tertiary">
              {provider.address.city}, {provider.address.stateCode}
            </span>

            {/* Insurance indicator */}
            {insuranceLabel.label && (
              <span className={`text-xs font-medium ${insuranceLabel.className}`}>
                {insuranceLabel.label}
              </span>
            )}

            {/* Telehealth indicator */}
            {telehealthAvailable && (
              <span className="text-xs text-accent font-medium" title="Telehealth available">
                <svg className="w-3 h-3 inline mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                Telehealth
              </span>
            )}

            {/* Peptide count */}
            {provider.peptides.length > 0 && (
              <span className="text-xs text-text-tertiary">
                {provider.peptides.length} peptide{provider.peptides.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <p className="text-sm text-text-secondary line-clamp-2">
            {provider.description}
          </p>

          {provider.peptides.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {provider.peptides.slice(0, 5).map((p) => (
                <span key={p} className="text-xs px-2 py-0.5 bg-surface-3 text-text-secondary rounded">
                  {p}
                </span>
              ))}
              {provider.peptides.length > 5 && (
                <span className="text-xs px-2 py-0.5 bg-surface-3 text-text-tertiary rounded">
                  +{provider.peptides.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="text-right shrink-0 hidden sm:block">
          {provider.phone && (
            <div className="text-sm text-text-secondary">{provider.phone}</div>
          )}
          <div className="text-xs text-text-tertiary mt-1">
            {provider.address.street}
          </div>
        </div>
      </div>
    </Link>
  );
}
