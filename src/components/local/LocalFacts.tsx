import Link from "next/link";
import type { Provider } from "@/lib/data/schemas";
import {
  FDA_COMPOUNDING_LINKS,
  LICENSING_CHECKED_ON,
  NATIONAL_LOOKUPS,
  getStateLicensing,
} from "@/lib/data/state-licensing";

const GLP1 = new Set(["semaglutide", "tirzepatide", "liraglutide", "retatrutide"]);
const PEPTIDE_LABELS: Record<string, string> = {
  "nad-plus": "NAD+",
  "pt-141": "PT-141",
  "bpc-157": "BPC-157",
  "tb-500": "TB-500",
  "ghk-cu": "GHK-Cu",
  "cjc-1295-ipamorelin": "CJC-1295 / ipamorelin",
  hcg: "hCG",
  "aod-9604": "AOD-9604",
  "mots-c": "MOTS-c",
  "5-amino-1mq": "5-amino-1MQ",
};

function label(slug: string): string {
  return PEPTIDE_LABELS[slug] ?? slug.replace(/-/g, " ");
}

function monthYear(iso?: string): string {
  if (!iso) return "";
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function list(names: string[], max = 6): string {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  if (shown.length === 0) return "";
  if (rest > 0) return `${shown.join(", ")} and ${rest} more`;
  if (shown.length === 1) return shown[0];
  return `${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}`;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function computeLocalFacts(providers: Provider[]) {
  const clinics = providers.filter((p) => p.type === "clinic");
  const pharmacies = providers.filter((p) => p.type === "pharmacy");
  const wellness = providers.filter((p) => p.type === "wellness-center");
  const glp1 = providers.filter((p) => p.peptides.some((x) => GLP1.has(x)));
  const telehealth = providers.filter((p) => p.telehealth?.available);
  const ins = {
    accepted: providers.filter((p) => p.insurance === "accepted").length,
    notAccepted: providers.filter((p) => p.insurance === "not-accepted").length,
    varies: providers.filter((p) => p.insurance === "varies").length,
  };
  const unknownIns = providers.length - ins.accepted - ins.notAccepted - ins.varies;
  const pepCounts = new Map<string, number>();
  for (const p of providers) for (const x of p.peptides) pepCounts.set(x, (pepCounts.get(x) ?? 0) + 1);
  const topPeptides = [...pepCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  const zips = [...new Set(providers.map((p) => p.address.zip).filter((z) => /^\d{5}$/.test(z)))].sort();
  const claimed = providers.filter((p) => p.verificationTier === "claimed" || p.verificationTier === "trusted");
  const checkedDates = providers.map((p) => p.siteCheckedAt).filter(Boolean).sort() as string[];
  const cityCounts = new Map<string, number>();
  for (const p of providers) cityCounts.set(p.address.city, (cityCounts.get(p.address.city) ?? 0) + 1);
  const topCities = [...cityCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  const scanned = providers.filter((p) => p.siteCheckedAt);
  const reachable = scanned.filter((p) => p.siteAlive);
  return {
    clinics, pharmacies, wellness, glp1, telehealth, ins, unknownIns, topPeptides, zips, claimed,
    lastChecked: checkedDates[checkedDates.length - 1], scanned, reachable, topCities,
  };
}

export function LocalFacts({
  providers,
  placeName,
  stateCode,
  stateName,
}: {
  providers: Provider[];
  placeName: string;
  stateCode: string;
  stateName: string;
}) {
  if (providers.length === 0) return null;
  const f = computeLocalFacts(providers);
  const n = providers.length;

  return (
    <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
      <div>
        <h2 className="font-display text-2xl text-text-primary mb-4">
          {placeName} at a glance
        </h2>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            ["Clinics", f.clinics.length],
            ["Compounding pharmacies", f.pharmacies.length],
            ["Wellness centers", f.wellness.length],
            ["Mention telehealth", f.telehealth.length],
          ].map(([k, v]) => (
            <div key={k as string} className="p-3 bg-white border border-border-subtle rounded-xl">
              <dt className="text-xs text-text-tertiary">{k}</dt>
              <dd className="text-xl font-semibold text-text-primary">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="text-text-secondary leading-relaxed flex flex-col gap-4">
          <p>
            We list {plural(n, "provider", "providers")} in {placeName}: {plural(f.clinics.length, "clinic", "clinics")},{" "}
            {plural(f.pharmacies.length, "compounding pharmacy", "compounding pharmacies")} and{" "}
            {plural(f.wellness.length, "wellness center", "wellness centers")}.
            {f.scanned.length > 0 && (
              <>
                {" "}We checked {plural(f.scanned.length, "provider website", "provider websites")}
                {f.lastChecked ? ` in ${monthYear(f.lastChecked)}` : ""};{" "}
                {f.reachable.length} loaded for us.
              </>
            )}
            {f.zips.length > 0 && <> Listings cover ZIP {f.zips.length === 1 ? "code" : "codes"} {list(f.zips, 12)}.</>}
          </p>

          {f.topPeptides.length > 0 && (
            <p>
              Compounds named on local provider websites:{" "}
              {f.topPeptides.map(([slug, count], i) => (
                <span key={slug}>
                  {label(slug)} ({count}){i < f.topPeptides.length - 1 ? ", " : "."}
                </span>
              ))}{" "}
              {f.glp1.length > 0 && (
                <>
                  {plural(f.glp1.length, "provider names", "providers name")} a GLP-1 medication (semaglutide, tirzepatide,
                  liraglutide or retatrutide) somewhere on their site.
                </>
              )}{" "}
              A name on a website tells you what a practice mentions, not what it prescribes or stocks today.
            </p>
          )}

          <p>
            Insurance: {f.ins.accepted} say they accept insurance and {f.ins.notAccepted} say they don&apos;t; we couldn&apos;t
            confirm a policy for the rest ({f.ins.varies + f.unknownIns}). A practice that takes insurance may still bill a
            specific program as self-pay, so ask about the program you want before you book.
          </p>

          {f.topCities.length > 1 && (
            <p>
              Most listings are in {f.topCities.map(([c, k]) => `${c} (${k})`).join(", ")}. Clinics listed include{" "}
              {list(f.clinics.map((p) => p.name), 10)}.
            </p>
          )}
          {f.pharmacies.length > 0 && (
            <p>
              Compounding pharmacies listed in {placeName}: {list(f.pharmacies.map((p) => p.name), 8)}.
            </p>
          )}
          {f.telehealth.length > 0 && (
            <p>
              Practices whose websites mention telehealth or virtual visits: {list(f.telehealth.map((p) => p.name), 8)}. Confirm the
              prescriber is licensed in {stateName} before you book.
            </p>
          )}
          <p>
            {f.claimed.length > 0
              ? `${plural(f.claimed.length, "practice has", "practices have")} claimed and confirmed their listing.`
              : `No ${placeName} practice has claimed its listing yet.`}{" "}
            Listing details come from public sources and each practice&apos;s own website unless the practice has confirmed them
            with us. Run a
            practice here?{" "}
            <Link href="/submit" className="text-accent hover:underline">Add or correct a listing</Link>.
          </p>
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <LicenseAndFda stateCode={stateCode} stateName={stateName} />
      </aside>
    </div>
  );
}

export function LicenseAndFda({ stateCode, stateName }: { stateCode: string; stateName: string }) {
  const lic = getStateLicensing(stateCode);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
        <div className="p-5 bg-white border border-border-subtle rounded-xl">
          <h2 className="font-semibold text-text-primary mb-2">Check a license in {stateName}</h2>
          <p className="text-sm text-text-secondary mb-3">
            Before you book, look up the prescriber and the pharmacy with the state board. A listing here is not a license check.
          </p>
          <ul className="text-sm flex flex-col gap-2">
            {lic?.medical && (
              <li><a href={lic.medical.url} rel="nofollow noopener" target="_blank" className="text-accent hover:underline">{lic.medical.name}</a></li>
            )}
            {lic?.pharmacy && (
              <li><a href={lic.pharmacy.url} rel="nofollow noopener" target="_blank" className="text-accent hover:underline">{lic.pharmacy.name}</a></li>
            )}
            {NATIONAL_LOOKUPS.map((b) => (
              <li key={b.url}><a href={b.url} rel="nofollow noopener" target="_blank" className="text-accent hover:underline">{b.name}</a></li>
            ))}
          </ul>
          <p className="text-xs text-text-tertiary mt-3">Board links checked {monthYear(LICENSING_CHECKED_ON)}.</p>
        </div>
        <div className="p-5 bg-white border border-border-subtle rounded-xl">
          <h2 className="font-semibold text-text-primary mb-2">Compounded vs FDA-approved</h2>
          <p className="text-sm text-text-secondary mb-3">
            Compounded drugs are not FDA-approved. FDA changed its compounding policy for GLP-1 medications more than once in
            2025 and 2026. Ask the practice whether a product is an approved brand or compounded, and
            which pharmacy makes it.
          </p>
          <ul className="text-sm flex flex-col gap-2">
            {FDA_COMPOUNDING_LINKS.map((b) => (
              <li key={b.url}><a href={b.url} rel="nofollow noopener" target="_blank" className="text-accent hover:underline">{b.name}</a></li>
            ))}
          </ul>
        </div>
    </div>
  );
}
