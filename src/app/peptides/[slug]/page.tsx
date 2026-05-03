import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllServices, getServiceBySlug } from "@/lib/data/services";
import { getProvidersByService } from "@/lib/data/providers";
import { canonical } from "@/lib/seo/canonical";
import { peptideUrl } from "@/lib/seo/paths";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { FilteredProviderList } from "@/components/filters/ProviderFilters";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllServices().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  const thin = !service.indexed;
  const titleCount = service.providerCount > 0 ? ` — ${service.providerCount} Providers` : "";
  return {
    title: `Find ${service.name}${service.name.toLowerCase().includes("therapy") ? "" : " Therapy"} Near You${titleCount}`,
    description: service.providerCount > 0
      ? `${service.description} Browse ${service.providerCount} providers offering ${service.name} in ${service.cityCount} cities.`
      : service.description,
    robots: thin ? { index: false, follow: true } : undefined,
    alternates: { canonical: canonical(peptideUrl(slug)) },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const providers = getProvidersByService(slug);
  const BASE = "https://www.peptidesnearby.com";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: BASE },
        { name: service.name, url: `${BASE}/peptides/${slug}` },
      ])} />

      <section className="pt-12 pb-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <nav className="text-sm text-text-tertiary mb-6">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-text-secondary">{service.name}</span>
          </nav>

          <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-2">
            Find {service.name}{service.name.toLowerCase().includes("therapy") ? "" : " Therapy"} Near You
          </h1>
          <p className="text-text-secondary mb-8 max-w-[700px]">
            {service.description}
          </p>

          {/* editorial content for semaglutide */}
          {slug === "semaglutide" && (
            <div className="mb-10">
              <p className="text-text-secondary mb-4 max-w-[700px]">
                <strong>Semaglutide</strong> is a GLP-1 receptor agonist prescribed for weight loss and type 2 diabetes management. It is FDA-approved under multiple brand names: Wegovy (weight loss), Ozempic (diabetes), Rybelsus (oral, diabetes), and Wegovy HD (the 7.2mg higher-dose formulation approved in 2026). The directory below lists providers who offer semaglutide in your area.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">What Semaglutide Is and How It Works</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Semaglutide is a synthetic version of GLP-1, a gut hormone your body releases after eating. It works through three mechanisms: it slows gastric emptying so food stays in your stomach longer, reduces appetite by acting on hunger centers in the brain, and improves insulin sensitivity.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The medication is available as a once-weekly subcutaneous injection (Wegovy, Ozempic) or a daily oral tablet (Rybelsus, and oral Wegovy 25mg approved January 2026). This is not a cosmetic weight loss drug. The FDA approved it for adults with a BMI of 30 or higher, or a BMI of 27 or higher with at least one weight-related condition such as hypertension, type 2 diabetes, or high cholesterol.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">FDA-Approved Forms</h2>
              <div className="overflow-x-auto mb-6 max-w-[700px]"><table className="w-full text-sm border-collapse">
                <thead><tr className="border-b border-border-subtle">
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Brand</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Indication</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Form</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Max Dose</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Approved</th>
                </tr></thead>
                <tbody>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Wegovy</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Weight loss</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Weekly injection</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">2.4mg (HD: 7.2mg)</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">2021 (HD: 2026)</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Ozempic</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Type 2 diabetes</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Weekly injection</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">2.0mg</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">2017</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Rybelsus</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Type 2 diabetes</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Daily tablet</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">14mg</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">2019</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Wegovy (oral)</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Weight loss + CV risk</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Daily tablet</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">25mg</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">2026</td></tr>
                </tbody>
              </table></div>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Ozempic is frequently prescribed off-label for weight loss. Rybelsus and oral Wegovy are separate formulations at different doses.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Dosing and Titration</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                For the injection, semaglutide starts at 0.25mg weekly and increases every four weeks: 0.25mg, 0.5mg, 1.0mg, 1.7mg, then 2.4mg. The full ramp takes 16 to 20 weeks. Wegovy HD extends to 7.2mg for patients who need additional weight loss beyond the standard 2.4mg dose.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                For oral forms, Rybelsus titrates from 3mg to 7mg to 14mg. Oral Wegovy ramps to 25mg.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The slow titration exists for a reason. It minimizes GI side effects. Skipping dose steps significantly increases nausea risk. More than half of patients find their optimal dose below the maximum. The goal is not reaching 2.4mg. It is finding the dose that works with acceptable side effects.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Oral semaglutide must be taken on an empty stomach with a small amount of water. The injection can be administered any time of day.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Clinical Trial Results</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The evidence base for semaglutide is extensive across multiple large-scale trials.
              </p>
              <ul className="space-y-2 text-sm text-text-secondary max-w-[700px] mb-6">
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>STEP 1 (2021, NEJM):</strong> 1,961 adults over 68 weeks. Semaglutide 2.4mg produced 14.9% average body weight loss versus 2.4% with placebo. 86% of participants achieved at least 5% weight loss.</span></li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>STEP UP (2025):</strong> Oral semaglutide 25mg produced 18.7% mean weight loss versus 3.9% with placebo at 72 weeks. 31.2% achieved 25% or greater weight reduction, demonstrating that the oral formulation can match injection efficacy.</span></li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>SELECT trial (2023):</strong> Semaglutide reduced the risk of major adverse cardiovascular events by 20% in adults with obesity and established cardiovascular disease. This led to FDA approval of Wegovy for cardiovascular risk reduction in March 2024.</span></li>
              </ul>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Real-world results differ from trial results. Cleveland Clinic data shows real-world patients average roughly 8% weight loss on semaglutide versus 15% in trials. The gap is primarily due to lower adherence and less structured support outside clinical settings.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Weight regain is a documented concern. STEP 1 extension data showed roughly two-thirds of lost weight returned within one year of stopping semaglutide. This is why ongoing treatment and maintenance planning matters. Discuss a long-term plan with your provider before starting.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Side Effects and Safety</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The most common side effects are gastrointestinal. In the STEP 1 titration phase, 44% of participants reported nausea. Vomiting, diarrhea, constipation, and abdominal pain were also common.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                GI side effects are worst during dose escalation and typically improve within two to four weeks at each dose level. Most patients find them manageable once they reach a stable dose.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Semaglutide carries a boxed warning: thyroid C-cell tumors were observed in rodent studies, though this has not been confirmed in humans. It is contraindicated in patients with a personal or family history of medullary thyroid carcinoma or MEN type 2 syndrome. Other risks include pancreatitis, gallbladder disease, and hypoglycemia when combined with insulin or sulfonylureas.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Muscle loss deserves attention. UC Davis research indicates that 15-25% of weight lost on GLP-1 receptor agonists can be lean muscle mass without dietary protein optimization and resistance exercise. Your provider should discuss protein intake and strength training as part of your treatment plan.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Management during titration: eat slowly, choose smaller meals, stay hydrated, and avoid high-fat foods. Your provider can adjust the titration pace or prescribe anti-nausea medication if side effects are severe.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Cost and Insurance</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Brand-name Wegovy runs $1,300 to $1,600 per month without insurance. Compounded semaglutide from licensed 503A and 503B pharmacies costs $200 to $400 per month, though availability is tightening as the FDA resolves brand-name shortages.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Insurance coverage is expanding but inconsistent. Most commercial plans cover semaglutide for diabetes (Ozempic) but fewer cover it for obesity (Wegovy). Medicare Part D GLP-1 Bridge launches in July 2026 with a $50 monthly copay for eligible beneficiaries.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                GLP-1 therapy is HSA and FSA eligible at most providers. Manufacturer savings cards are available for commercially insured patients with potential savings up to $1,800 annually.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                When budgeting for total program cost, factor in consultation fees ($200 to $400 for an initial visit), lab work ($100 to $300), and follow-up visits ($100 to $200 each). These costs add up beyond the medication price.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">How to Find a Semaglutide Provider</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Browse the directory below to find providers offering semaglutide near you. Filter by city or state to narrow your results.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Questions to ask a potential provider: Do you prescribe brand-name semaglutide, compounded, or both? What is included in the monthly cost? Do you require baseline labs? What is your titration protocol? What happens when I reach my goal weight?
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Many semaglutide providers offer virtual consultations. See our <Link href="/telehealth">telehealth providers</Link> page for options that serve your state. For a broader look at weight management programs, visit our <Link href="/goals/weight-loss">Weight Loss Peptide Therapy</Link> guide.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Frequently Asked Questions</h2>

              <h3 className="font-semibold text-text-primary mt-6 mb-2">Is semaglutide the same as Ozempic?</h3>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Semaglutide is the active ingredient. Ozempic is one brand name, approved for type 2 diabetes. Wegovy is the same molecule at a higher dose, approved specifically for weight loss. Different brand, same medication, different indication and dosing.
              </p>

              <h3 className="font-semibold text-text-primary mt-6 mb-2">How long does it take for semaglutide to work?</h3>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Most patients notice reduced appetite within two to four weeks. Measurable weight loss typically appears by weeks four to eight as the dose titrates upward. Full effect at maintenance dose takes three to six months.
              </p>

              <h3 className="font-semibold text-text-primary mt-6 mb-2">Can I take semaglutide as a pill instead of an injection?</h3>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Yes. The FDA approved oral semaglutide (Wegovy 25mg tablet) for weight loss in January 2026. Previously, oral semaglutide was only available as Rybelsus for diabetes at lower doses. The STEP UP trial showed the 25mg oral dose produces weight loss comparable to the injection.
              </p>
            </div>
          )}
          {/* end editorial content for semaglutide */}

          {/* editorial content for tirzepatide */}
          {slug === "tirzepatide" && (
            <div className="mb-10">
              <p className="text-text-secondary mb-4 max-w-[700px]">
                <strong>Tirzepatide</strong> is a dual GLP-1/GIP receptor agonist prescribed for weight loss and type 2 diabetes. It is the first medication to target both incretin receptors, earning the label &ldquo;twincretin.&rdquo; The FDA approved it as Zepbound for weight loss and Mounjaro for type 2 diabetes. In head-to-head clinical trials, tirzepatide produced more average weight loss than semaglutide. The directory below lists providers who offer tirzepatide in your area.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">What Tirzepatide Is and How It Works</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Tirzepatide was engineered from the native GIP peptide sequence, with added GLP-1 agonist activity built in. That dual mechanism is what sets it apart from semaglutide, which only targets GLP-1.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The GLP-1 side does what you would expect: it slows gastric emptying and reduces appetite. The GIP side adds synergistic effects that go beyond appetite suppression. GIP activation preferentially mobilizes visceral fat, improves insulin sensitivity independent of caloric deficit, and amplifies insulin secretion beyond what GLP-1 achieves alone.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                MRI-based substudies from the SURMOUNT trials measured the difference directly. At 72 weeks on the 15mg dose, participants saw visceral fat reduction of 32-38%, compared to 18-22% subcutaneous fat reduction. That differential effect is mechanistically distinct from caloric restriction alone. Your body is not just losing weight. It is losing the most metabolically dangerous fat first.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Tirzepatide is a once-weekly subcutaneous injection. No oral form is available, unlike semaglutide which has a tablet option (Rybelsus). The FDA approved it for adults with BMI 30 or higher, or BMI 27 or higher with at least one weight-related condition.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">FDA-Approved Forms</h2>
              <div className="overflow-x-auto mb-6 max-w-[700px]"><table className="w-full text-sm border-collapse">
                <thead><tr className="border-b border-border-subtle">
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Brand</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Indication</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Form</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Max Dose</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Approved</th>
                </tr></thead>
                <tbody>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Zepbound</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Weight loss</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Weekly injection</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">15mg</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">2023</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Mounjaro</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Type 2 diabetes</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Weekly injection</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">15mg</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">2022</td></tr>
                </tbody>
              </table></div>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Mounjaro is frequently prescribed off-label for weight loss, similar to how Ozempic (semaglutide) is used. No oral form or higher-dose version is available yet, though Eli Lilly has pipeline formulations in development.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Dosing and Titration</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Tirzepatide starts at 2.5mg weekly. This is a tolerability dose, not a therapeutic one.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The standard titration increases by 2.5mg every 4 weeks: 2.5, then 5, 7.5, 10, 12.5, and finally 15mg. A full ramp to the maximum dose takes 20-24 weeks.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                There are three official maintenance doses: 5mg, 10mg, and 15mg. Unlike semaglutide, which has one target dose, tirzepatide offers flexibility to stop at the dose that balances efficacy and tolerability for you.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Weight loss becomes meaningful at 5mg and increases substantially at 10mg and 15mg. The 2.5mg starting dose is for acclimation only. If a provider starts you above 2.5mg, ask why.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Administer via single-use pen (KwikPen). Injection sites include the abdomen, thigh, or upper arm. Rotate injection sites each week.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Clinical Trial Results</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The SURMOUNT program is the largest clinical trial series for tirzepatide in weight management. Here are the key results.
              </p>
              <ul className="space-y-2 text-sm text-text-secondary max-w-[700px] mb-6">
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>SURMOUNT-1 (2022, NEJM):</strong> 2,539 adults without diabetes over 72 weeks. Tirzepatide at 15mg produced 22.5% mean body weight loss. At 10mg: 19.5%. At 5mg: 15.0%. Placebo: 3.1%. Among patients on the 15mg dose, 91% achieved at least 5% weight loss and 57% achieved 20% or more.</span></li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>SURMOUNT-2 (2023):</strong> Adults with type 2 diabetes and obesity. The 15mg dose produced 14.7% weight loss. Diabetes blunts the weight loss response compared to non-diabetic patients, which is consistent across GLP-1 medications.</span></li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>SURMOUNT-5 (2025, NEJM):</strong> The first head-to-head comparison against semaglutide. Over 72 weeks, tirzepatide 15mg produced 20.2% weight loss versus 13.7% for semaglutide 2.4mg. That is a 6.5 percentage point advantage, and tirzepatide was statistically superior.</span></li>
              </ul>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                These are averages. Individual response varies by 10 or more percentage points in either direction. Some patients respond better to semaglutide for reasons not fully understood.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                <strong>Visceral fat:</strong> MRI substudies showed tirzepatide reduced visceral adipose tissue by 32-38% at 72 weeks, more than the 18-22% reduction in subcutaneous fat. This preferential visceral fat reduction has metabolic significance beyond cosmetic weight change.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                <strong>Cardiovascular outcomes:</strong> The SURPASS-CVOT trial is studying cardiovascular outcomes. Early data is promising, but tirzepatide is not yet FDA-label approved for CV risk reduction (unlike semaglutide/Wegovy).
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                <strong>Weight regain:</strong> Like semaglutide, weight regain occurs after discontinuation. SURMOUNT-4 showed patients who switched from tirzepatide to placebo regained approximately half of lost weight over 52 weeks.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Side Effects and Safety</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The most common side effects are gastrointestinal: nausea (17-22% across doses), diarrhea (13-16%), vomiting (6-10%), constipation, and injection site reactions. Side effects are comparable to semaglutide. The dual mechanism does not significantly increase GI side effect rates.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                GI symptoms peak during dose escalation and typically improve within 2-4 weeks at each dose level. Approximately 5-8% of clinical trial participants discontinued due to adverse effects.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Tirzepatide carries a boxed warning for thyroid C-cell tumors observed in rodent studies (same as semaglutide). It is contraindicated in patients with a history of medullary thyroid carcinoma or MEN type 2. Other risks include pancreatitis, gallbladder disease, and hypoglycemia when combined with insulin or sulfonylureas.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Muscle preservation is a real concern. Without adequate protein intake and resistance exercise, 15-25% of weight lost can be lean mass. Discuss a muscle-preservation protocol with your provider.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                For managing side effects: eat slowly, choose smaller meals, and stay hydrated. If nausea is severe, your provider can slow the titration schedule or add anti-nausea medication.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Cost and Insurance</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Brand-name Zepbound runs $1,200-$1,600 per month without insurance. Compounded tirzepatide from licensed 503A/503B pharmacies typically costs $250-$500 per month, usually $50-$100 more than compounded semaglutide.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The FDA has been tightening compounded GLP-1 availability. As brand shortages resolve, compounded access becomes more legally restricted. Confirm with your provider that their pharmacy source is currently compliant.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Insurance coverage varies. Mounjaro is more widely covered than Zepbound. Some providers prescribe Mounjaro off-label for weight loss to access better insurance coverage. Zepbound coverage for obesity depends on your plan.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Medicare Part D GLP-1 Bridge launches July 2026 with a $50 copay for eligible beneficiaries. HSA and FSA funds are eligible at most providers. Eli Lilly offers a Zepbound savings card where eligible commercially insured patients may pay as little as $25 per month.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Budget ranges: $300-$550 per month for compounded telehealth programs, $600-$1,200 for brand-name in-person programs with labs and monitoring.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">How to Find a Tirzepatide Provider</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Browse the directory below for providers offering tirzepatide near you.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Tirzepatide is newer than semaglutide, so fewer providers carry it. If your local options are limited, consider telehealth. See our <Link href="/telehealth">telehealth providers</Link> page for nationwide options.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Questions to ask your provider:
              </p>
              <ul className="space-y-2 text-sm text-text-secondary max-w-[700px] mb-6">
                <li>Do you offer tirzepatide specifically (not just semaglutide)?</li>
                <li>Brand-name, compounded, or both?</li>
                <li>What dose will you start me at?</li>
                <li>What happens if I need to switch to semaglutide?</li>
              </ul>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Also see: <Link href="/goals/weight-loss">Weight Loss Peptide Therapy</Link> for a complete GLP-1 clinic evaluation guide. And: <Link href="/peptides/semaglutide">Semaglutide</Link> for comparison.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Frequently Asked Questions</h2>

              <h3 className="font-semibold text-text-primary mt-6 mb-2">Is tirzepatide better than semaglutide for weight loss?</h3>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                On average, yes. SURMOUNT-5 showed tirzepatide 15mg produced 20.2% weight loss vs 13.7% for semaglutide 2.4mg over 72 weeks. But individual response varies significantly. Some patients achieve better results with semaglutide. The best choice depends on your medical history, tolerance, budget, and provider availability.
              </p>

              <h3 className="font-semibold text-text-primary mt-6 mb-2">What is the difference between Mounjaro and Zepbound?</h3>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Same active ingredient (tirzepatide), same manufacturer (Eli Lilly), different FDA-approved indications. Mounjaro is approved for type 2 diabetes. Zepbound is approved for weight loss. Dosing and delivery are identical.
              </p>

              <h3 className="font-semibold text-text-primary mt-6 mb-2">How much weight can I expect to lose on tirzepatide?</h3>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Clinical trial averages at the highest dose (15mg): 20-22% of body weight over 72 weeks. At 10mg: about 19-20%. At 5mg: about 15%. Real-world results typically trail clinical trial averages due to differences in adherence and support.
              </p>
            </div>
          )}
          {/* end editorial content for tirzepatide */}

          {providers.length > 0 ? (
            <FilteredProviderList providers={providers} config={{ showPeptideFilter: false }} />
          ) : (
            <div className="p-8 bg-white border border-border-subtle rounded-xl shadow-sm text-center">
              <h2 className="font-display text-xl text-text-primary mb-2">
                No {service.name} Providers Listed Yet
              </h2>
              <p className="text-text-secondary mb-4 max-w-[500px] mx-auto">
                We&apos;re building our directory. Know a provider offering {service.name}?
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/submit" className="px-5 py-2.5 bg-accent text-white font-semibold rounded-lg">
                  Submit a Practice
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
