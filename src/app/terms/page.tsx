import type { Metadata } from "next";
import { canonical } from "@/lib/seo/canonical";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "Terms of Service",
  description: "Terms of service for Peptides Nearby.",
  alternates: { canonical: canonical("/terms") },
};

export default function TermsPage() {
  return (
    <section className="pt-12 pb-20">
      <div className="max-w-[640px] mx-auto px-6">
        <h1 className="font-display text-3xl text-text-primary mb-6">Terms of Service</h1>
        <div className="text-text-secondary leading-relaxed space-y-4">
          <p><em>Last updated: March 2026</em></p>

          <h2 className="font-display text-xl text-text-primary mt-8 mb-3">Directory Listings</h2>
          <p>
            Peptides Nearby is a directory of peptide therapy providers. Listings are provided for
            informational purposes only. We do not endorse, recommend, or guarantee the quality of
            any listed provider.
          </p>

          <h2 className="font-display text-xl text-text-primary mt-8 mb-3">Not Medical Advice</h2>
          <p>
            The content on this site is not medical advice. Always consult with a qualified healthcare
            provider before starting any peptide therapy or medical treatment.
          </p>

          <h2 className="font-display text-xl text-text-primary mt-8 mb-3">Accuracy</h2>
          <p>
            We make reasonable efforts to keep provider information accurate, but we cannot guarantee
            that all details (hours, services, contact information) are current. Providers are
            encouraged to submit updates through our directory.
          </p>

          <h2 className="font-display text-xl text-text-primary mt-8 mb-3">Submissions</h2>
          <p>
            By submitting a practice to our directory, you confirm that the information is accurate
            and that you are authorized to submit it. We reserve the right to edit or remove any listing.
          </p>

          <h2 className="font-display text-xl text-text-primary mt-8 mb-3">Contact</h2>
          <p>
            For questions about these terms, contact us at info@peptidesnearby.com.
          </p>
        </div>
      </div>
    </section>
  );
}
