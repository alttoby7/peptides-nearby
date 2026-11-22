// Official state licensing boards used in the "Check a license" block on
// local pages. Every URL here was fetched on CHECKED_ON and resolved to the
// board's own site (403 = live official domain behind a bot challenge).
// Re-check before editing; never add a board you have not fetched.

export const LICENSING_CHECKED_ON = "2026-11-21";

export interface Board {
  name: string;
  url: string;
}

export interface StateLicensing {
  medical?: Board;
  pharmacy?: Board;
}

export const STATE_LICENSING: Record<string, StateLicensing> = {
  AZ: {
    medical: { name: "Arizona Medical Board", url: "https://www.azmd.gov/" },
    pharmacy: { name: "Arizona State Board of Pharmacy", url: "https://pharmacy.az.gov/" },
  },
  CA: {
    medical: { name: "Medical Board of California", url: "https://www.mbc.ca.gov/" },
    pharmacy: { name: "California State Board of Pharmacy", url: "https://www.pharmacy.ca.gov/" },
  },
  CO: {
    medical: { name: "Colorado Medical Board (DORA)", url: "https://dpo.colorado.gov/Medical" },
    pharmacy: { name: "Colorado State Board of Pharmacy (DORA)", url: "https://dpo.colorado.gov/Pharmacy" },
  },
  DC: {
    medical: { name: "DC Board of Medicine", url: "https://dchealth.dc.gov/bomed" },
    pharmacy: { name: "DC Board of Pharmacy", url: "https://dchealth.dc.gov/service/board-pharmacy" },
  },
  FL: {
    medical: { name: "Florida Board of Medicine", url: "https://flboardofmedicine.gov/" },
    pharmacy: { name: "Florida Board of Pharmacy", url: "https://floridaspharmacy.gov/" },
  },
  GA: {
    medical: { name: "Georgia Composite Medical Board", url: "https://medicalboard.georgia.gov/" },
    pharmacy: { name: "Georgia Board of Pharmacy", url: "https://gbp.georgia.gov/" },
  },
  HI: {
    medical: { name: "Hawaii Medical Board", url: "https://cca.hawaii.gov/pvl/boards/medical/" },
    pharmacy: { name: "Hawaii Board of Pharmacy", url: "https://cca.hawaii.gov/pvl/boards/pharmacy/" },
  },
  IL: {
    medical: { name: "Illinois Department of Financial and Professional Regulation: Physicians", url: "https://idfpr.illinois.gov/profs/physicians.html" },
    pharmacy: { name: "Illinois Department of Financial and Professional Regulation: Pharmacy", url: "https://idfpr.illinois.gov/profs/pharm.html" },
  },
  IN: {
    medical: { name: "Indiana Professional Licensing Agency", url: "https://www.in.gov/pla/" },
    pharmacy: { name: "Indiana Board of Pharmacy", url: "https://www.in.gov/pla/professions/pharmacy-home/" },
  },
  MD: {
    medical: { name: "Maryland Board of Physicians", url: "https://www.mbp.state.md.us/" },
    pharmacy: { name: "Maryland Board of Pharmacy", url: "https://health.maryland.gov/pharmacy/" },
  },
  NC: {
    medical: { name: "North Carolina Medical Board", url: "https://www.ncmedboard.org/" },
    pharmacy: { name: "North Carolina Board of Pharmacy", url: "https://www.ncbop.org/" },
  },
  NM: {
    medical: { name: "New Mexico Medical Board", url: "https://www.nmmb.state.nm.us/" },
    pharmacy: { name: "New Mexico Board of Pharmacy", url: "https://www.rld.nm.gov/boards-and-commissions/individual-boards-and-commissions/pharmacy/" },
  },
  NV: {
    medical: { name: "Nevada State Board of Medical Examiners", url: "https://medboard.nv.gov/" },
    pharmacy: { name: "Nevada State Board of Pharmacy", url: "https://www.bop.nv.gov/" },
  },
  NY: {
    medical: { name: "NYS Office of the Professions: Medicine", url: "https://www.op.nysed.gov/professions-index/medicine" },
    pharmacy: { name: "NYS Office of the Professions: Pharmacy", url: "https://www.op.nysed.gov/professions-index/pharmacy" },
  },
  OH: {
    medical: { name: "State Medical Board of Ohio", url: "https://med.ohio.gov/" },
    pharmacy: { name: "Ohio Board of Pharmacy", url: "https://www.pharmacy.ohio.gov/" },
  },
  OR: {
    medical: { name: "Oregon Medical Board", url: "https://www.oregon.gov/omb/" },
    pharmacy: { name: "Oregon Board of Pharmacy", url: "https://www.oregon.gov/pharmacy/" },
  },
  PA: {
    medical: { name: "Pennsylvania State Board of Medicine", url: "https://www.pa.gov/agencies/dos/department-and-offices/bpoa/boards-commissions/medicine" },
    pharmacy: { name: "Pennsylvania State Board of Pharmacy", url: "https://www.pa.gov/agencies/dos/department-and-offices/bpoa/boards-commissions/pharmacy" },
  },
  TN: {
    medical: { name: "Tennessee Department of Health (health professional licensing)", url: "https://www.tn.gov/health.html" },
  },
  TX: {
    medical: { name: "Texas Medical Board", url: "https://www.tmb.texas.gov/" },
    pharmacy: { name: "Texas State Board of Pharmacy", url: "https://www.pharmacy.texas.gov/" },
  },
  WA: {
    medical: { name: "Washington Medical Commission", url: "https://wmc.wa.gov/" },
    pharmacy: { name: "Washington DOH Provider Credential Search", url: "https://doh.wa.gov/licenses-permits-and-certificates/provider-credential-or-facility-search" },
  },
};

export const NATIONAL_LOOKUPS: Board[] = [
  { name: "DocInfo (Federation of State Medical Boards physician lookup)", url: "https://www.docinfo.org/" },
];

export const FDA_COMPOUNDING_LINKS: Board[] = [
  {
    name: "FDA: Compounding and the FDA, Questions and Answers",
    url: "https://www.fda.gov/drugs/human-drug-compounding/compounding-and-fda-questions-and-answers",
  },
  {
    name: "FDA: policies for compounders as GLP-1 supply stabilizes",
    url: "https://www.fda.gov/drugs/drug-alerts-and-statements/fda-clarifies-policies-compounders-national-glp-1-supply-begins-stabilize",
  },
];

export function getStateLicensing(stateCode: string): StateLicensing | undefined {
  return STATE_LICENSING[stateCode];
}
