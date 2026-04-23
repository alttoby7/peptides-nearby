import type { Metadata } from "next";
import { canonical } from "@/lib/seo/canonical";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Peptides Nearby.",
  alternates: { canonical: canonical("/privacy") },
};

export default function PrivacyPage() {
  return (
    <section className="pt-12 pb-20">
      <div className="max-w-[640px] mx-auto px-6">
        <h1 className="font-display text-3xl text-text-primary mb-6">Privacy Policy</h1>
        <div className="text-text-secondary leading-relaxed space-y-4">
          <p><em>Last updated: March 2026</em></p>

          <h2 className="font-display text-xl text-text-primary mt-8 mb-3">Information We Collect</h2>
          <p>
            Peptides Nearby collects minimal information. We do not require user accounts or logins.
            If you submit a practice through our form, we collect the information you provide (practice name,
            address, phone, website, services). This information is used solely to list your practice in our directory.
          </p>

          <h2 className="font-display text-xl text-text-primary mt-8 mb-3">Analytics</h2>
          <p>
            We may use privacy-respecting analytics to understand how visitors use our site. We do not sell
            or share personal data with third parties.
          </p>

          <h2 className="font-display text-xl text-text-primary mt-8 mb-3">Cookies</h2>
          <p>
            This site uses minimal cookies necessary for basic functionality. We do not use tracking cookies
            or advertising cookies.
          </p>

          <h2 className="font-display text-xl text-text-primary mt-8 mb-3">External Links</h2>
          <p>
            Our site contains links to provider websites and our sister site, Peptide Grades. We are not
            responsible for the privacy practices of external sites.
          </p>

          <h2 className="font-display text-xl text-text-primary mt-8 mb-3">Contact</h2>
          <p>
            For privacy questions, contact us at info@peptidesnearby.com.
          </p>
        </div>
      </div>
    </section>
  );
}
