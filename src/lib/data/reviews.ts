import type { ProviderReview } from "./schemas";
import reviewsData from "./reviews.json";

const reviews: ProviderReview[] = reviewsData as ProviderReview[];

export function getReviewsByProvider(providerSlug: string): ProviderReview[] {
  return reviews.filter((r) => r.providerSlug === providerSlug);
}

export function getReviewStats(providerSlug: string): { count: number; avgRating: number } | null {
  const providerReviews = getReviewsByProvider(providerSlug);
  if (providerReviews.length === 0) return null;
  const avg = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
  return { count: providerReviews.length, avgRating: Math.round(avg * 10) / 10 };
}
