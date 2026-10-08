"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCompare } from "./CompareContext";

export function CompareBar() {
  const { slugs, remove, clear } = useCompare();

  const bar = useRef<HTMLDivElement>(null);
  const visible = slugs.length > 0;
  useEffect(() => {
    if (!visible || !bar.current) return;
    const update = () => document.documentElement.style.setProperty("--compare-bar-height", `${bar.current?.offsetHeight ?? 0}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar.current);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--compare-bar-height");
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div ref={bar} className="compare-bar fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border-medium shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-2 md:gap-4">
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 min-w-0 w-full md:w-auto md:flex-1">
          <span className="text-sm font-medium text-text-primary shrink-0">
            Compare ({slugs.length}/4):
          </span>
          <div className="flex min-w-0 max-w-full gap-1.5 overflow-x-auto snap-x snap-mandatory">
            {slugs.map((slug) => (
              <span
                key={slug}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-accent-dim text-accent rounded-full shrink-0 snap-start"
              >
                {slug.replace(/-/g, " ").slice(0, 20)}
                <button
                  onClick={() => remove(slug)}
                  aria-label={`Remove ${slug.replace(/-/g, " ")} from comparison`}
                  className="flex min-w-11 md:min-w-0 items-center justify-center hover:text-accent-hover"
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
