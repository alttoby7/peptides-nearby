"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import type { SearchIndexEntry } from "@/lib/data/schemas";

function matchesQuery(entry: SearchIndexEntry, query: string): boolean {
  const q = query.toLowerCase();
  if (entry.name.toLowerCase().includes(q)) return true;
  if (entry.city.toLowerCase().includes(q)) return true;
  if (entry.stateCode.toLowerCase() === q) return true;
  if (entry.peptides.some((p) => p.toLowerCase().includes(q))) return true;
  if (entry.services.some((s) => s.toLowerCase().includes(q))) return true;
  if (entry.treatmentGoals.some((g) => g.toLowerCase().includes(q))) return true;
  return false;
}

export function ProviderSearch({
  entries,
  variant = "hero",
}: {
  entries: SearchIndexEntry[];
  variant?: "hero" | "nav" | "page";
}) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    return entries.filter((e) => matchesQuery(e, query)).slice(0, 8);
  }, [query, entries]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown = isFocused && query.length >= 2;

  const TYPE_LABELS: Record<string, string> = {
    clinic: "Clinic",
    pharmacy: "Pharmacy",
    "wellness-center": "Wellness",
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search by city, peptide, or provider name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className={`w-full pl-12 pr-4 bg-white border border-border-medium rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all ${
            variant === "hero" ? "py-4 text-base shadow-lg" : "py-2.5 text-sm shadow-sm"
          }`}
        />
        {query.length > 0 && (
          <button
            onClick={() => { setQuery(""); setIsFocused(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary p-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 top-full mt-2 w-full bg-white border border-border-subtle rounded-xl shadow-xl overflow-hidden">
          {results.length > 0 ? (
            <>
              {results.map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/providers/${entry.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-0 transition-colors border-b border-border-subtle last:border-b-0"
                  onClick={() => setIsFocused(false)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-text-primary truncate">
                      {entry.name}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {entry.city}, {entry.stateCode} &middot; {TYPE_LABELS[entry.type] ?? entry.type}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-text-tertiary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                className="flex items-center justify-center gap-1 px-4 py-2.5 text-sm text-accent font-medium hover:bg-accent-dim transition-colors"
                onClick={() => setIsFocused(false)}
              >
                View all results
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </>
          ) : (
            <div className="px-4 py-6 text-center">
              <div className="text-sm text-text-secondary mb-1">No providers found for &ldquo;{query}&rdquo;</div>
              <Link
                href="/submit"
                className="text-xs text-accent hover:underline"
                onClick={() => setIsFocused(false)}
              >
                Know a provider? Submit it
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
