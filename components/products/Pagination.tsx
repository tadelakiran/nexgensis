"use client";

import { Badge } from "@/components/ui/Badge";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { PAGE_SIZES, type PageSize } from "@/lib/constants";
import {
  buildPageWindow,
  formatShowingRange,
  pageRangeFor,
  totalPagesFor,
} from "@/lib/pagination";
import { formatNumber } from "@/lib/format";

/**
 * Pagination bar.
 *
 * The arithmetic lives in `lib/pagination.ts` (unit tested separately); this file
 * only turns numbers into buttons. "Showing 21–40 of 194" is derived from the same
 * range the table renders, so the label can never disagree with the rows.
 */

interface PaginationProps {
  page: number;
  pageSize: PageSize;
  total: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}

const NAV_BUTTON =
  "inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45";

export function Pagination({
  page,
  pageSize,
  total,
  isFetching,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = totalPagesFor(total, pageSize);
  const range = pageRangeFor(page, pageSize, total);
  const window = buildPageWindow(page, totalPages);

  const canGoBack = page > 1;
  const canGoForward = page < totalPages;

  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/60 px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between sm:px-5">
      {/* Range + page size */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm text-slate-600" aria-live="polite">
          {formatShowingRange(range, total)}
        </p>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="whitespace-nowrap">Per page</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value) as PageSize)}
            disabled={isFetching}
            aria-label="Products per page"
            className="h-9 cursor-pointer rounded-xl bg-white px-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:opacity-60"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        {isFetching ? <Badge tone="brand">Updating…</Badge> : null}
      </div>

      {/* Page controls */}
      <nav className="flex items-center gap-1.5" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoBack || isFetching}
          className={`${NAV_BUTTON} text-slate-700 ring-1 ring-slate-200 hover:bg-white hover:ring-slate-300`}
        >
          <ChevronLeftIcon className="size-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <ul className="flex items-center gap-1">
          {window.map((token, index) =>
            token === "gap" ? (
              <li
                key={`gap-${index}`}
                aria-hidden="true"
                className="px-1.5 text-sm text-slate-400 select-none"
              >
                …
              </li>
            ) : (
              <li key={token}>
                <button
                  type="button"
                  onClick={() => onPageChange(token)}
                  disabled={isFetching}
                  aria-current={token === page ? "page" : undefined}
                  aria-label={`Go to page ${formatNumber(token)}`}
                  className={[
                    "inline-flex size-9 items-center justify-center rounded-xl text-sm font-semibold transition",
                    token === page
                      ? "bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-md shadow-brand-600/25"
                      : "text-slate-600 ring-1 ring-slate-200 hover:bg-white hover:text-slate-900 hover:ring-slate-300",
                  ].join(" ")}
                >
                  {token}
                </button>
              </li>
            ),
          )}
        </ul>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoForward || isFetching}
          className={`${NAV_BUTTON} text-slate-700 ring-1 ring-slate-200 hover:bg-white hover:ring-slate-300`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRightIcon className="size-4" />
        </button>
      </nav>
    </div>
  );
}
