"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import searchIndexData from "@/lib/data/search-index.json";
import type { SearchIndexEntry } from "@/lib/data/schemas";

const searchIndex = searchIndexData as unknown as SearchIndexEntry[];

const TYPE_LABELS: Record<string, string> = {
  clinic: "Clinic",
  pharmacy: "Pharmacy",
  "wellness-center": "Wellness Center",
};

const TYPE_COLORS: Record<string, string> = {
  clinic: "bg-clinic-bg text-clinic",
  pharmacy: "bg-pharmacy-bg text-pharmacy",
  "wellness-center": "bg-wellness-bg text-wellness",
};

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

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    return searchIndex.filter((e) => matchesQuery(e, query));
  }, [query]);

  return (
    <section className="pt-12 pb-20">
      <div className="max-w-[1240px] mx-auto px-6">
        <nav className="text-sm text-text-tertiary mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-text-secondary">Search</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-6">
          Search Providers
        </h1>

        <div className="relative mb-8 max-w-[640px]">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by city, peptide, or provider name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-border-medium rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all shadow-sm"
          />
        </div>

        {query.length >= 2 ? (
          <>
            <p className="text-sm text-text-tertiary mb-4">
              {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
            </p>
            {results.length > 0 ? (
              <div className="flex flex-col gap-3">
                {results.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={`/providers/${entry.slug}`}
                    className="card-lift group p-5 bg-white border border-border-subtle rounded-xl shadow-sm hover:border-accent/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                            {entry.name}
                          </h2>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[entry.type]}`}>
                            {TYPE_LABELS[entry.type]}
                          </span>
                        </div>
                        <div className="text-sm text-text-tertiary">
                          {entry.city}, {entry.stateCode}
                        </div>
                        {entry.peptides.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {entry.peptides.slice(0, 6).map((p) => (
                              <span key={p} className="text-xs px-2 py-0.5 bg-surface-3 text-text-secondary rounded">
                                {p}
                              </span>
                            ))}
                            {entry.peptides.length > 6 && (
                              <span className="text-xs px-2 py-0.5 bg-surface-3 text-text-tertiary rounded">
                                +{entry.peptides.length - 6}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-text-tertiary shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
                <p className="text-text-secondary mb-4">No providers match your search.</p>
                <Link href="/submit" className="inline-block px-5 py-2.5 bg-accent text-white font-semibold rounded-lg">
                  Submit a Practice
                </Link>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-text-tertiary">
            Type at least 2 characters to search across {searchIndex.length} providers.
          </p>
        )}
      </div>
    </section>
  );
}
