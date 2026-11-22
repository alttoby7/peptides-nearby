"use client";

import { useState } from "react";

const claimUrl = "/api/claim";

// Event names only (no plan/mode params), matching the measurement boundary.
function track(eventName: string) {
  const win = window as typeof window & { gtag?: (...args: unknown[]) => void };
  win.gtag?.("event", eventName, { surface: "provider_claim" });
}

const input =
  "w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none";
const lbl = "block text-sm font-medium text-text-secondary mb-1.5";

export function ClaimForm({
  providerSlug,
  providerName,
  siteHost,
}: {
  providerSlug: string;
  providerName: string;
  siteHost: string;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "email" | "manual" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data: Record<string, unknown> = Object.fromEntries(fd);
    data.attest = fd.get("attest") === "on";
    data.providerSlug = providerSlug;
    try {
      const res = await fetch(claimUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const out = (await res.json().catch(() => ({}))) as { mode?: string; error?: string };
      if (res.ok) {
        const mode = out.mode === "email-domain" ? "email" : "manual";
        track("provider_claim_submitted");
        setStatus(mode);
        form.reset();
      } else {
        setStatus("error");
        setErrorMessage(
          out.error === "attestation_required"
            ? "Please confirm you're authorized to manage this listing."
            : out.error === "invalid_booking_url"
              ? "Booking link must start with https://"
              : "We couldn't process your claim. Please check the required fields and try again.",
        );
      }
    } catch {
      setStatus("error");
      setErrorMessage("We couldn't reach the service. Please try again.");
    }
  }

  if (status === "email" || status === "manual") {
    return (
      <div className="p-8 bg-surface-1 border border-verified/20 rounded-xl text-center">
        <h2 className="font-display text-xl text-verified mb-2">
          {status === "email" ? "Check your inbox" : "Claim received"}
        </h2>
        <p className="text-text-secondary">
          {status === "email" ? (
            <>We sent a confirm link to your work email. Click it within 72 hours to verify you manage <strong>{providerName}</strong>.</>
          ) : (
            <>We&apos;ll verify by calling the number on the listing before we publish anything. Nothing on the listing changes until then.</>
          )}
        </p>
      </div>
    );
  }

  const domainHint = siteHost
    ? email.includes("@") && !email.toLowerCase().endsWith(`@${siteHost}`)
      ? `Email verification needs an address ending in @${siteHost}. Other addresses go to a phone check.`
      : `Use an address ending in @${siteHost} and we'll email you a confirm link.`
    : "We'll verify this listing by calling the number on file.";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-4">
        <legend className="font-semibold text-text-primary mb-2">1. Verify you manage this practice</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="claimantName" className={lbl}>Your name *</label>
            <input id="claimantName" name="claimantName" type="text" required className={input} placeholder="Jane Smith, NP" />
          </div>
          <div>
            <label htmlFor="claimantRole" className={lbl}>Your role *</label>
            <select id="claimantRole" name="claimantRole" required className={input} defaultValue="">
              <option value="" disabled>Select role...</option>
              <option value="owner">Owner</option>
              <option value="medical-director">Medical director</option>
              <option value="practice-manager">Practice manager</option>
              <option value="marketing">Marketing</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="claimantEmail" className={lbl}>Work email *</label>
          <input
            id="claimantEmail" name="claimantEmail" type="email" required className={input}
            placeholder={siteHost ? `you@${siteHost}` : "you@yourpractice.com"}
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-xs text-text-tertiary mt-1">{domainHint}</p>
        </div>
        <div>
          <label htmlFor="claimantPhone" className={lbl}>Direct phone (optional)</label>
          <input id="claimantPhone" name="claimantPhone" type="tel" className={input} placeholder="(512) 555-0100" />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-semibold text-text-primary mb-2">2. Your listing details (we publish these)</legend>
        <div>
          <label htmlFor="description" className={lbl}>About your practice</label>
          <textarea
            id="description" name="description" rows={6} className={`${input} resize-y`} maxLength={4000}
            placeholder="In your own words: who you see, how a first visit works, who prescribes, whether labs are required, which locations you serve. Please no outcome or efficacy claims."
          />
          <p className="text-xs text-text-tertiary mt-1">About 80–300 words works best. We don&apos;t publish claims about results. Please don&apos;t include patient or medical information.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="services" className={lbl}>Services offered</label>
            <input id="services" name="services" type="text" className={input} placeholder="Medical weight management, hormone therapy, IV therapy" />
          </div>
          <div>
            <label htmlFor="peptides" className={lbl}>Peptides / medications you prescribe or dispense</label>
            <input id="peptides" name="peptides" type="text" className={input} placeholder="Semaglutide, tirzepatide, sermorelin" />
          </div>
          <div>
            <label htmlFor="telehealth" className={lbl}>Telehealth visits?</label>
            <select id="telehealth" name="telehealth" className={input} defaultValue="">
              <option value="">Not sure / skip</option>
              <option value="yes">Yes</option>
              <option value="no">No, in person only</option>
            </select>
          </div>
          <div>
            <label htmlFor="insurance" className={lbl}>Insurance</label>
            <select id="insurance" name="insurance" className={input} defaultValue="">
              <option value="">Skip</option>
              <option value="accepted">We accept insurance</option>
              <option value="not-accepted">Self-pay only</option>
              <option value="varies">Depends on the service</option>
            </select>
          </div>
          <div>
            <label htmlFor="hours" className={lbl}>Hours</label>
            <input id="hours" name="hours" type="text" className={input} placeholder="Mon–Thu 8–5, Fri 8–12" />
          </div>
          <div>
            <label htmlFor="bookingUrl" className={lbl}>Booking link</label>
            <input id="bookingUrl" name="bookingUrl" type="url" className={input} placeholder="https://..." />
          </div>
        </div>
        <div>
          <label htmlFor="corrections" className={lbl}>Anything wrong on the current listing?</label>
          <textarea id="corrections" name="corrections" rows={2} className={`${input} resize-y`} placeholder="Wrong address, closed location, phone changed..." />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 p-5 bg-surface-1 border border-border-subtle rounded-xl">
        <legend className="font-semibold text-text-primary px-1">3. Two optional questions (not published)</legend>
        <div>
          <label htmlFor="patientValue" className={lbl}>Roughly what is one new patient worth to your practice in their first year?</label>
          <select id="patientValue" name="patientValue" className={input} defaultValue="">
            <option value="">Skip</option>
            <option value="under-500">Under $500</option>
            <option value="500-1500">$500 – $1,500</option>
            <option value="1500-5000">$1,500 – $5,000</option>
            <option value="5000-plus">Over $5,000</option>
            <option value="prefer-not">Prefer not to say</option>
          </select>
        </div>
        <div>
          <label htmlFor="patientSources" className={lbl}>Where do most new patients find you today?</label>
          <input id="patientSources" name="patientSources" type="text" className={input} placeholder="Google, referrals, Instagram..." />
        </div>
      </fieldset>

      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <label className="flex gap-3 items-start text-sm text-text-secondary">
        <input type="checkbox" name="attest" required className="mt-1" />
        <span>I&apos;m authorized to manage this listing for {providerName}, and the details above are accurate. Peptides Nearby may publish them.</span>
      </label>

      <button
        type="submit"
        disabled={status === "submitting"}
        onClick={() => track("provider_claim_started")}
        className="px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status === "submitting" ? "Submitting..." : "Claim this listing (free)"}
      </button>

      {status === "error" && <p className="text-sm text-red-600">{errorMessage || "Something went wrong."}</p>}
    </form>
  );
}
