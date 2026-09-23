"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useProductsOverlay } from "@/features/products/hooks/useProductsOverlay";
import { fetchProduct } from "@/services/products.service";
import { isCanceled, toApiError, type ApiError } from "@/lib/axios";
import { applyOverlayToFetchedProduct, resolveLocalProduct } from "@/features/products/lib/product-overlay";
import type { Product } from "@/types/api";

/**
 * One product for the detail page.
 *
 * Resolution order matters here:
 *   1. A locally created id is answered from the overlay without touching the
 *      network — DummyJSON has never heard of it.
 *   2. Otherwise the API is called, and the overlay is merged on top (pending edits,
 *      or hidden because the user deleted it).
 *   3. A 404 (or an invalid id such as `/products/abc`) becomes "not found", which
 *      is a state the UI renders deliberately rather than an error.
 *
 * Both the success and the failure carry the id they belong to. Without that,
 * navigating between two product pages would render the previous product's data
 * for a frame, and an error from one id could be shown against another.
 */

export interface ProductDetailState {
  product: Product | null;
  isLoading: boolean;
  isNotFound: boolean;
  error: ApiError | null;
  retry: () => void;
}

/** Strict positive-integer parse, so `/products/abc` and `/products/1.5` fail fast. */
function parseProductId(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function useProductDetail(rawId: string): ProductDetailState {
  const { overlay } = useProductsOverlay();
  const id = useMemo(() => parseProductId(rawId), [rawId]);

  const localProduct = useMemo(
    () => (id === null ? undefined : resolveLocalProduct(id, overlay)),
    [id, overlay],
  );

  const [result, setResult] = useState<{ id: number; product: Product } | null>(null);
  const [failure, setFailure] = useState<{ id: number; error: ApiError } | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const retry = useCallback(() => {
    setFailure(null);
    setRetryToken((token) => token + 1);
  }, []);

  useEffect(() => {
    // `undefined` means "not a locally created id"; anything else is already
    // resolved locally (or known to be deleted), so no request is needed.
    if (id === null || localProduct !== undefined) return;

    const controller = new AbortController();
    let cancelled = false;

    fetchProduct(id, controller.signal)
      .then((product) => {
        if (cancelled) return;
        setResult({ id, product });
        setFailure(null);
      })
      .catch((caught: unknown) => {
        if (cancelled || isCanceled(caught)) return;
        setFailure({ id, error: toApiError(caught) });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id, localProduct, retryToken]);

  /* Resolved locally: either the product itself, or `null` meaning deleted. */
  if (localProduct !== undefined) {
    return {
      product: localProduct,
      isLoading: false,
      isNotFound: localProduct === null,
      error: null,
      retry,
    };
  }

  /* Invalid id in the URL — never a network request. */
  if (id === null) {
    return { product: null, isLoading: false, isNotFound: true, error: null, retry };
  }

  const currentError = failure !== null && failure.id === id ? failure.error : null;
  const fetched = result !== null && result.id === id ? result.product : null;

  if (currentError) {
    // 404 is "not found"; everything else is a genuine failure worth retrying.
    const isNotFound = currentError.status === 404;
    return {
      product: null,
      isLoading: false,
      isNotFound,
      error: isNotFound ? null : currentError,
      retry,
    };
  }

  const merged = fetched ? applyOverlayToFetchedProduct(fetched, overlay) : null;

  return {
    product: merged,
    // No data *for this id* yet means we are still loading it.
    isLoading: fetched === null,
    isNotFound: fetched !== null && merged === null,
    error: null,
    retry,
  };
}
