// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useProductsQuery } from "@/hooks/useProductsQuery";
import { ApiError } from "@/lib/axios";
import type { Product, ProductsResponse } from "@/lib/types";
import { DEFAULT_QUERY, type ProductQuery } from "@/lib/url-query";

/**
 * The race condition the brief calls out: "if the user types fast, old search
 * results must never replace new ones".
 *
 * These tests simulate the worst case by ignoring the AbortSignal entirely — the
 * superseded request is allowed to resolve *after* the newer one, exactly as a
 * slow network would. Only the request-id guard can save the UI there, so this is
 * a test of the guard rather than of the abort.
 *
 * The product API module is mocked so the tests never touch the network.
 */

vi.mock("@/lib/api/products", () => ({ fetchProducts: vi.fn() }));

import { fetchProducts } from "@/lib/api/products";

const mockFetchProducts = vi.mocked(fetchProducts);

function makeProduct(id: number, title = `Product ${id}`): Product {
  return {
    id,
    title,
    description: "Description",
    category: "beauty",
    price: 10,
    discountPercentage: 0,
    rating: 4,
    stock: 5,
    tags: [],
    images: [],
    thumbnail: "",
    reviews: [],
  };
}

function makeResponse(id: number): ProductsResponse {
  return { products: [makeProduct(id)], total: 1, skip: 0, limit: 10 };
}

/** A promise whose resolution the test controls. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const queryWith = (partial: Partial<ProductQuery>): ProductQuery => ({
  ...DEFAULT_QUERY,
  ...partial,
});

beforeEach(() => {
  mockFetchProducts.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("useProductsQuery", () => {
  it("ignores a slow response that arrives after a newer one", async () => {
    const slowSearch = deferred<ProductsResponse>();
    const fastSearch = deferred<ProductsResponse>();

    mockFetchProducts.mockImplementation((options) =>
      options.q === "slow" ? slowSearch.promise : fastSearch.promise,
    );

    const { result, rerender } = renderHook(
      ({ query }: { query: ProductQuery }) => useProductsQuery(query),
      { initialProps: { query: queryWith({ q: "slow" }) } },
    );

    // The user keeps typing, replacing the first search with a second one.
    rerender({ query: queryWith({ q: "fast" }) });

    // The newer request finishes first.
    await act(async () => {
      fastSearch.resolve(makeResponse(2));
    });
    await waitFor(() => expect(result.current.products[0]?.id).toBe(2));

    // The older request now finishes, long after it was superseded.
    await act(async () => {
      slowSearch.resolve(makeResponse(1));
    });

    // It must be dropped: nothing about the view may change.
    expect(result.current.products[0]?.id).toBe(2);
    expect(result.current.total).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it("never shows a stale result even when several requests are in flight", async () => {
    const first = deferred<ProductsResponse>();
    const second = deferred<ProductsResponse>();
    const third = deferred<ProductsResponse>();

    const responses: Record<string, Promise<ProductsResponse>> = {
      a: first.promise,
      b: second.promise,
      c: third.promise,
    };
    mockFetchProducts.mockImplementation((options) => responses[options.q ?? ""]);

    const { result, rerender } = renderHook(
      ({ query }: { query: ProductQuery }) => useProductsQuery(query),
      { initialProps: { query: queryWith({ q: "a" }) } },
    );

    rerender({ query: queryWith({ q: "b" }) });
    rerender({ query: queryWith({ q: "c" }) });

    // Resolve out of order: the newest first, then everything older.
    await act(async () => {
      third.resolve(makeResponse(3));
    });
    await act(async () => {
      second.resolve(makeResponse(2));
    });
    await act(async () => {
      first.resolve(makeResponse(1));
    });

    expect(result.current.products[0]?.id).toBe(3);
  });

  it("aborts the in-flight request when the view changes", async () => {
    const signals: (AbortSignal | undefined)[] = [];
    mockFetchProducts.mockImplementation((_options, signal) => {
      signals.push(signal);
      return new Promise<ProductsResponse>(() => {
        // Never settles: the request is only ever ended by the abort.
      });
    });

    const { rerender, unmount } = renderHook(
      ({ query }: { query: ProductQuery }) => useProductsQuery(query),
      { initialProps: { query: queryWith({ q: "first" }) } },
    );

    expect(signals[0]?.aborted).toBe(false);

    rerender({ query: queryWith({ q: "second" }) });
    await waitFor(() => expect(signals[0]?.aborted).toBe(true));

    unmount();
    await waitFor(() => expect(signals[1]?.aborted).toBe(true));
  });

  it("does not report a request it cancelled itself as an error", async () => {
    mockFetchProducts.mockImplementation((_options, signal) => {
      return new Promise<ProductsResponse>((_resolve, reject) => {
        signal?.addEventListener("abort", () =>
          reject(new ApiError("Request superseded", { kind: "canceled" })),
        );
      });
    });

    const { result, rerender } = renderHook(
      ({ query }: { query: ProductQuery }) => useProductsQuery(query),
      { initialProps: { query: queryWith({ q: "first" }) } },
    );

    rerender({ query: queryWith({ q: "second" }) });

    // Give the rejection a chance to propagate.
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBeNull();
  });

  it("distinguishes the first load from a page change", async () => {
    // Deferred rather than pre-resolved, so each stage of the test asserts on a
    // request that is genuinely still in flight instead of racing a microtask.
    const firstLoad = deferred<ProductsResponse>();
    mockFetchProducts.mockReturnValueOnce(firstLoad.promise);

    const { result, rerender } = renderHook(
      ({ query }: { query: ProductQuery }) => useProductsQuery(query),
      { initialProps: { query: DEFAULT_QUERY } },
    );

    // Nothing for this view yet: the table is replaced by the skeleton.
    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.isFetching).toBe(true);
    expect(result.current.products).toEqual([]);

    await act(async () => {
      firstLoad.resolve(makeResponse(1));
    });
    expect(result.current.products[0]?.id).toBe(1);
    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);

    const pageTwo = deferred<ProductsResponse>();
    mockFetchProducts.mockReturnValueOnce(pageTwo.promise);

    // Flipping to page 2 keeps the same view: the existing rows stay on screen and
    // are only dimmed, instead of flashing back to a skeleton.
    act(() => {
      rerender({ query: queryWith({ page: 2 }) });
    });
    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.isFetching).toBe(true);

    // A stale row from page 1 is still visible until page 2 arrives, but it is
    // never presented as page 2's data because the skeleton/dim state covers it.
    await act(async () => {
      pageTwo.resolve(makeResponse(11));
    });
  });

  it("surfaces a failure and clears it on retry", async () => {
    mockFetchProducts.mockRejectedValueOnce(
      new ApiError("Could not reach the server.", { kind: "network" }),
    );
    mockFetchProducts.mockResolvedValueOnce(makeResponse(7));

    const { result } = renderHook(({ query }: { query: ProductQuery }) => useProductsQuery(query), {
      initialProps: { query: DEFAULT_QUERY },
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe("Could not reach the server.");
    // An error replaces the skeleton rather than sitting behind it.
    expect(result.current.isInitialLoading).toBe(false);

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.products[0]?.id).toBe(7));
    expect(result.current.error).toBeNull();
  });

  it("requests the page the query describes", () => {
    // Never settles: this test only inspects the request that was made.
    mockFetchProducts.mockImplementation(() => new Promise<ProductsResponse>(() => {}));

    renderHook(({ query }: { query: ProductQuery }) => useProductsQuery(query), {
      initialProps: { query: queryWith({ page: 4, limit: 20 }) },
    });

    expect(mockFetchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 4, limit: 20 }),
      expect.any(AbortSignal),
    );
  });

  it("passes a delay through in slow mode so the race can be reproduced on demand", () => {
    mockFetchProducts.mockImplementation(() => new Promise<ProductsResponse>(() => {}));

    renderHook(({ query }: { query: ProductQuery }) => useProductsQuery(query, { slowMode: true }), {
      initialProps: { query: DEFAULT_QUERY },
    });

    expect(mockFetchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ delayMs: 2000 }),
      expect.any(AbortSignal),
    );
  });
});
