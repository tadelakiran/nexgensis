"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchCategories } from "@/lib/api/products";
import { isCanceled, toApiError, type ApiError } from "@/lib/axios";
import type { Category } from "@/lib/types";

/**
 * The category filter options.
 *
 * Fetched once per mount and kept independent of the product query: the option
 * list never changes, so a failed category request must not take the whole page
 * down. It degrades to "All categories" plus an inline retry.
 *
 * `isLoading` is derived — "no list and no error" means a request is still in
 * flight — which keeps the effect body free of synchronous `setState` calls.
 */

export interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: ApiError | null;
  retry: () => void;
}

export function useCategories(): CategoriesState {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setRetryToken((token) => token + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    fetchCategories(controller.signal)
      .then((result) => {
        if (cancelled) return;
        setCategories(Array.isArray(result) ? result : []);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled || isCanceled(caught)) return;
        setError(toApiError(caught));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [retryToken]);

  return {
    categories: categories ?? [],
    isLoading: categories === null && error === null,
    error,
    retry,
  };
}
