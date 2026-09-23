"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import { isSameQuery, parseQuery, queryToParams, type ProductQuery } from "@/lib/url-query";

/**
 * URL as the state container for the products screen.
 *
 * `useSearchParams` only returns a read-only view, so this hook pairs it with the
 * router to write changes back. Three deliberate choices:
 *
 *   - Search text is written with `replace` (see `SearchInput`), because a history
 *     entry per typing pause would make the Back button useless.
 *   - Everything else is written with `push`, so Back steps through the pages and
 *     filters the user actually visited.
 *   - `scroll: false` stops Next from jumping to the top on every change; the page
 *     scrolls the results into view itself when the page number changes.
 *
 * The hook also *repairs* the URL. `parseQuery` normalises every value, so
 * re-serialising what it parsed gives the canonical form; if that differs from
 * what is in the address bar, the URL is rewritten once. That is how
 * `?page=abc&limit=7&order=sideways` becomes a clean `?page=1` without the user
 * ever seeing an error, and it converges immediately because the canonical form
 * parses back to itself.
 */

export interface SetQueryOptions {
  /** Replace the history entry instead of pushing a new one. */
  replace?: boolean;
}

export interface UseProductQueryResult {
  query: ProductQuery;
  setQuery: (patch: Partial<ProductQuery>, options?: SetQueryOptions) => void;
}

export function useProductQuery(): UseProductQueryResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = useMemo(() => parseQuery(searchParams), [searchParams]);

  const rawQueryString = searchParams.toString();
  const canonicalQueryString = useMemo(() => queryToParams(query).toString(), [query]);

  useEffect(() => {
    if (rawQueryString === canonicalQueryString) return;

    const href = canonicalQueryString ? `${pathname}?${canonicalQueryString}` : pathname;
    // `replace` not `push`: normalising a URL should not add a history entry the
    // user has to press Back through.
    router.replace(href, { scroll: false });
  }, [rawQueryString, canonicalQueryString, pathname, router]);

  const setQuery = useCallback(
    (patch: Partial<ProductQuery>, options: SetQueryOptions = {}) => {
      const current = parseQuery(searchParams);
      const next: ProductQuery = { ...current, ...patch };

      // Guard: re-selecting the current category, or a debounced value that
      // already matches the URL, must not trigger a navigation (which would mean
      // another API request for identical results).
      if (isSameQuery(next, current)) return;

      const serialised = queryToParams(next).toString();
      const href = serialised ? `${pathname}?${serialised}` : pathname;

      if (options.replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [pathname, router, searchParams],
  );

  return { query, setQuery };
}
