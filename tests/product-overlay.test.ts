import { describe, expect, it } from "vitest";

import { DEFAULT_QUERY } from "@/lib/url-query";
import type { Product, ProductWritePayload } from "@/lib/types";
import {
  applyOverlayToList,
  applyOverlayToFetchedProduct,
  buildCreatedProduct,
  buildUpdatedPatch,
  createEmptyOverlay,
  hydrateOverlay,
  isOverlayEmpty,
  matchesQuery,
  overlayAdjustedTotalForQuery,
  resolveLocalProduct,
  sortProducts,
  type ProductOverlay,
} from "@/lib/product-overlay";

/**
 * The brief: "Add, edit and delete are not really saved by the API. Show the change
 * in the app anyway." This module is that mechanism, so it gets the most tests.
 */

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    title: "Essence Mascara",
    description: "A popular mascara.",
    category: "beauty",
    price: 9.99,
    discountPercentage: 10.48,
    rating: 2.56,
    stock: 99,
    tags: [],
    images: ["https://cdn.dummyjson.com/a.webp"],
    thumbnail: "https://cdn.dummyjson.com/a.webp",
    reviews: [],
    ...overrides,
  };
}

const payload: ProductWritePayload = {
  title: "New Widget",
  description: "A brand new widget.",
  category: "beauty",
  price: 12.5,
  stock: 5,
  rating: 4,
};

describe("applyOverlayToList", () => {
  it("returns server rows untouched when there is no overlay", () => {
    const products = [makeProduct(), makeProduct({ id: 2 })];
    const result = applyOverlayToList(products, createEmptyOverlay());
    expect(result).toHaveLength(2);
    expect(result[0].localChange).toBeUndefined();
  });

  it("hides products the user deleted locally", () => {
    const overlay: ProductOverlay = { ...createEmptyOverlay(), deleted: [1] };
    const result = applyOverlayToList([makeProduct(), makeProduct({ id: 2 })], overlay);
    expect(result.map((product) => product.id)).toEqual([2]);
  });

  it("applies a local edit and marks the row", () => {
    const overlay: ProductOverlay = {
      ...createEmptyOverlay(),
      updated: { "1": { title: "Renamed", price: 1.5 } },
    };
    const [edited] = applyOverlayToList([makeProduct()], overlay);
    expect(edited.title).toBe("Renamed");
    expect(edited.price).toBe(1.5);
    // Untouched fields keep the server's value.
    expect(edited.category).toBe("beauty");
    expect(edited.localChange).toBe("updated");
  });

  it("lets a local delete beat a local edit", () => {
    const overlay: ProductOverlay = {
      ...createEmptyOverlay(),
      deleted: [1],
      updated: { "1": { title: "Renamed" } },
    };
    expect(applyOverlayToList([makeProduct()], overlay)).toEqual([]);
  });

  it("pins locally created rows above the server rows only when asked", () => {
    const created = [makeProduct({ id: 1001, title: "Mine", localChange: "created" })];
    const overlay: ProductOverlay = { ...createEmptyOverlay(), created };
    const server = [makeProduct({ id: 1 })];

    expect(applyOverlayToList(server, overlay)).toHaveLength(1);
    expect(applyOverlayToList(server, overlay, { includeCreated: true })[0].id).toBe(1001);
  });

  it("filters pinned rows by the active view", () => {
    const overlay: ProductOverlay = {
      ...createEmptyOverlay(),
      created: [makeProduct({ id: 1001, category: "laptops" })],
    };
    const server = [makeProduct({ id: 1 })];

    // A created laptop should not appear while the beauty category is selected.
    const filtered = applyOverlayToList(server, overlay, {
      includeCreated: true,
      query: { ...DEFAULT_QUERY, category: "beauty" },
    });
    expect(filtered.map((product) => product.id)).toEqual([1]);
  });

  it("orders pinned rows by the active sort", () => {
    const overlay: ProductOverlay = {
      ...createEmptyOverlay(),
      created: [
        makeProduct({ id: 1001, title: "B", price: 5 }),
        makeProduct({ id: 1002, title: "A", price: 50 }),
      ],
    };
    const sorted = applyOverlayToList([], overlay, {
      includeCreated: true,
      query: { ...DEFAULT_QUERY, sort: "price", order: "desc" },
    });
    expect(sorted.map((product) => product.price)).toEqual([50, 5]);
  });
});

describe("sortProducts", () => {
  const items = [
    makeProduct({ id: 1, title: "banana", price: 2, rating: 5 }),
    makeProduct({ id: 2, title: "Apple", price: 10, rating: 1 }),
    makeProduct({ id: 3, title: "cherry", price: 5, rating: 3 }),
  ];

  it("leaves the order alone for the default sort", () => {
    expect(sortProducts(items, "default", "asc")).toBe(items);
  });

  it("sorts by title case-insensitively", () => {
    expect(sortProducts(items, "title", "asc").map((p) => p.title)).toEqual([
      "Apple",
      "banana",
      "cherry",
    ]);
  });

  it("sorts numerically by price and rating in both directions", () => {
    expect(sortProducts(items, "price", "asc").map((p) => p.price)).toEqual([2, 5, 10]);
    expect(sortProducts(items, "price", "desc").map((p) => p.price)).toEqual([10, 5, 2]);
    expect(sortProducts(items, "rating", "desc").map((p) => p.rating)).toEqual([5, 3, 1]);
  });

  it("breaks ties by id so the order is stable", () => {
    const tied = [
      makeProduct({ id: 9, price: 4 }),
      makeProduct({ id: 4, price: 4 }),
    ];
    expect(sortProducts(tied, "price", "asc").map((p) => p.id)).toEqual([4, 9]);
  });

  it("does not mutate its input", () => {
    const copy = [...items];
    sortProducts(items, "price", "asc");
    expect(items).toEqual(copy);
  });
});

describe("matchesQuery", () => {
  const product = makeProduct({ title: "Wireless Headphones", brand: "Sony" });

  it("matches on title, brand and description case-insensitively", () => {
    expect(matchesQuery(product, { ...DEFAULT_QUERY, q: "headphones" })).toBe(true);
    expect(matchesQuery(product, { ...DEFAULT_QUERY, q: "sony" })).toBe(true);
    expect(matchesQuery(product, { ...DEFAULT_QUERY, q: "POPULAR" })).toBe(true);
    expect(matchesQuery(product, { ...DEFAULT_QUERY, q: "laptop" })).toBe(false);
  });

  it("requires an exact category match", () => {
    expect(matchesQuery(product, { ...DEFAULT_QUERY, category: "beauty" })).toBe(true);
    expect(matchesQuery(product, { ...DEFAULT_QUERY, category: "laptops" })).toBe(false);
  });
});

describe("resolveLocalProduct", () => {
  it("returns undefined for an id that only the API knows", () => {
    expect(resolveLocalProduct(1, createEmptyOverlay())).toBeUndefined();
  });

  it("returns a locally created product", () => {
    const created = makeProduct({ id: 1001 });
    const overlay: ProductOverlay = { ...createEmptyOverlay(), created: [created] };
    expect(resolveLocalProduct(1001, overlay)).toEqual(created);
  });

  it("returns null for a locally created product that was then deleted", () => {
    const overlay: ProductOverlay = {
      ...createEmptyOverlay(),
      created: [makeProduct({ id: 1001 })],
      deleted: [1001],
    };
    expect(resolveLocalProduct(1001, overlay)).toBeNull();
  });
});

describe("applyOverlayToFetchedProduct", () => {
  it("returns null when the user deleted it", () => {
    const overlay: ProductOverlay = { ...createEmptyOverlay(), deleted: [1] };
    expect(applyOverlayToFetchedProduct(makeProduct(), overlay)).toBeNull();
  });

  it("merges a pending edit", () => {
    const overlay: ProductOverlay = {
      ...createEmptyOverlay(),
      updated: { "1": { title: "Edited" } },
    };
    expect(applyOverlayToFetchedProduct(makeProduct(), overlay)?.title).toBe("Edited");
  });
});

describe("buildCreatedProduct", () => {
  it("uses our own id rather than the one the API echoes back", () => {
    // DummyJSON answers every creation with id 195 because it stores nothing, so
    // reusing it would collide across multiple adds.
    const echoed = makeProduct({ id: 195, sku: "NEW-001" });
    const created = buildCreatedProduct(echoed, payload, 1001);

    expect(created.id).toBe(1001);
    expect(created.localChange).toBe("created");
    expect(created.title).toBe("New Widget");
    expect(created.sku).toBe("NEW-001");
  });

  it("fills the fields the create endpoint does not return", () => {
    const created = buildCreatedProduct(null, payload, 1001);
    expect(created.rating).toBe(4);
    expect(created.discountPercentage).toBe(0);
    expect(created.reviews).toEqual([]);
    expect(created.availabilityStatus).toBe("In Stock");
  });

  it("derives images from the optional thumbnail", () => {
    const withImage = buildCreatedProduct(
      null,
      { ...payload, thumbnail: "https://example.com/x.jpg" },
      1001,
    );
    expect(withImage.images).toEqual(["https://example.com/x.jpg"]);
    expect(buildCreatedProduct(null, payload, 1002).images).toEqual([]);
  });

  it("reports out of stock for zero stock", () => {
    expect(buildCreatedProduct(null, { ...payload, stock: 0 }, 1001).availabilityStatus).toBe(
      "Out of Stock",
    );
  });
});

describe("buildUpdatedPatch", () => {
  it("maps every editable field", () => {
    const patch = buildUpdatedPatch(payload, makeProduct());
    expect(patch).toMatchObject({
      title: "New Widget",
      price: 12.5,
      stock: 5,
      category: "beauty",
      availabilityStatus: "In Stock",
    });
  });

  it("keeps the existing image when the form left it blank", () => {
    const previous = makeProduct();
    expect(buildUpdatedPatch(payload, previous).thumbnail).toBe(previous.thumbnail);
  });

  it("replaces the image when a new one is given", () => {
    const patch = buildUpdatedPatch(
      { ...payload, thumbnail: "https://example.com/new.jpg" },
      makeProduct(),
    );
    expect(patch.images).toEqual(["https://example.com/new.jpg"]);
  });
});

describe("overlayAdjustedTotalForQuery", () => {
  it("adds created rows and removes deleted ones", () => {
    const overlay: ProductOverlay = {
      ...createEmptyOverlay(),
      created: [makeProduct({ id: 1001, category: "beauty" })],
      deleted: [1, 2],
    };
    expect(overlayAdjustedTotalForQuery(194, overlay, DEFAULT_QUERY)).toBe(193);
  });

  it("only counts created rows that match the active filter", () => {
    const overlay: ProductOverlay = {
      ...createEmptyOverlay(),
      created: [makeProduct({ id: 1001, category: "laptops" })],
    };
    expect(
      overlayAdjustedTotalForQuery(16, overlay, { ...DEFAULT_QUERY, category: "beauty" }),
    ).toBe(16);
  });

  it("never reports a negative total", () => {
    const overlay: ProductOverlay = { ...createEmptyOverlay(), deleted: [1, 2, 3] };
    expect(overlayAdjustedTotalForQuery(0, overlay, DEFAULT_QUERY)).toBe(0);
  });
});

describe("hydrateOverlay", () => {
  it("returns an empty overlay for missing or unreadable data", () => {
    expect(hydrateOverlay(null)).toEqual(createEmptyOverlay());
    expect(hydrateOverlay("")).toEqual(createEmptyOverlay());
    expect(hydrateOverlay("{not json")).toEqual(createEmptyOverlay());
    expect(hydrateOverlay('"a string"')).toEqual(createEmptyOverlay());
  });

  it("round-trips a written overlay", () => {
    const overlay: ProductOverlay = {
      created: [makeProduct({ id: 1001 })],
      updated: { "7": { title: "Edited" } },
      deleted: [3],
      nextId: 1002,
    };
    expect(hydrateOverlay(JSON.stringify(overlay))).toEqual(overlay);
  });

  it("drops entries that are not numbers or products", () => {
    const raw = JSON.stringify({
      created: [makeProduct({ id: 1001 }), { nonsense: true }, null],
      updated: { "7": { title: "ok" }, abc: { title: "bad" } },
      deleted: [3, "4", null],
      nextId: "nope",
    });
    const hydrated = hydrateOverlay(raw);

    expect(hydrated.created.map((product) => product.id)).toEqual([1001]);
    expect(Object.keys(hydrated.updated)).toEqual(["7"]);
    expect(hydrated.deleted).toEqual([3]);
    expect(hydrated.nextId).toBeGreaterThan(1000);
  });

  it("is empty only when nothing at all is changed", () => {
    expect(isOverlayEmpty(createEmptyOverlay())).toBe(true);
    expect(isOverlayEmpty({ ...createEmptyOverlay(), deleted: [1] })).toBe(false);
  });
});
