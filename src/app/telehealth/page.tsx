import type { Metadata } from "next";
import { canonical } from "@/lib/seo/canonical";
import Link from "next/link";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import telehealthData from "@/lib/data/telehealth.json";
import telehealthPeptidesData from "@/lib/data/telehealth-peptides.json";

interface TelehealthStateEntry {
  stateCode: string;
  stateName: string;
  stateSlug: string;
  providerSlugs: string[];
  providerCount: number;
  visitTypes: string[];
}

interface TelehealthPeptideEntry {
  slug: string;
  name: string;
  description: string;
  providerCount: number;
  providerSlugs: string[];
}

const telehealthStates: TelehealthStateEntry[] = telehealthData as TelehealthStateEntry[];
const telehealthPeptides: TelehealthPeptideEntry[] = telehealthPeptidesData as TelehealthPeptideEntry[];

export const metadata: Metadata = {
  title: "Telehealth Peptide Therapy — Find Virtual Providers by State",
  description: "Browse providers whose websites mention telehealth or virtual visits. Confirm current services and prescriber licensing directly with a provider before booking.",
  alternates: { canonical: canonical("/telehealth") },
};

export default function TelehealthHubPage() {
  const BASE = "https://www.peptidesnearby.com";
  const totalProviders = new Set(telehealthStates.flatMap((s) => s.providerSlugs)).size;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: BASE },
        { name: "Telehealth", url: `${BASE}/telehealth` },
      ])} />

      {/* Hero */}
      <section className="relative pt-16 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/3 pointer-events-none" />
        <div className="max-w-[1240px] mx-auto px-6 relative">
          <nav className="text-sm text-text-tertiary mb-6">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary">Telehealth</span>
          </nav>

          <h1 className="font-display text-4xl md:text-5xl text-text-primary mb-3">
            Telehealth Peptide Therapy
          </h1>
          <p className="text-lg text-text-secondary max-w-[640px] mb-6">
            {totalProviders > 0
              ? `${totalProviders} providers' websites mention virtual visits across ${telehealthStates.length} states. Confirm current services and prescriber licensing before you book.`
              : "We're building our telehealth directory. Check back soon or browse local providers."}
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-2xl font-bold text-accent">{totalProviders}</span>
              <span className="text-text-tertiary ml-1.5">Telehealth Providers</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-accent">{telehealthStates.length}</span>
              <span className="text-text-tertiary ml-1.5">States Covered</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-accent">{telehealthPeptides.length}</span>
              <span className="text-text-tertiary ml-1.5">Peptides Mentioned</span>
            </div>
          </div>
        </div>
      </section>

      {/* How to use this directory */}
      <section className="py-12 bg-surface-0 border-y border-border-subtle">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-2xl text-text-primary mb-8 text-center">
            Use This Directory as a Starting Point
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Review the Provider’s Site",
                desc: "A listing reflects a website mention. Current services, visit types, and availability can change, so review the provider’s own information before booking.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                ),
              },
              {
                step: "2",
                title: "Confirm Current Details",
                desc: "Ask whether the provider currently serves people in your state, who provides care, and how to confirm the prescriber’s current license.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                ),
              },
              {
                step: "3",
                title: "Ask About Next Steps",
                desc: "Discuss the provider’s current evaluation process, fees, follow-up options, and any pharmacy or fulfillment arrangements directly with the provider.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h17.25M3.375 14.25V6.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v7.875m-13.5 0h13.5m0 0 2.25-3.375h3.375c.621 0 1.125.504 1.125 1.125v2.25" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="bg-white border border-border-subtle rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    {item.icon}
                  </div>
                  <div className="text-xs font-bold text-accent uppercase tracking-wider">Step {item.step}</div>
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Questions to ask */}
      <section className="py-12">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="max-w-[700px]">
            <h2 className="font-display text-2xl text-text-primary mb-4">
              Questions to Ask a Telehealth Provider
            </h2>
            <p className="text-sm text-text-secondary mb-3">
              Peptides Nearby is a directory, not a medical service or a verification of a provider&apos;s current offerings. Use a provider&apos;s own team to answer questions about your situation.
            </p>
            <ol className="space-y-3 text-sm text-text-secondary mb-4">
              <li><strong>1. Do you currently offer appointments in my state?</strong></li>
              <li><strong>2. How can I verify the prescriber&apos;s current license?</strong></li>
              <li><strong>3. What evaluation and follow-up process do you use?</strong></li>
              <li><strong>4. What will I pay, what is included, and what are the cancellation terms?</strong></li>
              <li><strong>5. If a prescription is considered appropriate, what pharmacy and fulfillment arrangements apply?</strong></li>
            </ol>
          </div>
        </div>
      </section>

      {/* Telehealth peptides */}
      {telehealthPeptides.length > 0 && (
        <section className="py-12">
          <div className="max-w-[1240px] mx-auto px-6">
            <h2 className="font-display text-2xl text-text-primary mb-2">
              Peptides Mentioned by Telehealth Providers
            </h2>
            <p className="text-text-secondary mb-6">
              These pages group provider-website mentions. They do not verify that a provider currently offers a particular service.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {telehealthPeptides.map((tp) => (
                <Link
                  key={tp.slug}
                  href={`/telehealth/peptides/${tp.slug}`}
                  className="card-lift p-4 bg-white border border-border-subtle rounded-xl shadow-sm hover:border-accent/30"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-text-primary">{tp.name}</span>
                    <span className="text-xs text-accent font-medium">{tp.providerCount} providers</span>
                  </div>
                  <p className="text-xs text-text-tertiary">View provider-website mentions</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Visit type comparison */}
      <section className="py-12 bg-surface-0 border-y border-border-subtle">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-2xl text-text-primary mb-2">
            Visit Types to Confirm
          </h2>
          <p className="text-text-secondary mb-6">
            Providers may use different appointment formats. Confirm what is currently available before booking.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                type: "Video Visit",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                ),
                desc: "Ask whether a provider currently offers video appointments for people in your state.",
                best: "Availability varies by provider and state",
              },
              {
                type: "Phone Visit",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                ),
                desc: "Ask whether phone appointments are available and what the provider requires before a visit.",
                best: "Availability varies by provider and state",
              },
              {
                type: "Async / Messaging",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                  </svg>
                ),
                desc: "Ask whether secure messaging is available and how the provider handles clinical questions.",
                best: "Availability and response policies vary",
              },
            ].map((item) => (
              <div key={item.type} className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-accent">{item.icon}</div>
                  <h3 className="font-semibold text-text-primary">{item.type}</h3>
                </div>
                <p className="text-sm text-text-secondary mb-3">{item.desc}</p>
                <p className="text-xs text-accent font-medium">{item.best}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* State grid */}
      <section className="py-12">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-2xl text-text-primary mb-2">
            Find Telehealth Providers by State
          </h2>
          <p className="text-text-secondary mb-6">
            Browse providers whose websites mention serving your state, then confirm the prescriber's current license before booking.
          </p>

          {telehealthStates.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {telehealthStates.map((s) => (
                <Link
                  key={s.stateCode}
                  href={`/telehealth/${s.stateSlug}`}
                  className="card-lift p-4 bg-white border border-border-subtle rounded-xl shadow-sm hover:border-accent/30"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
                    </svg>
                    <div>
                      <div className="font-semibold text-text-primary text-sm">{s.stateName}</div>
                      <div className="text-xs text-text-tertiary">
                        {s.providerCount} {s.providerCount === 1 ? "provider" : "providers"}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
              <p className="text-text-secondary mb-4">No telehealth providers listed yet.</p>
              <Link href="/states" className="inline-block px-5 py-2.5 bg-accent text-white font-semibold rounded-lg">
                Browse Local Providers
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Licensing explainer */}
      <section className="py-12 bg-surface-0 border-y border-border-subtle">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="max-w-[700px]">
            <h2 className="font-display text-2xl text-text-primary mb-4">
              Licensing and State Requirements
            </h2>
            <p className="text-sm text-text-secondary mb-3">
              <strong>Confirm licensing directly.</strong> Telehealth requirements can vary by state and service. Ask the provider how to verify the prescriber&apos;s current license for where you receive care.
            </p>
            <p className="text-sm text-text-secondary mb-3">
              Current state and federal rules can change. A provider and the relevant licensing authority are the appropriate sources for current requirements.
            </p>
            <p className="text-sm text-text-secondary mb-3">
              Ask the provider to explain its current evaluation, follow-up, and pharmacy arrangements for your circumstances before agreeing to care or payment.
            </p>
            <p className="text-sm text-text-secondary mb-3">
              Our state-level telehealth pages list providers whose websites mention serving each state. We do not verify licenses, availability, prescribing, or fulfillment.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-2xl text-text-primary mb-6">
            Frequently Asked Questions
          </h2>
          <div className="max-w-[700px] space-y-6">
            {[
              {
                q: "Can a telehealth provider serve someone in a different state?",
                a: "Ask the provider about its current availability and how to verify the prescriber’s current license for your location. Peptides Nearby does not verify either point.",
              },
              {
                q: "What should I ask before booking a telehealth appointment?",
                a: "Ask about current state availability, the provider’s evaluation process, who provides care, the total cost and cancellation terms, and any pharmacy arrangements.",
              },
              {
                q: "How are pharmacy and fulfillment arrangements handled?",
                a: "Ask the provider directly about its current arrangements. Peptides Nearby does not verify prescriptions, pharmacy services, shipping, or delivery times.",
              },
            ].map((faq, i) => (
              <div key={i}>
                <h3 className="font-semibold text-text-primary mb-1">{faq.q}</h3>
                <p className="text-sm text-text-secondary">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
