"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import type { MapIndexEntry } from "@/lib/data/schemas";

interface CityMapProps {
  city: string;
  stateCode: string;
}

export default function CityMap({ city, stateCode }: CityMapProps) {
  const [entries, setEntries] = useState<MapIndexEntry[]>([]);
  const [leafletReady, setLeafletReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fetch("/data/map-index.json")
      .then((res) => res.json())
      .then((data: MapIndexEntry[]) => {
        const cityLower = city.toLowerCase();
        const filtered = data.filter(
          (e) => e.city.toLowerCase() === cityLower && e.stateCode === stateCode
        );
        setEntries(filtered);
      })
      .catch(() => {});
  }, [city, stateCode]);

  useEffect(() => {
    if (!leafletReady || entries.length === 0 || mapRef.current) return;

    const L = window.L;
    if (!L) return;

    const container = document.getElementById("city-map");
    if (!container) return;

    const avgLat = entries.reduce((s, e) => s + e.lat, 0) / entries.length;
    const avgLng = entries.reduce((s, e) => s + e.lng, 0) / entries.length;

    const map = L.map(container, {
      center: [avgLat, avgLng],
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    const colors: Record<string, string> = {
      clinic: "#2563eb",
      pharmacy: "#7c3aed",
      "wellness-center": "#059669",
    };

    const bounds = L.latLngBounds([]);
    for (const entry of entries) {
      const color = colors[entry.type] || "#6b7280";
      const marker = L.circleMarker([entry.lat, entry.lng], {
        radius: 8,
        fillColor: color,
        fillOpacity: 0.85,
        color: "#fff",
        weight: 2,
      });
      marker.bindPopup(
        `<div style="font-family:'DM Sans',sans-serif;">
          <strong><a href="/providers/${entry.slug}" style="color:#0f172a;text-decoration:none;">${entry.name}</a></strong>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">${entry.type === "wellness-center" ? "Wellness Center" : entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</div>
        </div>`
      );
      marker.addTo(map);
      bounds.extend([entry.lat, entry.lng]);
    }

    if (entries.length > 1) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leafletReady, entries]);

  if (entries.length === 0) return null;

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        strategy="afterInteractive"
        onLoad={() => setLeafletReady(true)}
      />
      <div className="mb-8">
        <div id="city-map" className="w-full rounded-xl overflow-hidden border border-border-subtle" style={{ height: 300 }} />
      </div>
    </>
  );
}
