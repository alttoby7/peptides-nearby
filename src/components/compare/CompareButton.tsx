"use client";

import { useCompare } from "./CompareContext";

export function CompareButton({ slug }: { slug: string }) {
  const { add, remove, has, isFull } = useCompare();
  const isSelected = has(slug);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSelected) remove(slug);
        else add(slug);
      }}
      disabled={!isSelected && isFull}
      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors shrink-0 ${
        isSelected
          ? "bg-accent text-white border-accent"
          : isFull
            ? "bg-surface-2 text-text-tertiary border-border-subtle cursor-not-allowed"
            : "bg-white text-text-secondary border-border-medium hover:border-accent hover:text-accent"
      }`}
      title={isSelected ? "Remove from comparison" : isFull ? "Max 4 providers" : "Add to comparison"}
    >
      {isSelected ? "- Compare" : "+ Compare"}
    </button>
  );
}
