"use client";

import { useState, useCallback, useEffect } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
}

interface GeolocationState {
  location: UserLocation | null;
  error: string | null;
  loading: boolean;
  requestLocation: () => void;
}

const CACHE_KEY = "pn_user_location";
const CACHE_TTL = 3600000; // 1 hour

function getCachedLocation(): UserLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { lat: number; lng: number; ts: number };
    if (Date.now() - cached.ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return { lat: cached.lat, lng: cached.lng };
  } catch {
    return null;
  }
}

function cacheLocation(loc: UserLocation): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...loc, ts: Date.now() }));
  } catch {
    // localStorage quota exceeded or unavailable
  }
}

export function useGeolocation(): GeolocationState {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = getCachedLocation();
    if (cached) setLocation(cached);
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        cacheLocation(loc);
        setLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Location access denied",
          2: "Location unavailable",
          3: "Location request timed out",
        };
        setError(messages[err.code] || "Could not get location");
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 3600000,
      }
    );
  }, []);

  return { location, error, loading, requestLocation };
}
