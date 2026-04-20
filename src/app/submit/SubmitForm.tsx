"use client";

import { useState } from "react";

const submitUrl = process.env.NEXT_PUBLIC_SUBMIT_PROVIDER_URL;

export function SubmitForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    if (!submitUrl) {
      setStatus("error");
      setErrorMessage("Submission endpoint is not configured.");
      return;
    }

    try {
      const res = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
        setErrorMessage("We couldn't save your submission. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("We couldn't reach the submission service. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="p-8 bg-surface-1 border border-verified/20 rounded-xl text-center">
        <h2 className="font-display text-xl text-verified mb-2">Submitted!</h2>
        <p className="text-text-secondary">
          Thank you for your submission. We&apos;ll review it and add it to the directory soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1.5">
          Practice Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
          placeholder="e.g. Austin Peptide Clinic"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-text-secondary mb-1.5">
          Type *
        </label>
        <select
          id="type"
          name="type"
          required
          className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">Select type...</option>
          <option value="clinic">Clinic</option>
          <option value="pharmacy">Compounding Pharmacy</option>
          <option value="wellness-center">Wellness Center</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-text-secondary mb-1.5">
            City *
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
            placeholder="e.g. Austin"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-text-secondary mb-1.5">
            State *
          </label>
          <input
            id="state"
            name="state"
            type="text"
            required
            className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
            placeholder="e.g. TX"
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-text-secondary mb-1.5">
          Street Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
          placeholder="e.g. 123 Main St, Suite 100"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-1.5">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
            placeholder="(512) 555-0100"
          />
        </div>
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-text-secondary mb-1.5">
            Website
          </label>
          <input
            id="website"
            name="website"
            type="url"
            className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
            placeholder="https://..."
          />
        </div>
      </div>

      <div>
        <label htmlFor="services" className="block text-sm font-medium text-text-secondary mb-1.5">
          Services / Peptides Offered
        </label>
        <textarea
          id="services"
          name="services"
          rows={3}
          className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none resize-y"
          placeholder="e.g. BPC-157, Semaglutide, Tirzepatide, Hormone Therapy"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status === "submitting" ? "Submitting..." : "Submit Practice"}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-400">{errorMessage || "Something went wrong. Please try again."}</p>
      )}
    </form>
  );
}
