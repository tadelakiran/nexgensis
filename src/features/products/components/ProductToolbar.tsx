"use client";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/form-controls";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  FilterIcon,
  InfoIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import { type SortField } from "@/lib/constants";
import type { Category } from "@/types/api";
import type { ProductQuery } from "@/features/products/lib/url-query";
import { SearchInput } from "./SearchInput";

/**
 * The filter bar.
 *
 * Every control writes straight to the URL (through the handlers in
 * `ProductsView`), so URL and screen state are always the same thing.
 *
 * The search box is disabled while a category is active. That is the visible
 * consequence of the one API limitation in this task: DummyJSON cannot search
 * inside a category, so allowing both would mean showing results that contradict
 * a filter the user can still see. The rule is enforced in both directions —
 * typing a search clears the category — and explained with an inline note rather
 * than left as a mystery.
 */

interface ProductToolbarProps {
  query: ProductQuery;
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  onRetryCategories: () => void;
  onSearch: (value: string) => void;
  onCategoryChange: (slug: string) => void;
  onSortChange: (sort: SortField) => void;
  onToggleOrder: () => void;
  slowMode: boolean;
  onToggleSlowMode: (enabled: boolean) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  isFetching: boolean;
}

const SORT_LABELS: Record<SortField, string> = {
  default: "Default order",
  title: "Title",
  price: "Price",
  rating: "Rating",
};

function ControlLabel({ children, htmlFor }: { children: string; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-slate-500">
      {children}
    </label>
  );
}

export function ProductToolbar({
  query,
  categories,
  categoriesLoading,
  categoriesError,
  onRetryCategories,
  onSearch,
  onCategoryChange,
  onSortChange,
  onToggleOrder,
  slowMode,
  onToggleSlowMode,
  onReset,
  hasActiveFilters,
  isFetching,
}: ProductToolbarProps) {
  const searchDisabled = query.category !== "";

  // If the URL names a category the API does not know (e.g. ?category=banana),
  // show it as an extra option so the select reflects the URL instead of looking
  // empty and broken.
  const hasUnknownCategory =
    query.category !== "" && !categories.some((entry) => entry.slug === query.category);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Search */}
        <div className="lg:col-span-5">
          <ControlLabel htmlFor="product-search">Search</ControlLabel>
          <SearchInput
            value={query.q}
            onCommit={onSearch}
            disabled={searchDisabled}
            isBusy={isFetching}
            placeholder={
              searchDisabled ? "Clear the category filter to search" : "Search products…"
            }
          />
        </div>

        {/* Category */}
        <div className="lg:col-span-3">
          <ControlLabel htmlFor="product-category">Category</ControlLabel>
          <Select
            id="product-category"
            value={query.category}
            onChange={(event) => onCategoryChange(event.target.value)}
            disabled={categoriesLoading}
            className="h-11"
          >
            <option value="">
              {categoriesLoading ? "Loading categories…" : "All categories"}
            </option>
            {hasUnknownCategory ? (
              <option value={query.category}>{query.category} (unknown)</option>
            ) : null}
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Sort + direction */}
        <div className="lg:col-span-3">
          <ControlLabel htmlFor="product-sort">Sort by</ControlLabel>
          <div className="flex gap-2">
            <Select
              id="product-sort"
              value={query.sort}
              onChange={(event) => onSortChange(event.target.value as SortField)}
              className="h-11"
            >
              {(Object.keys(SORT_LABELS) as SortField[]).map((field) => (
                <option key={field} value={field}>
                  {SORT_LABELS[field]}
                </option>
              ))}
            </Select>

            <Button
              variant="secondary"
              size="md"
              onClick={onToggleOrder}
              disabled={query.sort === "default"}
              aria-label={`Sort ${query.order === "asc" ? "ascending" : "descending"}. Click to reverse.`}
              title={query.sort === "default" ? "Choose a sort field first" : undefined}
              className="h-11 shrink-0 px-3"
            >
              {query.order === "asc" ? (
                <ArrowUpIcon className="size-4" />
              ) : (
                <ArrowDownIcon className="size-4" />
              )}
              <span className="text-xs font-bold tracking-wide uppercase">{query.order}</span>
            </Button>
          </div>
        </div>

        {/* Reset */}
        <div className="flex items-end lg:col-span-1">
          <Button
            variant="ghost"
            onClick={onReset}
            disabled={!hasActiveFilters}
            aria-label="Reset all filters"
            className="h-11 w-full"
          >
            <RefreshIcon className="size-4" />
            <span className="lg:hidden xl:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* Footer row: status + demo switch */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <FilterIcon className="size-4 shrink-0 text-slate-400" />
          {categoriesError ? (
            <span className="flex items-center gap-2 text-rose-600">
              Could not load categories.
              <button
                type="button"
                onClick={onRetryCategories}
                className="font-semibold underline underline-offset-2"
              >
                Retry
              </button>
            </span>
          ) : searchDisabled ? (
            <span className="flex items-center gap-1.5">
              <InfoIcon className="size-3.5 shrink-0 text-brand-500" />
              Searching is unavailable while a category is selected — the API cannot do both at
              once. Clear the category to search.
            </span>
          ) : (
            <span>
              Typing a search clears any category filter, because the API cannot do both at
              once.
            </span>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={slowMode}
          onClick={() => onToggleSlowMode(!slowMode)}
          title="Adds &delay=2000 to every request so slow-response bugs are reproducible."
          className="inline-flex items-center gap-2.5 text-xs font-semibold text-slate-600"
        >
          <span
            className={[
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
              slowMode ? "bg-brand-600" : "bg-slate-300",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block size-5 rounded-full bg-white shadow transition-transform",
                slowMode ? "translate-x-[1.25rem]" : "translate-x-0.5",
              ].join(" ")}
            />
          </span>
          Slow mode · 2s delay
        </button>
      </div>
    </div>
  );
}
