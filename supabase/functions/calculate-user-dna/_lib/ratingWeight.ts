// Descriptive DNA remains positive: a badly rated film is still part of history.
// Signed preference scoring is handled separately by the recommendation engine.
export function ratingWeight(rating: number | null): number {
  if (rating == null || !Number.isFinite(rating) || rating < 0.5 || rating > 5) return 1;
  const points = [0.4, 0.45, 0.6, 0.85, 1.3, 1.8];
  const lower = Math.floor(rating);
  return points[lower] + (rating - lower) * ((points[Math.min(lower + 1, 5)]) - points[lower]);
}
