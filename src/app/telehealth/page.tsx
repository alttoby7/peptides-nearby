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
  description: "Find telehealth peptide therapy providers licensed in your state. Browse virtual clinics offering BPC-157, semaglutide, sermorelin, and more via video visits.",
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

      {/* What telehealth providers can and can't do */}
      <section className="py-12">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="max-w-[700px]">
            <h2 className="font-display text-2xl text-text-primary mb-4">
              What Telehealth Providers Can (and Can&apos;t) Do
            </h2>
            <p className="text-sm text-text-secondary mb-3">
              Telehealth works well for GLP-1 therapy because the prescribing process is straightforward and monitoring relies heavily on patient-reported data. But it has real limits.
            </p>

            <h3 className="font-semibold text-text-primary mt-6 mb-2">What telehealth providers can do:</h3>
            <ul className="space-y-2 text-sm text-text-secondary mb-4">
              <li>Prescribe GLP-1 medications including semaglutide, tirzepatide, and liraglutide</li>
              <li>Adjust dosing based on your self-reported symptoms, side effects, and progress</li>
              <li>Order lab work through partner labs like Quest Diagnostics, Labcorp, or local options</li>
              <li>Prescribe anti-nausea and other supportive medications</li>
              <li>Provide nutritional guidance and scheduled follow-up check-ins</li>
            </ul>

            <h3 className="font-semibold text-text-primary mt-6 mb-2">What telehealth providers cannot do:</h3>
            <ul className="space-y-2 text-sm text-text-secondary mb-4">
              <li>Perform physical examinations</li>
              <li>Conduct body composition analysis such as DEXA scans or bioimpedance testing</li>
              <li>Administer in-office injections (you self-inject at home)</li>
              <li>Manage complex cases requiring hands-on monitoring, such as severe diabetes or cardiovascular conditions</li>
              <li>Accept most insurance plans (the majority are cash-pay)</li>
            </ul>

            <p className="text-sm text-text-secondary mb-3">
              This matters when choosing between telehealth and in-person care. If you are otherwise healthy and looking for straightforward GLP-1 prescribing with regular check-ins, telehealth handles it well. If you have multiple chronic conditions, unstable blood sugar, or a history of cardiovascular events, an in-person provider who can examine you and run on-site diagnostics is the safer path.
            </p>
          </div>
        </div>
      </section>

      {/* What telehealth peptide therapy costs */}
      <section className="py-12 bg-surface-0 border-y border-border-subtle">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="max-w-[700px]">
            <h2 className="font-display text-2xl text-text-primary mb-4">
              What Telehealth Peptide Therapy Costs
            </h2>
            <p className="text-sm text-text-secondary mb-3">
              Pricing for telehealth GLP-1 therapy falls into two buckets: compounded medication plans and brand-name medication plans.
            </p>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 text-text-tertiary font-medium">Cost Category</th>
                    <th className="text-left py-2 px-3 text-text-tertiary font-medium">Typical Range</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Monthly all-inclusive plan (compounded medication + consultation + shipping)</td>
                    <td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">$199-$399/mo</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Brand-name medication (Wegovy, Zepbound) via telehealth</td>
                    <td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">$1,200-$1,600/mo on top of consultation fees</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Lab work (if arranged separately)</td>
                    <td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">$100-$300</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Follow-up visits</td>
                    <td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Usually included in monthly subscription</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">In-person clinic comparison</td>
                    <td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">$400-$800/mo with brand-name medication</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-text-secondary mb-3">
              Most telehealth platforms operate on a cash-pay basis. Insurance coverage for GLP-1 medications through telehealth is rare, though many providers accept HSA and FSA payments.
            </p>
            <p className="text-sm text-text-secondary mb-3">
              The compounded medication route is where telehealth pricing gets competitive. An all-inclusive monthly plan at $199-$399 covers everything: the consultation, compounded semaglutide or tirzepatide, and shipping. That same treatment through an in-person clinic with brand-name medication can run $400-$800 per month or more.
            </p>
            <p className="text-sm text-text-secondary mb-3">
              One development worth tracking: the Medicare GLP-1 Bridge program launches in July 2026 with a $50 copay for Wegovy and Zepbound, which may shift the economics for patients who currently pay out of pocket.
            </p>
          </div>
        </div>
      </section>

      {/* How to choose a telehealth provider */}
      <section className="py-12">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="max-w-[700px]">
            <h2 className="font-display text-2xl text-text-primary mb-4">
              How to Choose a Telehealth Provider
            </h2>
            <p className="text-sm text-text-secondary mb-3">
              Not all telehealth peptide providers operate at the same standard. The barrier to entry for launching a telehealth weight loss clinic is low, and patient outcomes vary widely depending on the provider behind the platform. These seven questions will separate serious medical practices from glorified prescription mills.
            </p>

            <h3 className="font-semibold text-text-primary mt-6 mb-2">Questions to ask before signing up:</h3>
            <ol className="space-y-3 text-sm text-text-secondary mb-4">
              <li><strong>1. Is your prescriber licensed in my state?</strong> This is non-negotiable. If they cannot answer immediately, move on.</li>
              <li><strong>2. Which compounding pharmacy do you use? Is it 503A or 503B registered?</strong> A legitimate provider knows their pharmacy&apos;s registration status without checking.</li>
              <li><strong>3. What labs do you require, and where do I complete them?</strong> Providers who skip labs entirely are cutting corners on your safety.</li>
              <li><strong>4. What is your protocol for managing side effects?</strong> You want same-day messaging with a licensed clinician, not a chatbot or a 48-hour email queue.</li>
              <li><strong>5. What happens if I need to switch medications or adjust my dose?</strong> Good providers build dose titration into the program. Bad ones make you schedule a new paid consultation.</li>
              <li><strong>6. Do you offer both semaglutide and tirzepatide?</strong> Having options matters if one medication causes side effects you cannot tolerate.</li>
              <li><strong>7. What does the monthly fee include?</strong> Get a clear answer covering medication, consultations, lab orders, and shipping. Hidden fees are common.</li>
            </ol>

            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mt-4">
              <h3 className="font-semibold text-text-primary mb-2">Red flags to watch for:</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>No lab work offered or required at any point in treatment</li>
                <li>Cannot name their compounding pharmacy or its registration status</li>
                <li>No licensed prescriber on staff, only &quot;wellness coaches&quot; or &quot;health advisors&quot;</li>
                <li>Guaranteed weight loss claims (no ethical provider guarantees outcomes)</li>
                <li>Pressure to commit to 6-month or 12-month contracts before your first dose</li>
                <li>No clear cancellation policy or refund terms</li>
              </ul>
            </div>
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
          <div className="max-w-[700px]">
            <h2 className="font-display text-2xl text-text-primary mb-4">
              Licensing, Labs, and What Your State Requires
            </h2>
            <p className="text-sm text-text-secondary mb-3">
              <strong>Licensing is non-negotiable.</strong> A provider must hold an active license in your state to prescribe medication to you via telehealth. The provider&apos;s physical location is irrelevant. What matters is where you are sitting during the consultation and where the medication ships.
            </p>
            <p className="text-sm text-text-secondary mb-3">
              State rules around telehealth prescribing vary significantly. Some states require an initial in-person visit before a provider can prescribe remotely. Others adopted permanent telehealth-only flexibilities after COVID-era regulations proved that remote prescribing worked safely at scale. The patchwork is real, and it changes as state legislatures update their telehealth statutes. What was true six months ago may not apply today.
            </p>
            <p className="text-sm text-text-secondary mb-3">
              <strong>Lab work</strong> is not technically required for GLP-1 prescribing. But best-practice clinics order baseline labs before starting treatment: a comprehensive metabolic panel (CMP), A1C, thyroid panel, and lipid panel. Telehealth providers typically send a lab order to Quest or Labcorp for you to complete at a location near you. If labs are not included in your plan, expect to pay $100-$300 out of pocket.
            </p>
            <p className="text-sm text-text-secondary mb-3">
              <strong>Compounding pharmacy rules</strong> add another layer. Some states restrict out-of-state compounding pharmacies from shipping medications in. Before you sign up with any telehealth provider, ask which pharmacy they use and confirm it can ship to your address.
            </p>
            <p className="text-sm text-text-secondary mb-3">
              <strong>Controlled substance classification</strong> simplifies things for GLP-1 patients. Semaglutide and tirzepatide are not controlled substances, so telehealth prescribing faces fewer restrictions. This is different from testosterone or HGH, which carry stricter telehealth prescribing rules in many states.
            </p>
            <p className="text-sm text-text-secondary mb-3">
              Our <Link href="/telehealth">state-level telehealth pages</Link> list providers licensed to treat patients in each state so you can filter by where you actually live.
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
                q: "Can a telehealth provider prescribe peptide therapy if they’re in a different state?",
                a: "Yes, as long as the provider holds an active license in your state. The provider’s physical location does not matter. What matters is where you, the patient, are located during the consultation and where the medication ships. A prescriber sitting in California can treat a patient in Ohio if they carry an Ohio medical license.",
              },
              {
                q: "Do I need to see a doctor in person before starting telehealth GLP-1 therapy?",
                a: "In most states, no. Post-COVID telehealth flexibilities allow many providers to prescribe after a video consultation alone. A few states still require an initial in-person visit before remote prescribing. Check your state’s current telehealth prescribing rules, or browse our state pages to see which providers serve your area.",
              },
              {
                q: "How is medication delivered with telehealth programs?",
                a: "Most telehealth providers ship medication directly to your home from their partnered compounding pharmacy. Delivery typically takes 3-5 business days after your prescription is approved. Medications that require cold storage arrive in temperature-controlled packaging.",
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
