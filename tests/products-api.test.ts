import { describe, expect, it } from "vitest";

import { buildProductsRequest, type FetchProductsOptions } from "@/lib/api/products";

/**
 * `buildProductsRequest` is the single place that decides which endpoint a view
 * state maps to. It is exported and pure precisely so this rule can be tested —
 * it encodes the answer to "what happens when someone searches inside a category?".
 */

const build = (options: Partial<FetchProductsOptions> = {}) =>
  buildProductsRequest({ page: 1, limit: 10, ...options });

describe("buildProductsRequest", () => {
  it("defaults to the full product list with limit/skip pagination", () => {
    expect(build()).toEqual({ url: "/products", params: { limit: 10, skip: 0 } });
  });

  it("translates a page number into an offset", () => {
    expect(build({ page: 3, limit: 20 }).params).toMatchObject({ limit: 20, skip: 40 });
    expect(build({ page: 1, limit: 50 }).params).toMatchObject({ limit: 50, skip: 0 });
  });

  it("switches to the search endpoint when there is a term", () => {
    expect(build({ q: "phone" })).toEqual({
      url: "/products/search",
      params: { limit: 10, skip: 0, q: "phone" },
    });
  });

  it("trims the search term", () => {
    expect(build({ q: "  phone  " }).params.q).toBe("phone");
  });

  it("prefers search over category when both are somehow present", () => {
    // Verified against the live API: /products/search?q=phone&category=smartphones
    // silently ignores `category` and returns matches from every category. Sending
    // a parameter that does nothing is worse than not sending it, so it is dropped.
    const request = build({ q: "phone", category: "smartphones" });

    expect(request.url).toBe("/products/search");
    expect(request.params).not.toHaveProperty("category");
  });

  it("uses the category endpoint when only a category is set", () => {
    expect(build({ category: "smartphones" })).toEqual({
      url: "/products/category/smartphones",
      params: { limit: 10, skip: 0 },
    });
  });

  it("encodes the category slug so a malformed value cannot break the path", () => {
    expect(build({ category: "a/b c" }).url).toBe("/products/category/a%2Fb%20c");
  });

  it("ignores blank search and category values", () => {
    expect(build({ q: "   ", category: "  " })).toEqual({
      url: "/products",
      params: { limit: 10, skip: 0 },
    });
  });

  it("adds sortBy and order together", () => {
    expect(build({ sort: "price", order: "desc" }).params).toMatchObject({
      sortBy: "price",
      order: "desc",
    });
  });

  it("omits sorting entirely for the default order", () => {
    const params = build({ sort: "default", order: "desc" }).params;
    expect(params).not.toHaveProperty("sortBy");
    expect(params).not.toHaveProperty("order");
  });

  it("passes the delay parameter used by the slow-mode toggle", () => {
    expect(build({ delayMs: 2000 }).params.delay).toBe(2000);
    expect(build({ delayMs: 0 }).params).not.toHaveProperty("delay");
  });

  it("combines search, sorting and pagination", () => {
    expect(build({ q: "phone", sort: "rating", order: "desc", page: 2, limit: 10 })).toEqual({
      url: "/products/search",
      params: { limit: 10, skip: 10, q: "phone", sortBy: "rating", order: "desc" },
    });
  });
});
