"use client";

import { useState } from "react";
import DirectorySearch from "@/components/ui/DirectorySearch";

interface CityItem {
  name: string;
  slug: string;
}

export function StatePageClient({ cities, stateSlug }: { cities: CityItem[]; stateSlug: string }) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? cities.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : null;

  return (
    <>
      <DirectorySearch items={cities} mode="cities" onFilter={setQuery} />
      {filtered && filtered.length === 0 && (
        <div className="text-center py-8 text-text-tertiary text-sm mb-6">
          No cities match &ldquo;{query}&rdquo;
        </div>
      )}
      {filtered && filtered.length > 0 && (
        <div className="mb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((city) => (
            <a
              key={city.slug}
              href={`/${stateSlug}/${city.slug}`}
              className="card-lift p-4 bg-white border border-border-subtle rounded-xl shadow-sm hover:border-accent/30"
            >
              <span className="font-semibold text-text-primary">{city.name}</span>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
