import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "About Peptides Nearby — a free directory of peptide therapy clinics, compounding pharmacies, and wellness centers across the United States.",
};

export default function AboutPage() {
  return (
    <section className="pt-12 pb-20">
      <div className="max-w-[640px] mx-auto px-6">
        <h1 className="font-display text-3xl text-text-primary mb-6">About Peptides Nearby</h1>

        <div className="prose prose-invert max-w-none text-text-secondary leading-relaxed space-y-4">
          <p>
            Peptides Nearby is a free directory helping people find peptide therapy providers in their area.
            We list clinics, compounding pharmacies, and wellness centers across the United States that offer
            peptide-based treatments.
          </p>

          <p>
            Our goal is simple: make it easy to find a qualified provider near you. Whether you&apos;re looking for
            BPC-157 for tissue repair, semaglutide for weight management, or hormone optimization therapy,
            we help you find a local provider you can visit in person.
          </p>

          <h2 className="font-display text-xl text-text-primary mt-8 mb-3">How We Work</h2>
          <p>
            We research and verify providers through public information, Google Maps data, and community submissions.
            Providers with a &ldquo;Verified&rdquo; badge have been confirmed to offer peptide therapy services at their listed location.
          </p>

          <h2 className="font-display text-xl text-text-primary mt-8 mb-3">Are You a Provider?</h2>
          <p>
            If you offer peptide therapy and want to be listed in our directory,{" "}
            <Link href="/submit" className="text-accent hover:underline">submit your practice</Link>.
            Listings are free.
          </p>

          <h2 className="font-display text-xl text-text-primary mt-8 mb-3">Our Sister Site</h2>
          <p>
            Looking for online peptide vendors instead? Visit{" "}
            <a href="https://peptidegrades.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              Peptide Grades
            </a>{" "}
            for independent vendor rankings and transparency scores.
          </p>
        </div>
      </div>
    </section>
  );
}
