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
                <strong>Semaglutide</strong> is a GLP-1 receptor agonist and a prescription medication. It is FDA-approved under several brand names, each for specific uses: Wegovy (chronic weight management and cardiovascular risk reduction), Ozempic (type 2 diabetes), and Rybelsus (type 2 diabetes, oral). FDA approved a Wegovy tablet in December 2025 and a higher-strength Wegovy HD injection in March 2026. The directory below lists providers who advertise semaglutide in your area.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">What Semaglutide Is and How It Works</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Semaglutide is a synthetic analog of GLP-1, a gut hormone the body releases after eating. As a GLP-1 receptor agonist, it acts on receptors involved in appetite and blood sugar regulation, and it slows stomach emptying.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The medication is available as a once-weekly subcutaneous injection (Wegovy, Ozempic) or a daily tablet (Rybelsus and the Wegovy tablet). Each product&apos;s prescribing information sets out who it is approved for. Wegovy&apos;s weight-management approval covers people who meet specific BMI and health criteria, and your prescriber decides whether you qualify.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">FDA-Approved Forms</h2>
              <div className="overflow-x-auto mb-6 max-w-[700px]"><table className="w-full text-sm border-collapse">
                <thead><tr className="border-b border-border-subtle">
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Brand</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Indication</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Form</th>
                </tr></thead>
                <tbody>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Wegovy</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Chronic weight management; cardiovascular risk reduction</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Weekly injection</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Wegovy HD</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Chronic weight management</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Weekly injection (higher strength)</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Ozempic</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Type 2 diabetes</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Weekly injection</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Rybelsus</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Type 2 diabetes</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Daily tablet</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Wegovy (oral)</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Chronic weight management; cardiovascular risk reduction</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Daily tablet</td></tr>
                </tbody>
              </table></div>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Ozempic and Rybelsus are not approved for weight management, so prescribing them for weight loss is off-label. Rybelsus and the Wegovy tablet are separate products. Compounded semaglutide is not FDA-approved.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Dosing and Titration</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Semaglutide is started at a low dose and increased gradually, as set out in each product&apos;s FDA-approved prescribing information. Your prescriber sets your dose and schedule. This site does not give dosing guidance.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Ask your provider which dose they plan to start with, how and when they will adjust it, how to take the specific form you are prescribed, and what to do if side effects make a dose hard to tolerate.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Clinical Trial Results</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Semaglutide has been studied in large clinical trial programs. Results from the trials that supported each approval are summarized in the prescribing information. Individual results vary, and this site does not make outcome claims.
              </p>
              <ul className="space-y-2 text-sm text-text-secondary max-w-[700px] mb-6">
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>STEP program:</strong> trials of semaglutide for chronic weight management in adults with obesity or overweight, which supported Wegovy&apos;s weight-management approval.</span></li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>SELECT trial:</strong> a cardiovascular outcomes trial in adults with established cardiovascular disease and obesity or overweight. It supported FDA&apos;s <a href="https://www.fda.gov/news-events/press-announcements/fda-approves-first-treatment-reduce-risk-serious-heart-problems-specifically-adults-obesity-or" target="_blank" rel="noopener noreferrer">March 2024 approval</a> of Wegovy to reduce the risk of cardiovascular death, heart attack, and stroke in that population.</span></li>
              </ul>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Results outside clinical trials can differ from trial results. Ask your provider what to expect in your situation.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Wegovy is approved for chronic, meaning long-term, weight management. Discuss a long-term plan with your provider before starting, including what to expect if you stop.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Side Effects and Safety</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The most common side effects are gastrointestinal, including nausea, vomiting, diarrhea, constipation, and abdominal pain.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                GI side effects are reported most often during dose increases. Tell your provider if they persist or are severe.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Semaglutide carries a boxed warning: thyroid C-cell tumors were observed in rodent studies, and it is unknown whether semaglutide causes these tumors in humans. It is contraindicated in patients with a personal or family history of medullary thyroid carcinoma or MEN type 2 syndrome. Other risks include pancreatitis, gallbladder disease, and hypoglycemia when combined with insulin or sulfonylureas.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Weight loss can include loss of lean (muscle) mass. Ask your provider about nutrition, protein intake, and exercise during treatment.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Ask your provider how to manage GI side effects. Eating smaller meals and staying hydrated are commonly suggested, and your provider may change your dose schedule if side effects are severe.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Cost and Insurance</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Brand-name Wegovy runs $1,300 to $1,600 per month without insurance. Compounded semaglutide is not FDA-approved. FDA declared the semaglutide injection shortage resolved in February 2025, its temporary enforcement discretion for compounders has ended, and on April 30, 2026 it <a href="https://www.fda.gov/news-events/press-announcements/fda-proposes-exclude-semaglutide-tirzepatide-and-liraglutide-503b-bulks-list" target="_blank" rel="noopener noreferrer">proposed excluding semaglutide from the 503B bulks list</a>. See FDA&apos;s <a href="https://www.fda.gov/drugs/drug-alerts-and-statements/fda-clarifies-policies-compounders-national-glp-1-supply-begins-stabilize" target="_blank" rel="noopener noreferrer">statement on compounding policies</a>, and ask any provider offering compounded semaglutide how their pharmacy complies.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Insurance coverage is inconsistent. Most commercial plans cover semaglutide for diabetes (Ozempic) but fewer cover it for weight management (Wegovy). Check your plan&apos;s current coverage, including Medicare Part D if you are eligible.
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
                Semaglutide is the active ingredient. Ozempic is one brand name, approved for type 2 diabetes. Wegovy is the same molecule at different strengths, approved for chronic weight management and cardiovascular risk reduction. Different brand, same active ingredient, different indications and dosing.
              </p>

              <h3 className="font-semibold text-text-primary mt-6 mb-2">How long does it take for semaglutide to work?</h3>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                This site does not make outcome claims. Responses vary from person to person, and the prescribing information summarizes what was seen in clinical trials. Ask your provider what to expect and how they will track your progress.
              </p>

              <h3 className="font-semibold text-text-primary mt-6 mb-2">Can I take semaglutide as a pill instead of an injection?</h3>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                For some uses, yes. The FDA approved a Wegovy tablet for chronic weight management in December 2025. Rybelsus is a semaglutide tablet approved for type 2 diabetes. Ask your provider whether a tablet or an injection fits your situation.
              </p>
            </div>
          )}
          {/* end editorial content for semaglutide */}

          {/* editorial content for tirzepatide */}
          {slug === "tirzepatide" && (
            <div className="mb-10">
              <p className="text-text-secondary mb-4 max-w-[700px]">
                <strong>Tirzepatide</strong> is a dual GIP and GLP-1 receptor agonist and a prescription medication. The FDA approved it as Mounjaro for type 2 diabetes and as Zepbound for chronic weight management and for moderate-to-severe obstructive sleep apnea in adults with obesity. The directory below lists providers who advertise tirzepatide in your area.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">What Tirzepatide Is and How It Works</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Tirzepatide acts on two incretin hormone receptors, GIP and GLP-1. That dual mechanism is what distinguishes it from semaglutide, which acts on the GLP-1 receptor only.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                GLP-1 receptor activation slows stomach emptying and acts on appetite and insulin signaling. GIP is another gut hormone involved in insulin release and how the body handles nutrients. How much each pathway contributes to tirzepatide&apos;s effects is still being studied.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Tirzepatide is a once-weekly subcutaneous injection. Zepbound&apos;s weight-management approval covers adults who meet specific BMI and health criteria set out in its prescribing information, and your prescriber decides whether you qualify.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">FDA-Approved Forms</h2>
              <div className="overflow-x-auto mb-6 max-w-[700px]"><table className="w-full text-sm border-collapse">
                <thead><tr className="border-b border-border-subtle">
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Brand</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Indication</th>
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Form</th>
                </tr></thead>
                <tbody>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Zepbound</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Chronic weight management; obstructive sleep apnea in adults with obesity</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Weekly injection</td></tr>
                  <tr><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Mounjaro</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Type 2 diabetes</td><td className="py-2 px-3 text-text-secondary border-b border-border-subtle/50">Weekly injection</td></tr>
                </tbody>
              </table></div>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Mounjaro is not approved for weight management, so prescribing it for weight loss is off-label. Compounded tirzepatide is not FDA-approved.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Dosing and Titration</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Tirzepatide is started at a low dose and increased gradually, as set out in its FDA-approved prescribing information. Your prescriber sets your dose and schedule. This site does not give dosing guidance.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Ask your provider which dose they plan to start with, how and when they will adjust it, and what to do if side effects make a dose hard to tolerate. Your pharmacist or provider should also show you how to use the pen or vial and where to inject.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Clinical Trial Results</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Tirzepatide has been studied in large clinical trial programs. Results from the trials that supported each approval are summarized in the Zepbound and Mounjaro prescribing information. Individual results vary, and this site does not make outcome claims.
              </p>
              <ul className="space-y-2 text-sm text-text-secondary max-w-[700px] mb-6">
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>SURMOUNT program:</strong> trials of tirzepatide for chronic weight management in adults with obesity or overweight, with and without type 2 diabetes, which supported <a href="https://www.fda.gov/news-events/press-announcements/fda-approves-new-medication-chronic-weight-management" target="_blank" rel="noopener noreferrer">Zepbound&apos;s November 2023 approval</a>.</span></li>
                <li className="flex items-start gap-2"><span className="text-accent mt-0.5">&#10003;</span><span><strong>SURMOUNT-OSA:</strong> studied tirzepatide in adults with obesity and moderate-to-severe obstructive sleep apnea, supporting <a href="https://www.fda.gov/news-events/press-announcements/fda-approves-first-medication-obstructive-sleep-apnea" target="_blank" rel="noopener noreferrer">FDA&apos;s December 2024 approval</a> for that use.</span></li>
              </ul>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Tirzepatide and semaglutide have also been compared directly in a clinical trial. Which medication is appropriate depends on your medical history, tolerance, coverage, and your provider&apos;s judgment.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Zepbound is approved for chronic, meaning long-term, weight management. Discuss a long-term plan with your provider before starting, including what to expect if you stop.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Side Effects and Safety</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                The most common side effects are gastrointestinal, including nausea, diarrhea, vomiting, and constipation. Injection site reactions can also occur.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                GI symptoms are reported most often during dose increases. Tell your provider if they persist or are severe.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Tirzepatide carries a boxed warning for thyroid C-cell tumors observed in rodent studies (as semaglutide does); it is unknown whether it causes these tumors in humans. It is contraindicated in patients with a personal or family history of medullary thyroid carcinoma or MEN type 2. Other risks include pancreatitis, gallbladder disease, and hypoglycemia when combined with insulin or sulfonylureas.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Weight loss can include loss of lean (muscle) mass. Ask your provider about nutrition, protein intake, and exercise during treatment.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Ask your provider how to manage GI side effects. Eating smaller meals and staying hydrated are commonly suggested, and your provider may change your dose schedule if side effects are severe.
              </p>

              <h2 className="font-display text-2xl text-text-primary mt-10 mb-4">Cost and Insurance</h2>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Brand-name Zepbound runs $1,200-$1,600 per month without insurance. Compounded tirzepatide is not FDA-approved. FDA confirmed the tirzepatide shortage was resolved in December 2024, and its temporary enforcement discretion for compounders ended in March 2025.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                On April 30, 2026, FDA also <a href="https://www.fda.gov/news-events/press-announcements/fda-proposes-exclude-semaglutide-tirzepatide-and-liraglutide-503b-bulks-list" target="_blank" rel="noopener noreferrer">proposed excluding tirzepatide from the 503B bulks list</a>. See FDA&apos;s <a href="https://www.fda.gov/drugs/drug-alerts-and-statements/fda-clarifies-policies-compounders-national-glp-1-supply-begins-stabilize" target="_blank" rel="noopener noreferrer">statement on compounding policies</a>, and ask any provider offering compounded tirzepatide how their pharmacy complies.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Insurance coverage varies. Mounjaro is more widely covered than Zepbound. Zepbound coverage for obesity depends on your plan.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                If you have Medicare, check your Part D plan&apos;s current coverage. HSA and FSA funds are eligible at most providers. Eli Lilly offers a Zepbound savings card where eligible commercially insured patients may pay as little as $25 per month.
              </p>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Budget range: $600-$1,200 per month for brand-name in-person programs with labs and monitoring. Ask any program for its total monthly cost, including medication, visits, and labs.
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
                This site does not rank medications or make outcome claims. The two have different mechanisms and different FDA-approved labels, and they have been compared in a clinical trial. The right choice depends on your medical history, tolerance, coverage, and your provider&apos;s judgment.
              </p>

              <h3 className="font-semibold text-text-primary mt-6 mb-2">What is the difference between Mounjaro and Zepbound?</h3>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                Same active ingredient (tirzepatide), same manufacturer (Eli Lilly), different FDA-approved indications. Mounjaro is approved for type 2 diabetes. Zepbound is approved for chronic weight management and for obstructive sleep apnea in adults with obesity.
              </p>

              <h3 className="font-semibold text-text-primary mt-6 mb-2">How much weight can I expect to lose on tirzepatide?</h3>
              <p className="text-text-secondary mb-4 max-w-[700px]">
                This site does not make outcome claims, and individual results vary. The Zepbound prescribing information summarizes what was seen in the clinical trials that supported its approval. Ask your provider what to expect in your situation.
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
