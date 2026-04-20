"use client";

import Link from "next/link";
import { useCompare } from "./CompareContext";

export function CompareBar() {
  const { slugs, remove, clear } = useCompare();

  if (slugs.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border-medium shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="max-w-[1240px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium text-text-primary shrink-0">
            Compare ({slugs.length}/4):
          </span>
          <div className="flex gap-1.5 overflow-x-auto">
            {slugs.map((slug) => (
              <span
                key={slug}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-accent-dim text-accent rounded-full shrink-0"
              >
                {slug.replace(/-/g, " ").slice(0, 20)}
                <button
                  onClick={() => remove(slug)}
                  className="hover:text-accent-hover"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clear}
            className="text-xs text-text-tertiary hover:text-text-secondary"
          >
            Clear
          </button>
          <Link
            href={`/compare?providers=${slugs.join(",")}`}
            className="px-4 py-2 text-sm font-semibold bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            Compare Now
          </Link>
        </div>
      </div>
    </div>
  );
}
