"use client";

import { ProviderSearch } from "./ProviderSearch";
import searchIndexData from "@/lib/data/search-index.json";
import type { SearchIndexEntry } from "@/lib/data/schemas";

const searchIndex: SearchIndexEntry[] = searchIndexData as SearchIndexEntry[];

export function HeroSearch() {
  return <ProviderSearch entries={searchIndex} variant="hero" />;
}
