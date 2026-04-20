"use client";

import { useState } from "react";

const reviewUrl = process.env.NEXT_PUBLIC_SUBMIT_REVIEW_URL;

export function ReviewForm({ providerSlug }: { providerSlug: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [rating, setRating] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage("Please select a rating.");
      return;
    }
    setStatus("submitting");
    setErrorMessage("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    if (!reviewUrl) {
      setStatus("error");
      setErrorMessage("Review endpoint is not configured.");
      return;
    }

    try {
      const res = await fetch(reviewUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, providerSlug, rating }),
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
        setRating(0);
      } else {
        const err = await res.json().catch(() => null);
        setStatus("error");
        setErrorMessage(err?.error || "We couldn't save your review. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("We couldn't reach the service. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="p-6 bg-surface-1 border border-verified/20 rounded-xl text-center">
        <h3 className="font-display text-lg text-verified mb-1">Review Submitted!</h3>
        <p className="text-sm text-text-secondary">
          Your review will be published after moderation. We verify all visits to maintain review integrity.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Star rating */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Rating *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl transition-colors ${
                star <= rating ? "text-amber-400" : "text-border-medium hover:text-amber-300"
              }`}
            >
              &#9733;
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="reviewerName" className="block text-sm font-medium text-text-secondary mb-1.5">
            Your Name *
          </label>
          <input
            id="reviewerName"
            name="reviewerName"
            type="text"
            required
            className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
            placeholder="Jane D."
          />
        </div>
        <div>
          <label htmlFor="reviewerEmail" className="block text-sm font-medium text-text-secondary mb-1.5">
            Email * <span className="text-text-tertiary font-normal">(not displayed)</span>
          </label>
          <input
            id="reviewerEmail"
            name="reviewerEmail"
            type="email"
            required
            className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
            placeholder="jane@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="visitDate" className="block text-sm font-medium text-text-secondary mb-1.5">
            Visit Date *
          </label>
          <input
            id="visitDate"
            name="visitDate"
            type="date"
            required
            max={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="visitType" className="block text-sm font-medium text-text-secondary mb-1.5">
            Visit Type
          </label>
          <select
            id="visitType"
            name="visitType"
            className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="in-person">In-Person</option>
            <option value="telehealth">Telehealth</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1.5">
          Review Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
          placeholder="Brief summary of your experience"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-text-secondary mb-1.5">
          Your Review *
        </label>
        <textarea
          id="body"
          name="body"
          rows={4}
          required
          minLength={50}
          className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none resize-y"
          placeholder="Share your experience with this provider. What treatments did you receive? How was the consultation process? (min 50 characters)"
        />
      </div>

      <div>
        <label htmlFor="peptidesUsed" className="block text-sm font-medium text-text-secondary mb-1.5">
          Peptides Used
        </label>
        <input
          id="peptidesUsed"
          name="peptidesUsed"
          type="text"
          className="w-full px-4 py-2.5 bg-surface-1 border border-border-medium rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
          placeholder="e.g. BPC-157, Semaglutide"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="wouldRecommend"
          name="wouldRecommend"
          type="checkbox"
          defaultChecked
          className="w-4 h-4 rounded border-border-medium accent-accent"
        />
        <label htmlFor="wouldRecommend" className="text-sm text-text-secondary">
          I would recommend this provider
        </label>
      </div>

      <div className="bg-surface-1 border border-border-subtle rounded-lg p-3">
        <p className="text-xs text-text-tertiary leading-relaxed">
          By submitting, you confirm that you received treatment from this provider. Reviews are moderated
          for authenticity per FTC guidelines. Your email is used for verification only and will not be displayed.
        </p>
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status === "submitting" ? "Submitting..." : "Submit Review"}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-400">{errorMessage}</p>
      )}
    </form>
  );
}
