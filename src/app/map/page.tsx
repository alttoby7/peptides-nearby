import type { Metadata } from "next";
import MapPageClient from "./MapPageClient";

export const metadata: Metadata = {
  title: "Provider Map",
  description: "Find peptide therapy providers near you on an interactive map. Browse clinics, compounding pharmacies, and wellness centers across the United States.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://www.peptidesnearby.com/map" },
};

export default function MapPage() {
  return <MapPageClient />;
}
