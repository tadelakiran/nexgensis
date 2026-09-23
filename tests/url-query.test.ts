import { describe, expect, it } from "vitest";

import {
  canonicalQueryString,
  DEFAULT_QUERY,
  isPageOutOfRange,
  isSameQuery,
  parseLimit,
  parseOrder,
  parsePage,
  parseQuery,
  parseSort,
  productsHref,
  queryToParams,
  type ProductQuery,
} from "@/lib/url-query";

/**
 * The brief calls out `?page=abc` and `?page=999` specifically. These tests pin
 * down that every malformed value degrades to a default instead of reaching the
 * API — DummyJSON answers a bad `order` with HTTP 400, so a URL that leaked
 * through unvalidated would show an error screen.
 */

const fromObject = (params: Record<string, string>) => new URLSearchParams(params);
const overrides = (partial: Partial<ProductQuery>): ProductQuery => ({
  ...DEFAULT_QUERY,
  ...partial,
});

describe("parsePage", () => {
  it("falls back to 1 for missing, empty or non-numeric values", () => {
    expect(parsePage(null)).toBe(1);
    expect(parsePage("")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("12abc")).toBe(1);
    expect(parsePage("-3")).toBe(1);
    expect(parsePage("0")).toBe(1);
  });

  it("keeps a valid page", () => {
    expect(parsePage("7")).toBe(7);
  });

  it("floors decimals and clamps absurd values", () => {
    expect(parsePage("2.9")).toBe(2);
    expect(parsePage("99999999")).toBe(10_000);
  });

  it("treats a huge-but-plausible page as valid so it can be reported, not rewritten", () => {
    // 999 is beyond the last page, but it is legitimate input: the UI shows a
    // friendly empty state rather than silently pretending the user asked for 1.
    expect(parsePage("999")).toBe(999);
  });
});

describe("parseLimit", () => {
  it("only accepts the page sizes the UI offers", () => {
    expect(parseLimit("10")).toBe(10);
    expect(parseLimit("20")).toBe(20);
    expect(parseLimit("50")).toBe(50);
  });

  it("falls back to the default for anything else", () => {
    // DummyJSON accepts limit=7, so the validation has to happen here.
    expect(parseLimit("7")).toBe(10);
    expect(parseLimit("0")).toBe(10);
    expect(parseLimit("xyz")).toBe(10);
    expect(parseLimit(null)).toBe(10);
  });
});

describe("parseSort / parseOrder", () => {
  it("accepts known values case-insensitively", () => {
    expect(parseSort("price")).toBe("price");
    expect(parseSort("PRICE")).toBe("price");
    expect(parseSort("title")).toBe("title");
    expect(parseOrder("desc")).toBe("desc");
    expect(parseOrder("DESC")).toBe("desc");
  });

  it("falls back for unknown values", () => {
    expect(parseSort("banana")).toBe("default");
    expect(parseOrder("sideways")).toBe("asc");
  });
});

describe("parseQuery", () => {
  it("returns the defaults for an empty query string", () => {
    expect(parseQuery(fromObject({}))).toEqual(DEFAULT_QUERY);
  });

  it("reads a full query string", () => {
    expect(
      parseQuery(
        fromObject({ page: "3", limit: "20", q: "phone", sort: "price", order: "desc" }),
      ),
    ).toEqual({ page: 3, limit: 20, q: "phone", category: "", sort: "price", order: "desc" });
  });

  it("survives every broken value at once", () => {
    expect(
      parseQuery(
        fromObject({ page: "abc", limit: "7", sort: "banana", order: "sideways" }),
      ),
    ).toEqual(DEFAULT_QUERY);
  });

  it("drops the category when a search is also present", () => {
    // The API cannot combine them, so the query is normalised to what will
    // actually be requested: search wins.
    const parsed = parseQuery(fromObject({ q: "phone", category: "smartphones" }));
    expect(parsed.q).toBe("phone");
    expect(parsed.category).toBe("");
  });

  it("keeps the category when there is no search", () => {
    expect(parseQuery(fromObject({ category: "laptops" })).category).toBe("laptops");
  });

  it("trims whitespace", () => {
    expect(parseQuery(fromObject({ q: "  phone  " })).q).toBe("phone");
  });
});

describe("queryToParams / canonicalQueryString", () => {
  it("omits defaults so URLs stay short", () => {
    expect(queryToParams(DEFAULT_QUERY).toString()).toBe("");
  });

  it("round-trips through parseQuery", () => {
    const query = overrides({ page: 4, limit: 50, q: "iphone", sort: "rating", order: "desc" });
    const reparsed = parseQuery(new URLSearchParams(queryToParams(query)));
    expect(isSameQuery(reparsed, query)).toBe(true);
  });

  it("only writes `order` alongside a sort field", () => {
    expect(queryToParams(overrides({ order: "desc" })).toString()).toBe("");
    expect(queryToParams(overrides({ sort: "price", order: "desc" })).toString()).toBe(
      "sort=price&order=desc",
    );
  });

  it("repairs a malformed query string", () => {
    expect(canonicalQueryString(fromObject({ page: "abc", limit: "7" }))).toBe("");
    expect(canonicalQueryString(fromObject({ page: "999" }))).toBe("page=999");
    expect(canonicalQueryString(fromObject({ q: "x", category: "laptops" }))).toBe("q=x");
  });
});

describe("productsHref", () => {
  it("returns the bare path for defaults", () => {
    expect(productsHref(DEFAULT_QUERY)).toBe("/products");
  });

  it("includes the query string when set", () => {
    expect(productsHref(overrides({ page: 2, category: "laptops" }))).toBe(
      "/products?page=2&category=laptops",
    );
  });
});

describe("isPageOutOfRange", () => {
  it("is false when the result set is empty", () => {
    // An empty result is "nothing found", not "you went too far".
    expect(isPageOutOfRange(5, 0, 10)).toBe(false);
  });

  it("flags a page past the end", () => {
    expect(isPageOutOfRange(21, 194, 10)).toBe(true);
    expect(isPageOutOfRange(999, 194, 10)).toBe(true);
  });

  it("accepts the last page", () => {
    expect(isPageOutOfRange(20, 194, 10)).toBe(false);
  });
});
