"use client";

import { useState, useMemo } from "react";

interface DirectoryItem {
  name: string;
  slug: string;
  code?: string;
}

interface DirectorySearchProps {
  items: DirectoryItem[];
  mode: "states" | "cities";
  onFilter: (query: string) => void;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function DirectorySearch({ items, mode, onFilter }: DirectorySearchProps) {
  const [query, setQuery] = useState("");

  const activeLetters = useMemo(() => {
    const letters = new Set<string>();
    items.forEach((item) => {
      const first = item.name.charAt(0).toUpperCase();
      if (first >= "A" && first <= "Z") letters.add(first);
    });
    return letters;
  }, [items]);

  const handleChange = (value: string) => {
    setQuery(value);
    onFilter(value);
  };

  const handleLetterClick = (letter: string) => {
    if (!activeLetters.has(letter)) return;
    const el = document.getElementById(`section-${letter}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setQuery("");
      onFilter("");
    }
  };

  return (
    <div className="mb-8">
      <div className="relative mb-3">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={mode === "states" ? "Search states..." : "Search cities..."}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-border-medium text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
        />
      </div>

      <div className="flex gap-0.5 overflow-x-auto pb-1 scrollbar-none">
        {ALPHABET.map((letter) => {
          const active = activeLetters.has(letter);
          return (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              className={`w-7 h-7 shrink-0 rounded-md text-xs font-semibold transition-colors ${
                active
                  ? "text-text-secondary hover:bg-accent hover:text-white"
                  : "text-text-tertiary/40 cursor-default"
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
