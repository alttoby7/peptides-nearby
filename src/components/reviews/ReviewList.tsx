import type { ProviderReview } from "@/lib/data/schemas";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${star <= rating ? "text-amber-400" : "text-border-medium"}`}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function ReviewList({ reviews }: { reviews: ProviderReview[] }) {
  if (reviews.length === 0) return null;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const recommendPct = Math.round(
    (reviews.filter((r) => r.wouldRecommend).length / reviews.length) * 100
  );

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-text-primary">{avgRating.toFixed(1)}</span>
          <StarRating rating={Math.round(avgRating)} />
        </div>
        <span className="text-sm text-text-tertiary">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </span>
        <span className="text-sm text-text-tertiary">
          {recommendPct}% recommend
        </span>
      </div>

      {/* Individual reviews */}
      <div className="flex flex-col gap-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white border border-border-subtle rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StarRating rating={review.rating} />
                  {review.verifiedVisit && (
                    <span className="text-xs px-2 py-0.5 bg-verified-bg text-verified rounded-full font-medium">
                      Verified Visit
                    </span>
                  )}
                </div>
                {review.title && (
                  <h4 className="font-semibold text-text-primary text-sm">{review.title}</h4>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-text-tertiary">{formatDate(review.visitDate)}</div>
                <div className="text-xs text-text-tertiary capitalize">{review.visitType.replace("-", " ")}</div>
              </div>
            </div>

            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              {review.body}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-text-tertiary">
                {review.reviewerName}
              </span>
              {review.peptidesUsed.length > 0 && (
                <div className="flex gap-1">
                  {review.peptidesUsed.map((p) => (
                    <span key={p} className="text-xs px-2 py-0.5 bg-surface-3 text-text-secondary rounded">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
