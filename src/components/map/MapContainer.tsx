"use client";

import dynamic from "next/dynamic";
import type { MapIndexEntry } from "@/lib/data/schemas";
import type { UserLocation } from "@/lib/geo/geolocation";

const ProviderMap = dynamic(() => import("./ProviderMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-surface-0 rounded-xl">
      <div className="text-text-tertiary text-sm">Loading map...</div>
    </div>
  ),
});

interface MapContainerProps {
  entries: MapIndexEntry[];
  userLocation?: UserLocation | null;
  onBoundsChange?: (visibleSlugs: Set<string>) => void;
  selectedSlug?: string | null;
  className?: string;
  center?: [number, number];
  zoom?: number;
}

export default function MapContainer(props: MapContainerProps) {
  return <ProviderMap {...props} />;
}
