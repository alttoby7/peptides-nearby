import type { Metadata } from "next";
import { canonical } from "@/lib/seo/canonical";
import { SubmitForm } from "./SubmitForm";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "Add Your Practice",
  description: "Submit your peptide therapy clinic, compounding pharmacy, or wellness center to the Peptides Nearby directory.",
  alternates: { canonical: canonical("/submit") },
};

export default function SubmitPage() {
  return (
    <section className="pt-12 pb-20">
      <div className="max-w-[640px] mx-auto px-6">
        <h1 className="font-display text-3xl text-text-primary mb-2">
          Add Your Practice
        </h1>
        <p className="text-text-secondary mb-8">
          Submit your clinic, compounding pharmacy, or wellness center to our directory.
          Submissions are reviewed before being published.
        </p>
        <SubmitForm />
      </div>
    </section>
  );
}
