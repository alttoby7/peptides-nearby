import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviderBySlug } from "@/lib/data/providers";
import { canonical } from "@/lib/seo/canonical";
import { goalUrl } from "@/lib/seo/paths";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { FilteredProviderList } from "@/components/filters/ProviderFilters";
import goalsData from "@/lib/data/goals.json";

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface GoalEntry {
  slug: string;
  name: string;
  description: string;
  peptides: string[];
  providerCount: number;
  providerSlugs: string[];
  indexed: boolean;
}

const goals: GoalEntry[] = goalsData as GoalEntry[];

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  const params = goals.map((g) => ({ slug: g.slug }));
  if (params.length === 0) return [{ slug: "_" }];
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const goal = goals.find((g) => g.slug === slug);
  if (!goal) return {};
  const thin = !goal.indexed;
  return {
    title: `${goal.name} Peptide Therapy${goal.providerCount > 0 ? ` — ${goal.providerCount} Providers` : ""}`,
    description: `${goal.description} Find ${goal.providerCount} providers offering peptide therapy for ${goal.name.toLowerCase()}.`,
    robots: thin ? { index: false, follow: true } : undefined,
    alternates: { canonical: canonical(goalUrl(slug)) },
  };
}

export default async function GoalPage({ params }: Props) {
  const { slug } = await params;
  const goal = goals.find((g) => g.slug === slug);
  if (!goal) notFound();

  const providers = goal.providerSlugs
    .map((s) => getProviderBySlug(s))
    .filter((p) => p !== undefined);

  const BASE = "https://www.peptidesnearby.com";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: BASE },
        { name: goal.name, url: `${BASE}/goals/${slug}` },
      ])} />

      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <nav className="text-sm text-text-tertiary mb-6">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary">{goal.name}</span>
          </nav>

          <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-2">
            {goal.name} Peptide Therapy
          </h1>
          <p className="text-text-secondary mb-6 max-w-[700px]">
            {goal.description}
          </p>

          {/* Related peptides */}
          {goal.peptides.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-3">
                Common Peptides for {goal.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {goal.peptides.map((p) => (
                  <Link
                    key={p}
                    href={`/peptides/${slugify(p)}`}
                    className="text-sm px-3 py-1.5 bg-accent-dim text-accent rounded-lg hover:bg-accent/20 transition-colors"
                  >
                    {p}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* editorial content for weight-loss */}
          {slug === "weight-loss" && (
            <div className="mb-10">
              <p className="text-text-secondary mb-4 max-w-[700px]">
                <strong>Weight loss peptide therapy</strong> at most clinics means one thing: GLP-1 receptor agonists. Semaglutide and tirzepatide are FDA-approved medications prescribed by licensed physicians, nurse practitioners, and physician assistants. They are not gray-market research peptides.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                This page covers how these medications work, how they compare, what programs actually cost, and how to evaluate a provider before you book. The directory below lists clinics and telehealth providers tagged for weight loss in your area.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                If you already know what you want, scroll down to the provider list. If you want to understand your options first, keep reading.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">What Are GLP-1 Weight Loss Medications?</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                GLP-1 receptor agonists mimic a gut hormone called glucagon-like peptide-1. They slow gastric emptying so food stays in your stomach longer, reduce appetite by acting on brain receptors that control hunger, and improve insulin sensitivity. The result: you eat less, feel full sooner, and your body processes glucose more efficiently.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Three GLP-1 medications are commonly prescribed at weight loss clinics:
              </p>
              <ul className="space-y-2 text-sm text-text-secondary max-w-[700px] mb-6">
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>Semaglutide</strong> (brand names Wegovy for weight loss, Ozempic for type 2 diabetes). Weekly subcutaneous injection. FDA-approved for chronic weight management in adults with BMI 30+ or BMI 27+ with a weight-related condition.</span></li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>Tirzepatide</strong> (brand names Zepbound for weight loss, Mounjaro for type 2 diabetes). Weekly subcutaneous injection. A dual-agonist targeting both GLP-1 and GIP receptors.</span></li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>Liraglutide</strong> (brand name Saxenda for weight loss, Victoza for diabetes). Daily injection. Less commonly prescribed now due to lower efficacy compared to semaglutide and tirzepatide.</span></li>
              </ul>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Compounded versions of semaglutide and tirzepatide are available from licensed 503A and 503B pharmacies at significantly lower cost. However, the FDA has tightened access to compounded GLP-1s as brand-name shortages resolve. Availability varies by state and by month.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Retatrutide, a triple-agonist targeting GLP-1, GIP, and glucagon receptors, is in late-stage clinical trials. Phase 2 data showed up to 24% body weight loss over 48 weeks. It is not yet FDA-approved and is not available through legitimate clinics.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Semaglutide vs Tirzepatide: How They Compare</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Both medications are effective. Tirzepatide produces more average weight loss in clinical trials, but individual response varies. Some patients respond better to semaglutide, and the only way to know is to work with a prescriber who offers both.
              </p>
              <div className="overflow-x-auto mb-6 max-w-[700px]"><table className="w-full text-sm border-collapse">
                <thead><tr className="border-b border-border-subtle">
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Factor</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Semaglutide</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Tirzepatide</th>
                </tr></thead>
                <tbody>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Mechanism</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">GLP-1 only</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">GLP-1 + GIP (dual agonist)</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Avg weight loss (trials)</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">14.9% body weight (STEP 1, 68 weeks)</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">22.5% body weight (SURMOUNT-1, 72 weeks)</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Head-to-head (SURMOUNT-5)</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">13.7%</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">20.2%</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Brand names</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Wegovy (weight loss), Ozempic (diabetes)</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Zepbound (weight loss), Mounjaro (diabetes)</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Brand cost (monthly)</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">$1,200-$1,600</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">$1,200-$1,600</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Compounded cost (monthly)</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">$200-$400</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">$250-$500</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Common side effects</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Nausea (18%), diarrhea, vomiting</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Nausea (17-22%), diarrhea, vomiting</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Dosing</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Weekly injection, starts 0.25mg, max 2.4mg</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Weekly injection, starts 2.5mg, max 15mg</td></tr>
                </tbody>
              </table></div>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The SURMOUNT-5 trial was the first head-to-head comparison. At the highest doses, tirzepatide patients lost 20.2% of body weight versus 13.7% for semaglutide over 72 weeks. That gap is significant in aggregate, but individual results can differ by 10 percentage points or more in either direction.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Cost is a factor. Brand-name pricing is similar for both, but compounded tirzepatide typically runs $50-$100 more per month than compounded semaglutide. If your provider offers both, discuss which medication fits your medical history, budget, and goals.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Insurance coverage is expanding but still limited. Medicare Part D will begin covering GLP-1s for obesity in July 2026 through the GLP-1 Bridge program with a $50 monthly copay. As of early 2026, only 13 states cover GLP-1s for obesity under Medicaid.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                For more detail on each medication, see our <Link href="/peptides/semaglutide">semaglutide</Link> and <Link href="/peptides/tirzepatide">tirzepatide</Link> pages.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Telehealth vs In-Person GLP-1 Clinics</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                How you access GLP-1 therapy matters as much as which medication you take. Telehealth and in-person clinics differ in cost, speed, monitoring, and outcomes.
              </p>
              <div className="overflow-x-auto mb-6 max-w-[700px]"><table className="w-full text-sm border-collapse">
                <thead><tr className="border-b border-border-subtle">
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Factor</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Telehealth</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">In-Person</th>
                </tr></thead>
                <tbody>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Monthly cost</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">$199-$399 (often all-inclusive)</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">$400-$800 (plus separate medication)</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Time to start</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">1-3 days</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">2-6 weeks</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Insurance</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Limited, mostly cash-pay</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Most major plans accepted</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Monitoring</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Virtual check-ins, self-reported metrics</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Labs, body composition, physical exam</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Medication options</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Brand + compounded</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Mostly brand only</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Side effect support</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Messaging/scheduled calls</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Same-day appointments</td></tr>
                </tbody>
              </table></div>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The convenience and cost advantages of telehealth are real, but so are the limitations. A Cleveland Clinic real-world analysis of roughly 8,000 patients found that about 50% discontinued GLP-1 therapy within 12 months. In supervised clinical trials with structured follow-up, dropout rates were 14-17%. The gap suggests that ongoing support and accountability improve adherence.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Real-world weight loss also trails clinical trial results. Semaglutide patients average about 8% body weight loss in real-world studies versus 15% in trials. Tirzepatide patients average about 12% versus 15-20% in trials. Structured programs with regular check-ins close that gap.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Telehealth providers must be licensed in the patient&apos;s state. Verify this before signing up. Some national platforms hold licenses in all 50 states. Others cover 30-40 states and may not serve yours.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The best outcomes combine medication with behavioral support. Whether that comes from a telehealth app with weekly coaching or an in-person clinic with dietitian access, the structure matters more than the delivery method.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                <strong>When in-person is the better fit:</strong> You have a complex medical history, diabetes requiring close monitoring, or you want regular lab work and body composition tracking as part of your program. Patients on multiple medications benefit from a provider who can coordinate care with their existing doctors.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                <strong>When telehealth makes more sense:</strong> You are cost-conscious, there are no local weight loss specialists nearby, or your schedule makes recurring office visits difficult. Telehealth also tends to offer faster access to compounded medications.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Our <Link href="/telehealth">telehealth</Link> pages list providers by the states they serve.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">What GLP-1 Weight Loss Programs Actually Cost</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The sticker shock is real. Here is what each component actually costs:
              </p>
              <ul className="space-y-2 text-sm text-text-secondary max-w-[700px] mb-6">
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>Brand-name medication:</strong> $1,200-$1,600/month without insurance. This is the retail price for Wegovy, Zepbound, and their diabetes-labeled equivalents.</span></li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>Compounded medication:</strong> $200-$500/month from a licensed 503A or 503B pharmacy. Price depends on the medication, dose, and pharmacy.</span></li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>Consultation fees:</strong> $200-$400 for an initial visit, $100-$200 for follow-ups at in-person clinics. Telehealth subscriptions typically bundle consultations into the monthly fee.</span></li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>Lab work:</strong> $100-$300 if not included. Standard panels are a comprehensive metabolic panel, lipid panel, A1C, and TSH.</span></li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>Hidden costs to ask about:</strong> Shipping fees for medication, supplement upsells packaged as &ldquo;required,&rdquo; and follow-up visits billed separately from the quoted monthly price.</span></li>
              </ul>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Most commercial insurance plans do not cover GLP-1s for obesity, only for type 2 diabetes. The Medicare GLP-1 Bridge program launches in July 2026 with a $50 monthly copay for eligible beneficiaries. HSA and FSA funds are eligible for GLP-1 therapy at most providers.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Before committing, ask for an itemized breakdown. The total monthly cost should include medication, consultations, lab orders, and dose adjustments. If a provider quotes only the medication price, add $100-$200/month for the visits and monitoring that make the program safe and effective.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                <strong>Rule of thumb:</strong> Budget $250-$500/month for a compounded telehealth program. Budget $500-$1,000/month for a brand-name in-person program with labs and follow-ups included.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">How to Vet a GLP-1 Clinic Before You Book</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Not all weight loss clinics operate the same way. Before you hand over your credit card, run through this checklist:
              </p>
              <ol className="space-y-4 text-sm text-text-secondary max-w-[700px] mb-6">
                <li><strong>1. Is the prescriber a licensed MD, DO, NP, or PA?</strong><br />Look them up on your state medical board&apos;s verification site. This takes two minutes and eliminates the worst actors immediately.</li>
                <li><strong>2. Do they require lab work before prescribing?</strong><br />A provider who prescribes GLP-1s without reviewing any bloodwork is cutting corners. At minimum, expect a comprehensive metabolic panel, thyroid function, and A1C. These labs rule out contraindications and establish a baseline.</li>
                <li><strong>3. What is included in the monthly cost?</strong><br />Get a straight answer. Does the price cover medication, follow-up visits, lab orders, and dose adjustments? Or is it just the prescription with everything else billed separately?</li>
                <li><strong>4. Do they offer both semaglutide and tirzepatide?</strong><br />Clinics that offer only one medication have less flexibility to adjust your treatment. If you plateau or experience side effects, switching medications is a proven strategy that requires a provider who carries both.</li>
                <li><strong>5. What happens when you reach your goal weight?</strong><br />This is the question most patients forget to ask. STEP 1 extension data showed that roughly two-thirds of lost weight returned within a year of stopping semaglutide. A responsible clinic has a maintenance protocol, whether that is a reduced dose, lifestyle programming, or a structured taper.</li>
                <li><strong>6. Is the compounding pharmacy 503A or 503B registered?</strong><br />Ask for the pharmacy name and verify it. If the clinic will not name their pharmacy, that is a red flag.</li>
                <li><strong>7. How do they handle side effects?</strong><br />Nausea, constipation, and injection site reactions are common, especially during dose escalation. Ask whether you can message a provider the same day or if you are told to call 911.</li>
              </ol>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                <strong>Red flags to walk away from:</strong> No medical screening required before prescribing. Pressure to purchase supplements or add-ons. Identical dosing protocols for every patient regardless of weight or history. Refusal to name their compounding pharmacy. Promises of specific weight loss numbers like &ldquo;lose 30 pounds in 30 days.&rdquo; Any clinic guaranteeing results is selling marketing, not medicine.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Frequently Asked Questions</h2>

              <h3 className="font-semibold text-text-primary mt-6 mb-2">Do I need lab work before starting GLP-1 therapy?</h3>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Not technically required, but best practice. Most physicians order a comprehensive metabolic panel, lipid panel, A1C, and thyroid function before prescribing. Cost runs $100-$300 if not included in your program. Many in-person clinics include labs in the initial visit fee. Telehealth providers may require you to arrange your own through a local lab.
              </p>

              <h3 className="font-semibold text-text-primary mt-6 mb-2">Can I switch from telehealth to in-person care (or vice versa)?</h3>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Yes, and it happens often. Patients switch when they hit a plateau, want more hands-on monitoring, or need to reduce costs. Your new provider will need your medical history, current dosing, and treatment response. Expect a titration adjustment period while the new provider evaluates your progress.
              </p>

              <h3 className="font-semibold text-text-primary mt-6 mb-2">How quickly will I see weight loss results?</h3>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Most patients notice reduced appetite within 2-4 weeks of starting therapy. Measurable weight loss typically appears by weeks 4-8 as the dose increases through the titration schedule. Clinical trial averages: 14.9% body weight loss on semaglutide over 68 weeks, up to 22.5% on tirzepatide over 72 weeks. Your prescriber can set realistic expectations based on your starting point.
              </p>
            </div>
          )}
          {/* end editorial content for weight-loss */}

          <h2 className="font-semibold text-text-primary mb-4">
            {providers.length} {providers.length === 1 ? "Provider" : "Providers"}
          </h2>

          {providers.length > 0 ? (
            <FilteredProviderList providers={providers} />
          ) : (
            <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
              <p className="text-text-secondary mb-4">
                No providers tagged for {goal.name.toLowerCase()} yet. Try searching by specific peptides above.
              </p>
              <Link href="/states" className="inline-block px-5 py-2.5 bg-accent text-white font-semibold rounded-lg">
                Browse All Providers
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
