import type { Metadata } from "next";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { CompareProvider } from "@/components/compare/CompareContext";
import { CompareBar } from "@/components/compare/CompareBar";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.peptidesnearby.com"),
  title: {
    default: "Peptides Nearby — Find Peptide Therapy Near You",
    template: "%s | Peptides Nearby",
  },
  description:
    "Find peptide therapy clinics, compounding pharmacies, and wellness centers near you. Browse providers by city, state, or treatment type.",
  openGraph: {
    type: "website",
    siteName: "Peptides Nearby",
    title: "Peptides Nearby — Find Peptide Therapy Near You",
    description:
      "Find peptide therapy clinics, compounding pharmacies, and wellness centers near you.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">
        <CompareProvider>
          <Nav />
          <main className="relative z-1">{children}</main>
          <Footer />
          <CompareBar />
        </CompareProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
