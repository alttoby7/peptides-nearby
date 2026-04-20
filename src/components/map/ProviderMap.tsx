"use client";

import { useEffect, useRef, useCallback } from "react";
import type { MapIndexEntry } from "@/lib/data/schemas";
import type { UserLocation } from "@/lib/geo/geolocation";

const TYPE_COLORS: Record<string, string> = {
  clinic: "#2563eb",
  pharmacy: "#7c3aed",
  "wellness-center": "#059669",
};

interface ProviderMapProps {
  entries: MapIndexEntry[];
  userLocation?: UserLocation | null;
  onBoundsChange?: (visibleSlugs: Set<string>) => void;
  selectedSlug?: string | null;
  className?: string;
  center?: [number, number];
  zoom?: number;
}

export default function ProviderMap({
  entries,
  userLocation,
  onBoundsChange,
  selectedSlug,
  className = "",
  center,
  zoom,
}: ProviderMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.FeatureGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const emitVisibleSlugs = useCallback(() => {
    if (!mapInstanceRef.current || !onBoundsChange) return;
    const bounds = mapInstanceRef.current.getBounds();
    const visible = new Set<string>();
    for (const e of entriesRef.current) {
      if (bounds.contains([e.lat, e.lng])) visible.add(e.slug);
    }
    onBoundsChange(visible);
  }, [onBoundsChange]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = window.L;
    if (!L) return;

    const defaultCenter: [number, number] = center || [39.8, -98.5];
    const defaultZoom = zoom || 4;

    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // @ts-expect-error MarkerClusterGroup is loaded via CDN
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      chunkedLoading: true,
    });

    for (const entry of entries) {
      const color = TYPE_COLORS[entry.type] || "#6b7280";
      const marker = L.circleMarker([entry.lat, entry.lng], {
        radius: 7,
        fillColor: color,
        fillOpacity: 0.85,
        color: "#fff",
        weight: 1.5,
      });

      marker.bindPopup(
        `<div style="font-family: 'DM Sans', sans-serif; min-width: 180px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
            <a href="/providers/${entry.slug}" style="color: #0f172a; text-decoration: none;">${entry.name}</a>
          </div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
            ${entry.city}, ${entry.stateCode}
          </div>
          <div style="display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: ${color}15; color: ${color}; font-weight: 500;">
            ${entry.type === "wellness-center" ? "Wellness Center" : entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
          </div>
          <div style="margin-top: 8px;">
            <a href="/providers/${entry.slug}" style="font-size: 12px; color: #0ea5e9; text-decoration: none; font-weight: 500;">View Details &rarr;</a>
          </div>
        </div>`,
        { closeButton: true, className: "pn-popup" }
      );

      // Store slug for lookup
      (marker as any)._pnSlug = entry.slug;
      cluster.addLayer(marker);
    }

    map.addLayer(cluster);
    clusterRef.current = cluster;
    mapInstanceRef.current = map;

    map.on("moveend", emitVisibleSlugs);
    setTimeout(emitVisibleSlugs, 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      clusterRef.current = null;
    };
  }, [center, zoom, entries, emitVisibleSlugs]);

  // Handle user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    const L = window.L;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const marker = L.marker([userLocation.lat, userLocation.lng], {
      icon: L.divIcon({
        className: "pn-user-location",
        html: '<div style="width:16px;height:16px;background:#0ea5e9;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(14,165,233,0.5);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
      zIndexOffset: 1000,
    });
    marker.addTo(map);
    userMarkerRef.current = marker;

    map.setView([userLocation.lat, userLocation.lng], 11, { animate: true });
  }, [userLocation]);

  // Highlight selected provider
  useEffect(() => {
    if (!clusterRef.current || !selectedSlug) return;
    clusterRef.current.eachLayer((layer: any) => {
      if (layer._pnSlug === selectedSlug) {
        (clusterRef.current as any).zoomToShowLayer(layer, () => {
          layer.openPopup();
        });
      }
    });
  }, [selectedSlug]);

  return (
    <div
      ref={mapRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: 300 }}
    />
  );
}
