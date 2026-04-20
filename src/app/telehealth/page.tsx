import type { Metadata } from "next";
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
  description: "Find telehealth peptide therapy providers licensed in your state. Browse virtual clinics offering BPC-157, semaglutide, sermorelin, and more via video visits.",
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
              ? `${totalProviders} providers offer virtual peptide therapy visits across ${telehealthStates.length} states. Find a provider licensed in your state.`
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
              <span className="text-text-tertiary ml-1.5">Peptides Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 bg-surface-0 border-y border-border-subtle">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-2xl text-text-primary mb-8 text-center">
            How Telehealth Peptide Therapy Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Virtual Consultation",
                desc: "Book a video or phone visit with a licensed provider in your state. Discuss your goals, medical history, and treatment options.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                ),
              },
              {
                step: "2",
                title: "Lab Work & Prescription",
                desc: "Your provider may order labs (often at a local draw center). Once results are in, they prescribe the right peptide protocol for you.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                ),
              },
              {
                step: "3",
                title: "Delivered to Your Door",
                desc: "Your peptides are shipped from a licensed compounding pharmacy directly to you. Follow-up visits happen virtually too.",
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

      {/* Telehealth peptides */}
      {telehealthPeptides.length > 0 && (
        <section className="py-12">
          <div className="max-w-[1240px] mx-auto px-6">
            <h2 className="font-display text-2xl text-text-primary mb-2">
              Peptides Available via Telehealth
            </h2>
            <p className="text-text-secondary mb-6">
              Browse telehealth providers by the peptide therapy you need.
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
                  <p className="text-xs text-text-tertiary line-clamp-2">{tp.description}</p>
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
            Visit Types Explained
          </h2>
          <p className="text-text-secondary mb-6">
            Telehealth providers offer different ways to connect.
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
                desc: "Face-to-face consultation via secure video. Most thorough option — allows the provider to see you and discuss treatment in real time.",
                best: "Best for initial consultations and complex cases",
              },
              {
                type: "Phone Visit",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                ),
                desc: "Voice-only consultation by phone. Simple and accessible — no camera or app needed, works from anywhere.",
                best: "Best for follow-ups and prescription refills",
              },
              {
                type: "Async / Messaging",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                  </svg>
                ),
                desc: "Message-based consultation via a secure portal. Complete intake forms and get a response within 24-48 hours — no scheduling needed.",
                best: "Best for straightforward prescriptions and busy schedules",
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
            Telehealth providers must be licensed in the state where you receive care. Select your state below.
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
          <h2 className="font-display text-2xl text-text-primary mb-4">
            State Licensing & Telehealth
          </h2>
          <div className="max-w-[700px] space-y-3 text-sm text-text-secondary">
            <p>
              Telehealth providers must hold a valid medical license in the state where the <em>patient</em> is located during the visit — not where the provider is based. This means a clinic in California can treat patients in Texas, as long as the provider is also licensed in Texas.
            </p>
            <p>
              Some providers are licensed in many states and can treat patients nationwide. Others only serve patients in their home state. We list each provider under every state they can serve.
            </p>
            <p>
              Always confirm state licensure directly with the provider before booking. Licensing requirements change frequently and vary by state.
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
                q: "Can I get peptide therapy prescribed via telehealth?",
                a: "Yes. Many peptide therapy providers offer virtual consultations where a licensed prescriber evaluates your health history, orders necessary lab work, and prescribes peptides shipped directly to you from a compounding pharmacy.",
              },
              {
                q: "Do I need lab work before starting peptide therapy?",
                a: "Most providers require baseline labs before prescribing peptides. Lab orders can typically be completed at a local draw center like Quest or LabCorp. Some providers include the cost of labs in their consultation fee.",
              },
              {
                q: "How much does a telehealth peptide consultation cost?",
                a: "Initial consultations typically range from $100 to $350 depending on the provider and complexity. Some providers offer subscription models that include follow-up visits. The cost of peptides themselves varies by type and dosage.",
              },
              {
                q: "Is telehealth peptide therapy covered by insurance?",
                a: "Most peptide therapy is not covered by insurance, though the telehealth consultation itself may be covered under your plan. Some providers accept HSA/FSA accounts. Check with individual providers for payment options.",
              },
              {
                q: "Can a provider in another state prescribe peptides to me?",
                a: "Yes, as long as the provider is licensed in your state. Many telehealth providers hold licenses in multiple states. The provider must comply with the medical practice laws of the state where you are located during the visit.",
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
