"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchProducts } from "@/services/products.service";
import { isCanceled, toApiError, type ApiError } from "@/lib/axios";
import { SLOW_MODE_DELAY_MS } from "@/lib/constants";
import type { Product } from "@/types/api";
import type { ProductQuery } from "@/features/products/lib/url-query";

/**
 * Loads one page of products for the current view state.
 *
 * Two independent mechanisms keep a slow, older response from overwriting a newer
 * one — the bug the brief asks about, reproducible with the "Slow mode" toggle:
 *
 *   1. A monotonically increasing request id. Only the response whose id is still
 *      the newest is allowed to touch state. This is the guarantee that actually
 *      matters, because an abort can arrive after a response has already been
 *      resolved.
 *   2. An `AbortController` per request, aborted in the effect cleanup. This frees
 *      the connection and stops work we no longer need, but it is a performance
 *      measure rather than the correctness one.
 *
 * Aborted requests are dropped silently — they are a normal consequence of typing,
 * not a failure to report.
 *
 * Loading state is *derived* rather than stored. A result is tagged with the view
 * it belongs to, so "we have no data for what is on screen" is a comparison, not a
 * flag that has to be set at the start of the effect. That avoids the cascading
 * render of `setState` in an effect body, and it also removes a real bug: the
 * previous version could briefly render the old product page while the new one was
 * still being fetched.
 */

export interface UseProductsQueryOptions {
  /** Adds DummyJSON's `delay` parameter so races can be demonstrated on demand. */
  slowMode?: boolean;
}

export interface ProductsQueryState {
  products: Product[];
  total: number;
  /** Nothing usable for this view yet: replace the table with the skeleton. */
  isInitialLoading: boolean;
  /** A request is running for a view we can already show: dim the table instead. */
  isFetching: boolean;
  error: ApiError | null;
  retry: () => void;
}

interface LoadedPage {
  /** Identifies the view these rows belong to; see `viewKeyOf`/`requestKeyOf`. */
  viewKey: string;
  /** Which page these rows are, within that view. */
  page: number;
  products: Product[];
  total: number;
}

interface Failure {
  requestKey: string;
  error: ApiError;
}

/**
 * Everything that changes *which* results exist. A page change is deliberately not
 * part of this: flipping pages keeps the same view, so the existing table can stay
 * on screen while the next page loads.
 */
function viewKeyOf(query: ProductQuery, slowMode: boolean): string {
  return [query.limit, query.q, query.category, query.sort, query.order, slowMode ? "slow" : "fast"].join("|");
}

/** The view key plus the page: identifies one exact request. */
function requestKeyOf(query: ProductQuery, slowMode: boolean): string {
  return `${viewKeyOf(query, slowMode)}|page:${query.page}`;
}

export function useProductsQuery(
  query: ProductQuery,
  options: UseProductsQueryOptions = {},
): ProductsQueryState {
  const { slowMode = false } = options;

  const [loaded, setLoaded] = useState<LoadedPage | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const requestIdRef = useRef(0);

  const { page, limit, q, category, sort, order } = query;
  const viewKey = viewKeyOf(query, slowMode);
  const requestKey = requestKeyOf(query, slowMode);

  const retry = useCallback(() => {
    // Clearing the failure is what flips the UI back to a loading state; both
    // calls happen in an event handler, not in an effect.
    setFailure(null);
    setRetryToken((token) => token + 1);
  }, []);

  useEffect(() => {
    // Claim a new request id *before* the request starts. Any response arriving
    // with an older id belongs to a superseded view state.
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const controller = new AbortController();

    fetchProducts(
      {
        page,
        limit,
        q,
        category,
        sort,
        order,
        delayMs: slowMode ? SLOW_MODE_DELAY_MS : undefined,
      },
      controller.signal,
    )
      .then((response) => {
        if (requestId !== requestIdRef.current) return; // superseded — drop it
        setLoaded({
          viewKey,
          page,
          products: response.products,
          total: response.total,
        });
        setFailure(null);
      })
      .catch((caught: unknown) => {
        if (requestId !== requestIdRef.current) return;
        if (isCanceled(caught)) return; // we cancelled it ourselves
        setFailure({ requestKey, error: toApiError(caught) });
      });

    return () => controller.abort();
  }, [page, limit, q, category, sort, order, slowMode, viewKey, requestKey, retryToken]);

  const currentError = failure && failure.requestKey === requestKey ? failure.error : null;
  const hasViewData = loaded !== null && loaded.viewKey === viewKey;

  // Deriving both flags means the skeleton and the "Updating…" indicator always
  // agree with what is actually on screen.
  const isInitialLoading = !hasViewData && currentError === null;
  const isFetching = isInitialLoading || (hasViewData && loaded.page !== page);

  return {
    // Stale rows are only handed out when they still describe the same view.
    products: hasViewData ? loaded.products : [],
    total: hasViewData ? loaded.total : 0,
    isInitialLoading,
    isFetching,
    error: currentError,
    retry,
  };
}
