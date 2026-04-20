"use client";

import { useState, useMemo } from "react";
import type { Provider } from "@/lib/data/schemas";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { CompareButton } from "@/components/compare/CompareButton";

interface FilterConfig {
  showTypeFilter?: boolean;
  showInsuranceFilter?: boolean;
  showPeptideFilter?: boolean;
  showTelehealthFilter?: boolean;
  showVisitTypeFilter?: boolean;
}

export function FilteredProviderList({
  providers,
  config = {},
}: {
  providers: Provider[];
  config?: FilterConfig;
}) {
  const {
    showTypeFilter = true,
    showInsuranceFilter = true,
    showPeptideFilter = true,
    showTelehealthFilter = true,
    showVisitTypeFilter = false,
  } = config;

  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedInsurance, setSelectedInsurance] = useState<Set<string>>(new Set());
  const [selectedPeptides, setSelectedPeptides] = useState<Set<string>>(new Set());
  const [telehealthOnly, setTelehealthOnly] = useState(false);
  const [selectedVisitTypes, setSelectedVisitTypes] = useState<Set<string>>(new Set());

  // Derive available peptides from the provider list
  const availablePeptides = useMemo(() => {
    const set = new Set<string>();
    providers.forEach((p) => p.peptides.forEach((pep) => set.add(pep)));
    return [...set].sort();
  }, [providers]);

  const hasAnyTelehealth = useMemo(
    () => providers.some((p) => p.telehealth?.available),
    [providers]
  );

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      if (selectedTypes.size > 0 && !selectedTypes.has(p.type)) return false;
      if (selectedInsurance.size > 0 && !selectedInsurance.has(p.insurance)) return false;
      if (selectedPeptides.size > 0 && !p.peptides.some((pep) => selectedPeptides.has(pep))) return false;
      if (telehealthOnly && !p.telehealth?.available) return false;
      if (selectedVisitTypes.size > 0 && !p.telehealth?.visitTypes?.some((vt) => selectedVisitTypes.has(vt))) return false;
      return true;
    });
  }, [providers, selectedTypes, selectedInsurance, selectedPeptides, telehealthOnly, selectedVisitTypes]);

  const hasActiveFilters = selectedTypes.size > 0 || selectedInsurance.size > 0 || selectedPeptides.size > 0 || telehealthOnly || selectedVisitTypes.size > 0;

  function toggleSet(set: Set<string>, value: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function clearFilters() {
    setSelectedTypes(new Set());
    setSelectedInsurance(new Set());
    setSelectedPeptides(new Set());
    setTelehealthOnly(false);
    setSelectedVisitTypes(new Set());
  }

  const TYPE_LABELS: Record<string, string> = {
    clinic: "Clinics",
    pharmacy: "Pharmacies",
    "wellness-center": "Wellness",
  };

  const INSURANCE_LABELS: Record<string, string> = {
    accepted: "Accepted",
    "not-accepted": "Not Accepted",
    varies: "Varies",
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {showTypeFilter && (
          <>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => toggleSet(selectedTypes, key, setSelectedTypes)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  selectedTypes.has(key)
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-text-secondary border-border-medium hover:border-accent"
                }`}
              >
                {label}
              </button>
            ))}
          </>
        )}

        {showInsuranceFilter && (
          <>
            {Object.entries(INSURANCE_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => toggleSet(selectedInsurance, key, setSelectedInsurance)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  selectedInsurance.has(key)
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-text-secondary border-border-medium hover:border-accent"
                }`}
              >
                Ins: {label}
              </button>
            ))}
          </>
        )}

        {showTelehealthFilter && hasAnyTelehealth && (
          <button
            onClick={() => setTelehealthOnly(!telehealthOnly)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              telehealthOnly
                ? "bg-accent text-white border-accent"
                : "bg-white text-text-secondary border-border-medium hover:border-accent"
            }`}
          >
            Telehealth
          </button>
        )}

        {showVisitTypeFilter && (
          <>
            {(["video", "phone", "async"] as const).map((vt) => {
              const labels: Record<string, string> = { video: "Video", phone: "Phone", async: "Async" };
              return (
                <button
                  key={vt}
                  onClick={() => toggleSet(selectedVisitTypes, vt, setSelectedVisitTypes)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    selectedVisitTypes.has(vt)
                      ? "bg-accent text-white border-accent"
                      : "bg-white text-text-secondary border-border-medium hover:border-accent"
                  }`}
                >
                  {labels[vt]}
                </button>
              );
            })}
          </>
        )}

        {showPeptideFilter && availablePeptides.length > 0 && (
          <div className="relative group">
            <button
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                selectedPeptides.size > 0
                  ? "bg-accent text-white border-accent"
                  : "bg-white text-text-secondary border-border-medium hover:border-accent"
              }`}
            >
              Peptides {selectedPeptides.size > 0 && `(${selectedPeptides.size})`}
              <svg className="w-3 h-3 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div className="absolute z-40 top-full mt-1 left-0 w-56 max-h-64 overflow-y-auto bg-white border border-border-subtle rounded-xl shadow-lg hidden group-hover:block">
              {availablePeptides.map((pep) => (
                <button
                  key={pep}
                  onClick={() => toggleSet(selectedPeptides, pep, setSelectedPeptides)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-surface-0 flex items-center gap-2"
                >
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                    selectedPeptides.has(pep) ? "bg-accent border-accent text-white" : "border-border-medium"
                  }`}>
                    {selectedPeptides.has(pep) && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </span>
                  {pep}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs px-3 py-1.5 text-accent hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <p className="text-sm text-text-tertiary mb-4">
          Showing {filtered.length} of {providers.length} providers
        </p>
      )}

      {/* Provider list */}
      <div className="flex flex-col gap-4">
        {filtered.map((p) => (
          <div key={p.slug} className="relative">
            <ProviderCard provider={p} />
            <div className="absolute bottom-3 right-3">
              <CompareButton slug={p.slug} />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
          <p className="text-text-secondary mb-2">No providers match your filters.</p>
          <button onClick={clearFilters} className="text-sm text-accent hover:underline">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
