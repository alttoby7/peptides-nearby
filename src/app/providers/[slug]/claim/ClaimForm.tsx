"use client";

import { useState } from "react";

const claimUrl = "/api/submit";

function track(eventName: string, planInterest: string) {
  const win = window as typeof window & { gtag?: (...args: unknown[]) => void };
  win.gtag?.("event", eventName, {
    surface: "provider_claim",
    plan_interest: planInterest,
  });
}

export function ClaimForm({ providerSlug, providerName }: { providerSlug: string; providerName: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch(claimUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, action: "claim", providerSlug, providerName }),
      });

      if (res.ok) {
        track("provider_claim_submitted", String(data.planInterest || "free-claim"));
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
        setErrorMessage("We couldn't process your claim. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("We couldn't reach the service. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="p-8 bg-surface-1 border border-verified/20 rounded-xl text-center">
        <h2 className="font-display text-xl text-verified mb-2">Claim Submitted!</h2>
        <p className="text-text-secondary">
          We&apos;ll review your claim for <strong>{providerName}</strong> and contact you within 2–3 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="claimantName" className="block text-sm font-medium text-text-secondary mb-1.5">
            Your Name *
          </label>
          <input
            id="claimantName"
            name="claimantName"
            type="text"
            required
            className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
            placeholder="Dr. Jane Smith"
          />
        </div>
        <div>
          <label htmlFor="claimantRole" className="block text-sm font-medium text-text-secondary mb-1.5">
            Your Role *
          </label>
          <select
            id="claimantRole"
            name="claimantRole"
            required
            className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="">Select role...</option>
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="claimantEmail" className="block text-sm font-medium text-text-secondary mb-1.5">
          Business Email *
        </label>
        <input
          id="claimantEmail"
          name="claimantEmail"
          type="email"
          required
          className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
          placeholder="jane@yourclinic.com"
        />
        <p className="text-xs text-text-tertiary mt-1">
          We&apos;ll send a verification email to this address.
        </p>
      </div>

      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <fieldset className="p-5 bg-surface-1 border border-border-subtle rounded-xl">
        <legend className="font-semibold text-text-primary px-1">Listing option</legend>
        <label className="flex gap-3 items-start py-2">
          <input type="radio" name="planInterest" value="free-claim" defaultChecked className="mt-1" />
          <span>
            <strong className="text-text-primary">Free claim and correction</strong>
            <span className="block text-sm text-text-secondary">Confirm ownership and request factual updates to your listing.</span>
          </span>
        </label>
        <label className="flex gap-3 items-start py-2">
          <input type="radio" name="planInterest" value="founding-featured" className="mt-1" />
          <span>
            <strong className="text-text-primary">Founding Featured pilot — $99 for the first year</strong>
            <span className="block text-sm text-text-secondary">Request a reviewed enhanced profile and clearly labeled featured placement on one relevant local page. No payment is taken with this form, and placement never changes factual or medical information.</span>
          </span>
        </label>
      </fieldset>

      <div>
        <label htmlFor="claimantPhone" className="block text-sm font-medium text-text-secondary mb-1.5">
          Phone (optional)
        </label>
        <input
          id="claimantPhone"
          name="claimantPhone"
          type="tel"
          className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
          placeholder="(512) 555-0100"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-text-secondary mb-1.5">
          Additional Information
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none resize-y"
          placeholder="Anything else that helps verify your ownership (e.g. corrections to our listing)"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        onClick={() => {
          const selected = document.querySelector<HTMLInputElement>('input[name="planInterest"]:checked')?.value || "free-claim";
          track("provider_claim_started", selected);
        }}
        className="px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status === "submitting" ? "Submitting..." : "Submit Claim"}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-400">{errorMessage || "Something went wrong."}</p>
      )}
    </form>
  );
}
