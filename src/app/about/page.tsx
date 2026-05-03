import type { Metadata } from "next";
import { canonical } from "@/lib/seo/canonical";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "About Peptides Nearby — a free directory of peptide therapy clinics, compounding pharmacies, and wellness centers across the United States.",
  alternates: { canonical: canonical("/about") },
};

export default function AboutPage() {
  return (
    <section className="pt-12 pb-20">
      <div className="max-w-[700px] mx-auto px-6">
        <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-8">About Peptides Nearby</h1>

        <h2 className="font-display text-xl text-text-primary mt-10 mb-3">What Peptides Nearby Is</h2>
        <p className="text-text-secondary mb-4 leading-relaxed">
          <strong>Peptides Nearby</strong> is a directory of peptide therapy providers across the United States. We help you find clinics, compounding pharmacies, and wellness centers that offer peptide therapy in your area.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          The directory currently lists over 3,550 providers across 44 states and more than 800 cities. Each listing includes the provider&apos;s name, location, contact information, services offered, specific peptides available, telehealth availability, insurance details, and Google reviews.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          We built this because finding a local peptide therapy provider shouldn&apos;t require hours of searching. Type in your city or state, filter by the peptide you&apos;re looking for, and get a list of providers to evaluate on your own terms.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          That last part matters. We are a search tool, not a recommendation engine. We surface providers. You decide which ones deserve your time, your trust, and your health. We don&apos;t rank providers by quality, push you toward specific clinics, or editorialize on who is &ldquo;best.&rdquo; The directory gives you options. The decision is yours.
        </p>

        <h2 className="font-display text-xl text-text-primary mt-10 mb-3">How We Source Our Data</h2>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Providers enter our directory through systematic discovery scans using the Google Places API. We scan major US cities for clinics, pharmacies, and wellness centers whose listings mention peptide therapy, hormone optimization, weight loss medications, or related services.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Every discovery result goes through a relevance filter. If a provider clearly doesn&apos;t offer peptide therapy, they don&apos;t make it into the directory. Physical therapy clinics, stem cell clinics without peptide services, and other false matches get filtered out during this review step.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Once a provider passes the relevance filter, we pull additional data from their website. Our peptide tagging system fetches each provider&apos;s website text and runs deterministic keyword matching against it. When a provider&apos;s site mentions &ldquo;semaglutide,&rdquo; &ldquo;BPC-157,&rdquo; &ldquo;tirzepatide,&rdquo; or other specific peptide names, we tag that provider accordingly. These tags are not self-reported by providers. They reflect what we found on their websites at the time of our most recent scan.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Telehealth tagging works the same way. We scan provider websites for keywords related to virtual visits, telemedicine, and remote care. If those keywords appear, we tag the provider as offering telehealth services.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Insurance information comes from a combination of website scanning and Google Places data. Coverage accuracy varies, and insurance networks change frequently.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Provider details like address, phone number, and hours of operation come from Google Places and are updated periodically. We do not guarantee the accuracy of any listing. Providers move, change phone numbers, update their hours, and adjust their service offerings without notifying us. Always confirm details directly with the provider before scheduling a visit or making a trip.
        </p>

        <h2 className="font-display text-xl text-text-primary mt-10 mb-3">What Our Listings Mean (and Don&apos;t Mean)</h2>
        <p className="text-text-secondary mb-4 leading-relaxed">
          A listing on Peptides Nearby means one thing: we found a provider that appears to offer peptide-related services. That is the full extent of what a listing represents.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Here is what we do not do:
        </p>
        <ul className="space-y-2 text-sm text-text-secondary mb-6 ml-4">
          <li className="flex items-start gap-2"><span className="text-accent mt-0.5">•</span><span>We do not verify medical credentials, licenses, or board certifications.</span></li>
          <li className="flex items-start gap-2"><span className="text-accent mt-0.5">•</span><span>We do not evaluate treatment quality, safety protocols, or patient outcomes.</span></li>
          <li className="flex items-start gap-2"><span className="text-accent mt-0.5">•</span><span>We do not confirm that providers currently carry specific peptides. Website mentions are our best signal, but menus and formularies change.</span></li>
          <li className="flex items-start gap-2"><span className="text-accent mt-0.5">•</span><span>We do not endorse any provider. A listing is not a recommendation.</span></li>
        </ul>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Google reviews displayed on provider pages are pulled directly from the Google Places API. We show them for your reference, but we do not verify, moderate, or editorially curate them. They reflect what Google users have posted publicly.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Our directory uses a tiered listing system to help you understand the level of information behind each provider:
        </p>

        <div className="bg-surface-0 border border-border-subtle rounded-lg p-4 mb-3">
          <strong className="text-text-primary">Listed</strong>
          <p className="text-text-secondary text-sm mt-1 leading-relaxed">
            The default tier. It means we found the provider through our discovery process and they appear to offer relevant services. No one from our team has directly verified the listing with the provider.
          </p>
        </div>
        <div className="bg-surface-0 border border-border-subtle rounded-lg p-4 mb-3">
          <strong className="text-text-primary">Verified</strong>
          <p className="text-text-secondary text-sm mt-1 leading-relaxed">
            Means we have confirmed the provider exists, is currently operating, and offers peptide therapy. This tier is coming soon.
          </p>
        </div>
        <div className="bg-surface-0 border border-border-subtle rounded-lg p-4 mb-6">
          <strong className="text-text-primary">Claimed</strong>
          <p className="text-text-secondary text-sm mt-1 leading-relaxed">
            Means the provider has taken ownership of their listing and updated their own information directly. This tier is also coming soon.
          </p>
        </div>

        <p className="text-text-secondary mb-4 leading-relaxed">
          Why does all of this matter? Because health decisions are personal, and they carry real consequences. Use our directory as a starting point, not a finish line. Verify provider licenses through your state medical board. Call the office. Ask about their experience with the specific peptide you&apos;re considering. Read reviews from multiple sources. A directory gets you to the door. What happens after that is between you and the provider you choose.
        </p>

        <h2 className="font-display text-xl text-text-primary mt-10 mb-3">Our Relationship with Peptide Grades</h2>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Peptides Nearby and{" "}
          <a href="https://peptidegrades.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            Peptide Grades
          </a>{" "}
          are sister sites with different purposes.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Peptide Grades reviews and grades online peptide vendors. Its focus is purity testing, pricing transparency, and vendor accountability. If you&apos;re buying peptides from an online supplier and want to know whether they&apos;re legitimate, that&apos;s the site for you.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Peptides Nearby is a local provider directory. We focus on in-person clinics and telehealth providers who prescribe and administer peptide therapy. Different audience, different editorial lens.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          The two sites occasionally cross-reference each other where the content is relevant to your search. We don&apos;t monetize that cross-linking. If we link to Peptide Grades from a provider page or article, it&apos;s because the reference adds context, not because of an affiliate arrangement between the sites. Each site maintains its own editorial process independently.
        </p>

        <h2 className="font-display text-xl text-text-primary mt-10 mb-3">How to Use This Directory</h2>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Start by browsing your state or city to find providers near you. Every state page lists providers with basic details, and you can drill into individual provider pages for the full picture.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          If you&apos;re looking for a specific treatment, filter by peptide type. Searching for semaglutide providers or BPC-157 clinics narrows your results to providers whose websites mention those peptides.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Prefer virtual care? Check the telehealth section. We tag providers that advertise remote consultations so you can find options beyond your immediate area.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          Once you have a shortlist, do your homework. Visit provider websites directly. Call their offices and ask about pricing, availability, and whether they currently offer the peptide you need. Verify credentials through your state medical board&apos;s online lookup tool. Our directory gives you the leads. Confirming the details is on you.
        </p>
        <p className="text-text-secondary mb-4 leading-relaxed">
          If you&apos;re a provider and your listing needs updating, or if you&apos;d like to claim your listing, visit our{" "}
          <Link href="/submit" className="text-accent hover:underline">submit page</Link>{" "}
          to get started.
        </p>
      </div>
    </section>
  );
}
