"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Script from "next/script";
import MapContainer from "@/components/map/MapContainer";
import DistanceBadge from "@/components/map/DistanceBadge";
import { useGeolocation } from "@/lib/geo/geolocation";
import { haversineDistance } from "@/lib/geo/haversine";
import type { MapIndexEntry } from "@/lib/data/schemas";

type ProviderType = "clinic" | "pharmacy" | "wellness-center";
type ViewMode = "split" | "map" | "list";

const TYPE_LABELS: Record<ProviderType, string> = {
  clinic: "Clinics",
  pharmacy: "Pharmacies",
  "wellness-center": "Wellness Centers",
};

const TYPE_DOT_COLORS: Record<ProviderType, string> = {
  clinic: "bg-clinic",
  pharmacy: "bg-pharmacy",
  "wellness-center": "bg-wellness",
};

const TYPE_ACTIVE_STYLES: Record<ProviderType, string> = {
  clinic: "bg-clinic-bg text-clinic border-clinic/30",
  pharmacy: "bg-pharmacy-bg text-pharmacy border-pharmacy/30",
  "wellness-center": "bg-wellness-bg text-wellness border-wellness/30",
};

const TYPE_BADGE_COLORS: Record<ProviderType, string> = {
  clinic: "bg-clinic-bg text-clinic",
  pharmacy: "bg-pharmacy-bg text-pharmacy",
  "wellness-center": "bg-wellness-bg text-wellness",
};

export default function MapPageClient() {
  const [entries, setEntries] = useState<MapIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [leafletReady, setLeafletReady] = useState(false);
  const [visibleSlugs, setVisibleSlugs] = useState<Set<string> | null>(null);
  const [typeFilter, setTypeFilter] = useState<Set<ProviderType>>(new Set());
  const [radiusFilter, setRadiusFilter] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const { location, requestLocation } = useGeolocation();

  useEffect(() => {
    fetch("/data/map-index.json")
      .then((res) => res.json())
      .then((data: MapIndexEntry[]) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredEntries = useMemo(() => {
    if (typeFilter.size === 0) return entries;
    return entries.filter((e) => typeFilter.has(e.type));
  }, [entries, typeFilter]);

  const entriesWithDistance = useMemo(() => {
    const withDist = filteredEntries.map((e) => ({
      ...e,
      distance: location ? haversineDistance(location.lat, location.lng, e.lat, e.lng) : null,
    }));

    if (radiusFilter && location) {
      return withDist
        .filter((e) => e.distance !== null && e.distance <= radiusFilter)
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }

    if (location) {
      return withDist.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }

    return withDist;
  }, [filteredEntries, location, radiusFilter]);

  const listEntries = useMemo(() => {
    if (viewMode === "list" || !visibleSlugs) return entriesWithDistance;
    return entriesWithDistance.filter((e) => visibleSlugs.has(e.slug));
  }, [entriesWithDistance, visibleSlugs, viewMode]);

  const handleBoundsChange = useCallback((slugs: Set<string>) => {
    setVisibleSlugs(slugs);
  }, []);

  const handleNearMe = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  const toggleType = (type: ProviderType) => {
    setTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const RADIUS_OPTIONS = [25, 50, 100, 250];

  if (loading) {
    return (
      <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
        {/* Skeleton toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border-subtle bg-white shrink-0">
          {[80, 64, 88, 104].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-lg bg-surface-2 animate-pulse"
              style={{ width: w }}
            />
          ))}
        </div>
        <div className="flex-1 flex">
          <div className="w-1/2 hidden lg:flex items-center justify-center bg-surface-0">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-10 h-10 text-text-tertiary/40 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0 0l-3-3m3 3l3-3m-3 3V6.75M3.75 21h16.5M3.75 3h16.5m-16.5 9h16.5" />
              </svg>
              <span className="text-sm text-text-tertiary">Loading map data...</span>
            </div>
          </div>
          <div className="flex-1 lg:w-1/2 p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl bg-white border border-border-subtle p-4 animate-pulse">
                <div className="h-4 bg-surface-2 rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface-2 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        strategy="afterInteractive"
        onLoad={() => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
          script.onload = () => setLeafletReady(true);
          document.head.appendChild(script);
        }}
      />

      <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
        {/* Toolbar */}
        <div className="shrink-0 bg-white border-b border-border-subtle">
          <div className="flex items-center gap-2 px-4 lg:px-5 py-2.5 overflow-x-auto">
            {/* Near Me */}
            <button
              onClick={handleNearMe}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-accent text-white hover:bg-accent-hover transition-colors shrink-0 shadow-[0_1px_3px_rgba(14,165,233,0.3)]"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Near Me
            </button>

            <div className="w-px h-5 bg-border-medium shrink-0" />

            {/* Type filters — bordered buttons matching site pattern */}
            {(Object.entries(TYPE_LABELS) as [ProviderType, string][]).map(([type, label]) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                  typeFilter.has(type)
                    ? TYPE_ACTIVE_STYLES[type]
                    : "bg-white text-text-secondary border-border-medium hover:border-accent hover:text-accent"
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${TYPE_DOT_COLORS[type]}`} />
                {label}
              </button>
            ))}

            {/* Radius filter */}
            {location && (
              <>
                <div className="w-px h-5 bg-border-medium shrink-0" />
                <select
                  value={radiusFilter ?? ""}
                  onChange={(e) => setRadiusFilter(e.target.value ? Number(e.target.value) : null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-text-secondary border border-border-medium cursor-pointer hover:border-accent transition-colors"
                >
                  <option value="">Any distance</option>
                  {RADIUS_OPTIONS.map((r) => (
                    <option key={r} value={r}>Within {r} mi</option>
                  ))}
                </select>
              </>
            )}

            <div className="ml-auto shrink-0 flex items-center gap-3">
              <span className="text-xs text-text-tertiary tabular-nums">
                <span className="font-semibold text-text-secondary">{listEntries.length.toLocaleString()}</span> providers
              </span>

              {/* View toggle */}
              <div className="flex items-center border border-border-subtle rounded-lg p-0.5 shrink-0">
                {(["split", "map", "list"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      viewMode === mode
                        ? "bg-accent text-white shadow-sm"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    {mode === "split" ? "Split" : mode === "map" ? "Map" : "List"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map panel */}
          {viewMode !== "list" && (
            <div className={`${viewMode === "split" ? "w-1/2 hidden lg:block" : "w-full"} relative`}>
              {leafletReady ? (
                <MapContainer
                  entries={filteredEntries}
                  userLocation={location}
                  onBoundsChange={handleBoundsChange}
                  selectedSlug={selectedSlug}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-0">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    <span className="text-sm text-text-tertiary">Loading map...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List panel */}
          {viewMode !== "map" && (
            <div className={`${viewMode === "split" ? "w-full lg:w-1/2" : "w-full max-w-4xl mx-auto"} overflow-y-auto bg-surface-0 ${viewMode === "split" ? "border-l border-border-subtle" : ""}`}>
              {listEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-text-primary mb-1">No providers in this area</p>
                  <p className="text-text-tertiary text-sm">Try zooming out or adjusting your filters</p>
                </div>
              ) : (
                <div className="p-2 lg:p-3 space-y-1.5">
                  {listEntries.slice(0, 100).map((entry) => (
                    <button
                      key={entry.slug}
                      onClick={() => setSelectedSlug(entry.slug)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white border border-border-subtle hover:border-accent/25 hover:shadow-[0_4px_16px_rgba(14,165,233,0.06)] transition-all group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${TYPE_DOT_COLORS[entry.type]}`} />
                            <a
                              href={`/providers/${entry.slug}`}
                              className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {entry.name}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-text-tertiary">
                              {entry.city}, {entry.stateCode}
                            </span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${TYPE_BADGE_COLORS[entry.type]}`}>
                              {entry.type === "wellness-center" ? "Wellness" : entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {entry.distance != null && (
                            <DistanceBadge miles={entry.distance} />
                          )}
                          <svg className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                  {listEntries.length > 100 && (
                    <div className="px-4 py-3 text-center text-xs text-text-tertiary rounded-xl bg-surface-2">
                      Showing 100 of {listEntries.length.toLocaleString()} providers. Zoom in to see more.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile floating toggle */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-lg transition-transform active:scale-95"
            style={{
              background: "rgba(14,165,233,0.95)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 4px 20px rgba(14,165,233,0.35), 0 0 0 1px rgba(255,255,255,0.15) inset",
            }}
          >
            {viewMode === "map" ? (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                Show List
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                Show Map
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
