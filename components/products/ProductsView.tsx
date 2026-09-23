"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { useProductsOverlay } from "@/components/providers/ProductsOverlayProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import { EmptyState, ErrorState } from "@/components/ui/StatePanel";
import { useCategories } from "@/hooks/useCategories";
import { useProductMutations } from "@/hooks/useProductMutations";
import { useProductQuery } from "@/hooks/useProductQuery";
import { useProductsQuery } from "@/hooks/useProductsQuery";
import { toApiError } from "@/lib/axios";
import type { PageSize, SortField } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { pageAfterMutation, totalPagesFor } from "@/lib/pagination";
import {
  applyOverlayToList,
  matchesQuery,
  overlayAdjustedTotalForQuery,
} from "@/lib/product-overlay";
import type { Product, ProductFormValues } from "@/lib/types";
import { isPageOutOfRange } from "@/lib/url-query";
import { Pagination } from "./Pagination";
import { ProductDeleteDialog } from "./ProductDeleteDialog";
import { ProductFormDialog } from "./ProductFormDialog";
import { ProductToolbar } from "./ProductToolbar";
import { ProductsCardList } from "./ProductsCardList";
import { ProductsSkeleton } from "./ProductsSkeleton";
import { ProductsTable } from "./ProductsTable";

/**
 * The products screen.
 *
 * Responsibilities in order of flow:
 *   1. read the view state from the URL (`useProductQuery`, which also repairs
 *      malformed query strings);
 *   2. fetch that page from the API (`useProductsQuery`, which owns the
 *      stale-response guard);
 *   3. merge the local overlay so add/edit/delete are visible
 *      (`applyOverlayToList`);
 *   4. render loading / empty / error / results;
 *   5. own the two dialogs and the mutations they trigger.
 *
 * All requests live in `lib/api/*` and are driven by hooks — there is no Axios
 * call anywhere in this file.
 */

type FormTarget = { mode: "create" } | { mode: "edit"; product: Product } | null;

export function ProductsView() {
  const { query, setQuery } = useProductQuery();
  const { overlay } = useProductsOverlay();
  const { pushToast } = useToast();

  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    retry: retryCategories,
  } = useCategories();

  const { isCreating, updatingId, deletingId, create, update, remove } = useProductMutations();

  const [slowMode, setSlowMode] = useState(false);
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const resultsRef = useRef<HTMLElement>(null);

  const { products, total, isInitialLoading, isFetching, error, retry } = useProductsQuery(
    query,
    { slowMode },
  );

  /* Overlay merged over this page of server results. */
  const rows = useMemo(
    () => applyOverlayToList(products, overlay, { includeCreated: query.page === 1, query }),
    [products, overlay, query],
  );

  const effectiveTotal = overlayAdjustedTotalForQuery(total, overlay, query);
  const lastPage = totalPagesFor(effectiveTotal, query.limit);
  const isOutOfRange = isPageOutOfRange(query.page, effectiveTotal, query.limit);

  const hasActiveFilters =
    query.q !== "" || query.category !== "" || query.sort !== "default";

  /* ------------------------------------------------------------------ *
   * View state changes — every one of them lands in the URL
   * ------------------------------------------------------------------ */

  const goToPage = (page: number) => {
    setQuery({ page: Math.max(1, page) });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePageSize = (limit: PageSize) => setQuery({ limit, page: 1 });

  const handleSearch = useCallback(
    (value: string) => {
      const q = value.trim();

      // The search box commits on mount and whenever the URL changes, so this
      // guard is what stops a shared link such as ?q=phone&page=3 from being
      // rewritten to page 1 just because the input re-committed the same term.
      if (q === query.q) return;

      // Searching clears the category: the API cannot do both, and leaving a
      // category filter visible while it is being ignored would be a lie.
      setQuery({ q, ...(q ? { category: "" } : {}), page: 1 }, { replace: true });
    },
    [setQuery, query.q],
  );

  const handleCategory = (category: string) => {
    // Same rule in the other direction: a category clears any search term.
    setQuery({ category, q: "", page: 1 });
  };

  const handleSort = (sort: SortField) => {
    // Sensible default direction per field: A–Z for titles, "best first" for the
    // numeric fields.
    setQuery({
      sort,
      order: sort === "default" ? query.order : sort === "title" ? "asc" : "desc",
      page: 1,
    });
  };

  const handleToggleOrder = () =>
    setQuery({ order: query.order === "asc" ? "desc" : "asc", page: 1 });

  const handleReset = () =>
    setQuery({ q: "", category: "", sort: "default", order: "asc", page: 1 });

  /* ------------------------------------------------------------------ *
   * Mutations
   * ------------------------------------------------------------------ */

  const handleCreate = async (values: ProductFormValues) => {
    try {
      const created = await create(values);
      if (!created) return; // a duplicate submit was blocked

      setFormTarget(null);

      const isVisible = matchesQuery(created, query);
      pushToast({
        tone: "success",
        title: "Product created",
        description: isVisible
          ? `"${created.title}" is pinned to the top of page 1.`
          : `"${created.title}" was created, but it does not match the current filters, so it is not shown here.`,
      });

      if (query.page !== 1) setQuery({ page: 1 });
    } catch (caught: unknown) {
      // Keep the dialog open so the entered values are not lost.
      pushToast({
        tone: "error",
        title: "Could not create the product",
        description: toApiError(caught).message,
      });
    }
  };

  const handleUpdate = async (values: ProductFormValues) => {
    if (formTarget?.mode !== "edit") return;
    const target = formTarget.product;

    try {
      const ok = await update(target, values);
      if (!ok) return;

      setFormTarget(null);
      pushToast({
        tone: "success",
        title: "Product updated",
        description: `"${values.title}" was saved locally.`,
      });
    } catch (caught: unknown) {
      pushToast({
        tone: "error",
        title: "Could not update the product",
        description: toApiError(caught).message,
      });
    }
  };

  const handleDelete = async (product: Product) => {
    try {
      const ok = await remove(product);
      if (!ok) return;

      setDeleteTarget(null);
      pushToast({
        tone: "success",
        title: "Product deleted",
        description: `"${product.title}" was removed from this view.`,
      });

      // Removing the only row on the page would leave an empty table, so step
      // back to a page that still has content.
      if (rows.length === 1 && query.page > 1) {
        setQuery({
          page: pageAfterMutation(query.page - 1, Math.max(0, effectiveTotal - 1), query.limit),
        });
      }
    } catch (caught: unknown) {
      pushToast({
        tone: "error",
        title: "Could not delete the product",
        description: toApiError(caught).message,
      });
    }
  };

  /* ------------------------------------------------------------------ *
   * Render
   * ------------------------------------------------------------------ */

  const dimWhileRefetching = isFetching && !isInitialLoading;

  const renderResults = () => {
    if (error) {
      return (
        <ErrorState
          error={error}
          onRetry={retry}
          context="products"
          extraAction={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" onClick={handleReset}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      );
    }

    if (isInitialLoading) {
      return <ProductsSkeleton rows={query.limit} />;
    }

    if (rows.length === 0) {
      if (isOutOfRange) {
        return (
          <EmptyState
            title={`Page ${formatNumber(query.page)} is past the end of these results`}
            description={
              <>
                This view has {formatNumber(lastPage)}{" "}
                {lastPage === 1 ? "page" : "pages"}. The link itself is fine — there is simply
                nothing to show this far in. Jump to the last page to continue.
              </>
            }
            action={<Button onClick={() => goToPage(lastPage)}>Go to the last page</Button>}
          />
        );
      }

      return (
        <EmptyState
          title={
            query.q
              ? `No products match “${query.q}”`
              : query.category
                ? "Nothing in this category"
                : "No products available"
          }
          description={
            hasActiveFilters
              ? "Try a different search term, or clear the filters to see the whole catalogue."
              : "The catalogue came back empty. Try loading it again."
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" onClick={handleReset}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={retry}>Try again</Button>
            )
          }
        />
      );
    }

    return (
      <>
        <div
          aria-busy={dimWhileRefetching}
          className={dimWhileRefetching ? "opacity-60 transition-opacity" : "transition-opacity"}
        >
          <ProductsTable
            products={rows}
            onEdit={(product) => setFormTarget({ mode: "edit", product })}
            onDelete={setDeleteTarget}
            updatingId={updatingId}
            deletingId={deletingId}
          />
          <ProductsCardList
            products={rows}
            onEdit={(product) => setFormTarget({ mode: "edit", product })}
            onDelete={setDeleteTarget}
            updatingId={updatingId}
            deletingId={deletingId}
          />
        </div>

        <Pagination
          page={query.page}
          pageSize={query.limit}
          total={effectiveTotal}
          isFetching={isFetching}
          onPageChange={goToPage}
          onPageSizeChange={handlePageSize}
        />
      </>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Products
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {isInitialLoading ? (
              "Loading the catalogue…"
            ) : (
              <>
                {formatNumber(effectiveTotal)} products in the catalogue. Search, filter by
                category, sort, and edit any row.
              </>
            )}
          </p>
        </div>

        <Button size="lg" onClick={() => setFormTarget({ mode: "create" })} className="shrink-0">
          <PlusIcon className="size-4" />
          Add product
        </Button>
      </div>

      <ProductToolbar
        query={query}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError ? categoriesError.message : null}
        onRetryCategories={retryCategories}
        onSearch={handleSearch}
        onCategoryChange={handleCategory}
        onSortChange={handleSort}
        onToggleOrder={handleToggleOrder}
        slowMode={slowMode}
        onToggleSlowMode={setSlowMode}
        onReset={handleReset}
        hasActiveFilters={hasActiveFilters}
        isFetching={isFetching}
      />

      <section
        ref={resultsRef}
        className="animate-slide-up scroll-mt-20 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
      >
        {renderResults()}
      </section>

      <ProductFormDialog
        open={formTarget !== null}
        mode={formTarget?.mode ?? "create"}
        product={formTarget?.mode === "edit" ? formTarget.product : null}
        categories={categories}
        isSubmitting={isCreating || updatingId !== null}
        onSubmit={formTarget?.mode === "edit" ? handleUpdate : handleCreate}
        onClose={() => setFormTarget(null)}
      />

      <ProductDeleteDialog
        product={deleteTarget}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
