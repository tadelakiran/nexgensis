import { describe, expect, it } from "vitest";

import {
  buildPageWindow,
  formatShowingRange,
  pageAfterMutation,
  pageRangeFor,
  totalPagesFor,
} from "@/lib/pagination";

/**
 * The brief asks for "Showing 21–40 of 194" and page numbers, so these are the
 * calculations behind that label. 194 products and a page size of 10 is the real
 * DummyJSON catalogue, used throughout as the reference case.
 */

describe("totalPagesFor", () => {
  it("computes the last page for the real catalogue", () => {
    expect(totalPagesFor(194, 10)).toBe(20);
    expect(totalPagesFor(194, 20)).toBe(10);
    expect(totalPagesFor(194, 50)).toBe(4);
  });

  it("always reports at least one page so page 1 exists", () => {
    expect(totalPagesFor(0, 10)).toBe(1);
    expect(totalPagesFor(-5, 10)).toBe(1);
    expect(totalPagesFor(Number.NaN, 10)).toBe(1);
    expect(totalPagesFor(194, 0)).toBe(1);
  });

  it("rounds up a partial final page", () => {
    expect(totalPagesFor(11, 10)).toBe(2);
    expect(totalPagesFor(20, 10)).toBe(2);
  });
});

describe("pageRangeFor", () => {
  it("matches the range from the brief", () => {
    expect(pageRangeFor(3, 10, 194)).toEqual({ from: 21, to: 30 });
  });

  it("uses 1-based inclusive bounds", () => {
    expect(pageRangeFor(1, 10, 194)).toEqual({ from: 1, to: 10 });
  });

  it("clamps the last page to the total", () => {
    expect(pageRangeFor(20, 10, 194)).toEqual({ from: 191, to: 194 });
  });

  it("reports 0–0 for an empty result set", () => {
    expect(pageRangeFor(1, 10, 0)).toEqual({ from: 0, to: 0 });
  });

  it("reports 0–0 for a page past the end instead of claiming rows that do not exist", () => {
    expect(pageRangeFor(999, 10, 194)).toEqual({ from: 0, to: 0 });
  });
});

describe("formatShowingRange", () => {
  it("formats the label from the brief", () => {
    expect(formatShowingRange(pageRangeFor(3, 10, 194), 194)).toBe("Showing 21–30 of 194");
  });

  it("uses thousands separators for large numbers", () => {
    expect(formatShowingRange({ from: 9901, to: 9910 }, 12345)).toBe(
      "Showing 9,901–9,910 of 12,345",
    );
  });

  it("says so plainly when there is nothing to show", () => {
    expect(formatShowingRange({ from: 0, to: 0 }, 0)).toBe("No products to show");
  });
});

describe("buildPageWindow", () => {
  it("lists every page when the list is short", () => {
    expect(buildPageWindow(1, 4)).toEqual([1, 2, 3, 4]);
    expect(buildPageWindow(2, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("always includes the first and last page with gaps between", () => {
    expect(buildPageWindow(10, 20)).toEqual([1, "gap", 8, 9, 10, 11, 12, "gap", 20]);
  });

  it("does not add a gap when the first page is already adjacent", () => {
    // Window 2–6 touches page 1, so there is nothing to elide before it.
    expect(buildPageWindow(4, 20)).toEqual([1, 2, 3, 4, 5, 6, "gap", 20]);
  });

  it("keeps the window width at the start of the range", () => {
    expect(buildPageWindow(1, 20)).toEqual([1, 2, 3, 4, 5, "gap", 20]);
  });

  it("keeps the window width at the end of the range", () => {
    expect(buildPageWindow(20, 20)).toEqual([1, "gap", 16, 17, 18, 19, 20]);
  });

  it("handles a single page", () => {
    expect(buildPageWindow(1, 1)).toEqual([1]);
  });
});

describe("pageAfterMutation", () => {
  it("steps back when the last page disappears", () => {
    // 191 rows left at 10 per page = 20 pages, so page 21 must become 20.
    expect(pageAfterMutation(21, 191, 10)).toBe(20);
  });

  it("leaves a valid page alone", () => {
    expect(pageAfterMutation(3, 194, 10)).toBe(3);
  });

  it("never returns less than 1", () => {
    expect(pageAfterMutation(5, 0, 10)).toBe(1);
  });
});
