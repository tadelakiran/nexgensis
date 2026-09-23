/**
 * Deterministic formatters.
 *
 * Every formatter pins its locale ("en-US") on purpose. `toLocaleString()` with
 * no argument follows the *runtime's* locale, so the Node server and the browser
 * can disagree — which shows up as a React hydration mismatch in a Next.js app.
 * Pinning the locale makes server and client output identical.
 */

const numberFormatter = new Intl.NumberFormat("en-US");
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});
const ratingFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});
const reviewDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** 194 → "194" */
export function formatNumber(value: number): string {
  return Number.isFinite(value) ? numberFormatter.format(value) : "0";
}

/** 9.99 → "$9.99" */
export function formatPrice(value: number): string {
  return Number.isFinite(value) ? priceFormatter.format(value) : "—";
}

/** 10.48 → "10.5%" */
export function formatPercent(value: number): string {
  return Number.isFinite(value) ? percentFormatter.format(value / 100) : "—";
}

/** 3.95 → "3.95", 4 → "4.0" */
export function formatRating(value: number): string {
  return Number.isFinite(value) ? ratingFormatter.format(value) : "—";
}

/** ISO string → "30 Apr 2025". Invalid input degrades to an em dash. */
export function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return reviewDateFormatter.format(date);
}

/** Price after the product's discount has been applied. */
export function discountedPrice(price: number, discountPercentage: number): number {
  if (!Number.isFinite(price) || !Number.isFinite(discountPercentage)) return price;
  return Math.max(0, price * (1 - discountPercentage / 100));
}
