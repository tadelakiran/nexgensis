import { PAGE_WINDOW } from "./constants";
import { formatNumber } from "./format";

/**
 * Pagination arithmetic, kept out of the components so it can be unit tested
 * (see `tests/pagination.test.ts`) and read on its own.
 */

export interface PageRange {
  /** 1-based index of the first row on this page (0 when there are no rows). */
  from: number;
  /** 1-based index of the last row on this page (0 when there are no rows). */
  to: number;
}

/** Number of pages needed for `total` rows. Always at least 1, so page 1 exists. */
export function totalPagesFor(total: number, pageSize: number): number {
  if (!Number.isFinite(total) || total <= 0) return 1;
  if (!Number.isFinite(pageSize) || pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * Convert a 1-based page into the inclusive row range shown in the header, e.g.
 * page 3 of 10 → rows 21–30.
 */
export function pageRangeFor(page: number, pageSize: number, total: number): PageRange {
  if (total <= 0) return { from: 0, to: 0 };
  const firstIndex = (page - 1) * pageSize;
  // An out-of-range page would compute a `from` past the end; clamp so the label
  // never claims to show rows that do not exist.
  if (firstIndex >= total) return { from: 0, to: 0 };
  return {
    from: firstIndex + 1,
    to: Math.min(firstIndex + pageSize, total),
  };
}

/** "Showing 21–40 of 194", or a plain message when the result set is empty. */
export function formatShowingRange(range: PageRange, total: number): string {
  if (total <= 0) return "No products to show";
  return `Showing ${formatNumber(range.from)}–${formatNumber(range.to)} of ${formatNumber(total)}`;
}

/** A numbered page button, or an ellipsis standing in for a skipped run of pages. */
export type PageToken = number | "gap";

/**
 * Build the window of page buttons: first and last page are always reachable,
 * with an ellipsis between them and the current neighbourhood.
 *
 * e.g. current 7 of 20, window 5 → [1, "gap", 5, 6, 7, 8, 9, "gap", 20]
 */
export function buildPageWindow(
  current: number,
  totalPages: number,
  windowSize: number = PAGE_WINDOW,
): PageToken[] {
  if (totalPages <= 1) return [1];

  const size = Math.max(3, Math.min(windowSize, totalPages));
  // Short lists fit entirely; no ellipsis needed.
  if (totalPages <= size + 2) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const half = Math.floor(size / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(totalPages, start + size - 1);
  // If we ran into the right edge, slide the window back so it keeps its width.
  start = Math.max(1, end - size + 1);
  end = Math.min(totalPages, start + size - 1);

  const tokens: PageToken[] = [];

  if (start > 1) {
    tokens.push(1);
    if (start > 2) tokens.push("gap");
  }

  for (let page = start; page <= end; page += 1) tokens.push(page);

  if (end < totalPages) {
    if (end < totalPages - 1) tokens.push("gap");
    tokens.push(totalPages);
  }

  return tokens;
}

/**
 * The page a user should land on after deleting rows: if the current page became
 * empty, step back one page rather than showing a blank table.
 */
export function pageAfterMutation(page: number, total: number, pageSize: number): number {
  const lastPage = totalPagesFor(total, pageSize);
  return Math.min(page, lastPage);
}
