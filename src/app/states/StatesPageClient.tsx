"use client";

import { useState } from "react";
import DirectorySearch from "@/components/ui/DirectorySearch";

interface StateItem {
  name: string;
  slug: string;
  code: string;
}

export function StatesPageClient({ states }: { states: StateItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? states.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.code.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  return (
    <>
      <DirectorySearch items={states} mode="states" onFilter={setQuery} />
      {filtered && filtered.length === 0 && (
        <div className="text-center py-8 text-text-tertiary text-sm">
          No states match &ldquo;{query}&rdquo;
        </div>
      )}
      {filtered && filtered.length > 0 && (
        <div className="mb-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((state) => (
            <a
              key={state.slug}
              href={`/${state.slug}`}
              className="card-lift p-4 bg-white border border-border-subtle rounded-xl shadow-sm hover:border-accent/30"
            >
              <span className="font-semibold text-text-primary">{state.name}</span>
              <span className="ml-2 text-xs text-text-tertiary">{state.code}</span>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
