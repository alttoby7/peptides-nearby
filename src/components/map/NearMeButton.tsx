"use client";

import { useEffect, useRef } from "react";
import { useGeolocation } from "@/lib/geo/geolocation";

interface NearMeButtonProps {
  onLocation?: (lat: number, lng: number) => void;
  variant?: "hero" | "inline";
  className?: string;
}

export default function NearMeButton({ onLocation, variant = "inline", className = "" }: NearMeButtonProps) {
  const { location, error, loading, requestLocation } = useGeolocation();
  const calledRef = useRef(false);

  const handleClick = () => {
    if (location && onLocation) {
      onLocation(location.lat, location.lng);
      return;
    }
    requestLocation();
  };

  useEffect(() => {
    if (location && onLocation && !calledRef.current) {
      calledRef.current = true;
      onLocation(location.lat, location.lng);
    }
  }, [location, onLocation]);

  const isHero = variant === "hero";

  return (
    <div className={className}>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`
          inline-flex items-center gap-2 font-medium transition-all
          ${isHero
            ? "px-6 py-3 rounded-lg bg-white border border-border-medium text-text-primary hover:border-accent hover:text-accent shadow-sm"
            : "px-3 py-1.5 rounded-full text-sm bg-accent-dim text-accent hover:bg-accent hover:text-white"
          }
          ${loading ? "opacity-60 cursor-wait" : ""}
        `}
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        )}
        {loading ? "Locating..." : "Find Near Me"}
      </button>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
