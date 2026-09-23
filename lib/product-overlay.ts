import { LOCAL_ID_BASE, type SortField, type SortOrder } from "./constants";
import type { Product, ProductWritePayload } from "./types";
import type { ProductQuery } from "./url-query";

/**
 * The local overlay — how add / edit / delete are made visible.
 *
 * DummyJSON accepts writes and answers with a realistic payload, but persists
 * nothing: a follow-up GET returns the original record (verified by PUTting a new
 * title and then re-fetching, and by deleting id 1 and re-fetching). A demo that
 * only called the API would therefore look broken.
 *
 * The approach:
 *   1. still perform the real HTTP call, so requests, validation and error
 *      handling are genuine and the user sees real server behaviour;
 *   2. keep the outcome in this overlay, which is merged over every server
 *      response;
 *   3. persist the overlay to localStorage so changes survive a refresh.
 *
 * `created` holds whole local products (DummyJSON reuses a single id for new
 * records, so we allocate our own above the real 1..194 range), `updated` holds
 * per-id patches, and `deleted` holds ids to hide. Everything here is pure so it
 * can be unit tested without React.
 */

export interface ProductOverlay {
  created: Product[];
  updated: Record<string, Partial<Product>>;
  deleted: number[];
  /** Next free local id. Persisted so ids stay unique across reloads. */
  nextId: number;
}

export function createEmptyOverlay(): ProductOverlay {
  return { created: [], updated: {}, deleted: [], nextId: LOCAL_ID_BASE + 1 };
}

export function isOverlayEmpty(overlay: ProductOverlay): boolean {
  return (
    overlay.created.length === 0 &&
    overlay.deleted.length === 0 &&
    Object.keys(overlay.updated).length === 0
  );
}

/** How many records the user has touched, for the "local changes" badge. */
export function overlayChangeCount(overlay: ProductOverlay): number {
  return (
    overlay.created.length + overlay.deleted.length + Object.keys(overlay.updated).length
  );
}

/**
 * The "of N" figure shown to the user.
 *
 * Locally created rows are invented, so they are not part of DummyJSON's `total`,
 * and locally deleted rows are still counted by it. Adjusting both keeps the
 * pagination label consistent with what is actually rendered. Created rows are
 * only counted when they match the active view, otherwise a product created while
 * a category filter is applied would inflate the count of a list it is not in.
 *
 * This is an approximation for a demo: the server remains the source of truth for
 * ordering and page boundaries.
 */
export function overlayAdjustedTotalForQuery(
  serverTotal: number,
  overlay: ProductOverlay,
  query: ProductQuery,
): number {
  const matchingCreated = overlay.created.filter((product) => matchesQuery(product, query)).length;
  return Math.max(0, serverTotal + matchingCreated - overlay.deleted.length);
}

/* ------------------------------------------------------------------ *
 * Reading localStorage
 * ------------------------------------------------------------------ */

function isProductLike(value: unknown): value is Product {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Product).id === "number" &&
    typeof (value as Product).title === "string"
  );
}

/**
 * Parse and repair a persisted overlay.
 *
 * Anything malformed is dropped field by field instead of throwing, because this
 * data comes from a store the user can edit by hand.
 */
export function hydrateOverlay(raw: string | null): ProductOverlay {
  const base = createEmptyOverlay();
  if (!raw || raw.trim() === "") return base;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return base;

    const candidate = parsed as Partial<ProductOverlay>;

    const created = Array.isArray(candidate.created)
      ? candidate.created.filter(isProductLike)
      : [];

    const deleted = Array.isArray(candidate.deleted)
      ? candidate.deleted.filter((id): id is number => typeof id === "number" && Number.isFinite(id))
      : [];

    const updated: Record<string, Partial<Product>> = {};
    if (candidate.updated && typeof candidate.updated === "object") {
      for (const [key, value] of Object.entries(candidate.updated)) {
        if (Number.isFinite(Number(key)) && typeof value === "object" && value !== null) {
          updated[key] = value as Partial<Product>;
        }
      }
    }

    const nextId =
      typeof candidate.nextId === "number" && candidate.nextId > LOCAL_ID_BASE
        ? Math.floor(candidate.nextId)
        : base.nextId;

    return { created, updated, deleted, nextId };
  } catch {
    return base;
  }
}

/* ------------------------------------------------------------------ *
 * Merging
 * ------------------------------------------------------------------ */

/** Apply a stored patch and tag the row so the UI can mark it as locally edited. */
function withPatch(product: Product, overlay: ProductOverlay): Product {
  const patch = overlay.updated[String(product.id)];
  if (!patch) return product;
  return { ...product, ...patch, localChange: "updated" };
}

function compareValues(a: string | number, b: string | number): number {
  const left = typeof a === "number" ? a : null;
  const right = typeof b === "number" ? b : null;
  if (left !== null && right !== null) {
    if (left === right) return 0;
    return left < right ? -1 : 1;
  }
  const leftText = String(a);
  const rightText = String(b);
  if (leftText === rightText) return 0;
  return leftText < rightText ? -1 : 1;
}

function sortValue(product: Product, sort: SortField): string | number {
  if (sort === "title") return product.title.toLowerCase();
  if (sort === "price") return product.price;
  return product.rating;
}

/**
 * Sort an array of products locally.
 *
 * Only used for the locally created rows we pin to the top of page 1 — server
 * results already arrive sorted, and re-sorting a single page would scramble a
 * global ordering we cannot see.
 */
export function sortProducts(
  products: Product[],
  sort: SortField,
  order: SortOrder,
): Product[] {
  if (sort === "default") return products;
  const direction = order === "desc" ? -1 : 1;

  return [...products].sort((a, b) => {
    const result = compareValues(sortValue(a, sort), sortValue(b, sort));
    if (result !== 0) return result * direction;
    // Stable, deterministic tie-break so equal values never swap between renders.
    return a.id - b.id;
  });
}

/**
 * Does a locally created product belong in the current view?
 *
 * Matching the active search/category keeps "new product" rows from appearing
 * while the user is looking at a filter that excludes them.
 */
export function matchesQuery(product: Product, query: ProductQuery): boolean {
  const term = query.q.trim().toLowerCase();
  if (term) {
    const haystack =
      `${product.title} ${product.brand ?? ""} ${product.category} ${product.description}`.toLowerCase();
    if (!haystack.includes(term)) return false;
  }
  if (query.category && product.category !== query.category) return false;
  return true;
}

export interface ApplyToListOptions {
  /**
   * Show locally created rows. Only page 1 does this: a fabricated row has no
   * meaningful position in the server's global order, so pinning it to the first
   * page is the honest simplification (documented in the README).
   */
  includeCreated?: boolean;
  /** The active view state, used to filter and sort the pinned rows. */
  query?: ProductQuery;
}

/** Merge the overlay over one page of server results. */
export function applyOverlayToList(
  products: Product[],
  overlay: ProductOverlay,
  options: ApplyToListOptions = {},
): Product[] {
  const deletedIds = new Set(overlay.deleted);

  const fromServer = products
    .filter((product) => !deletedIds.has(product.id))
    .map((product) => withPatch(product, overlay));

  if (!options.includeCreated) return fromServer;

  const pinned = overlay.created
    .filter((product) => !deletedIds.has(product.id))
    .filter((product) => (options.query ? matchesQuery(product, options.query) : true))
    .map((product) => withPatch(product, overlay));

  if (pinned.length === 0) return fromServer;

  const ordered = options.query
    ? sortProducts(pinned, options.query.sort, options.query.order)
    : pinned;

  return [...ordered, ...fromServer];
}

/**
 * Resolve a product id against the overlay before hitting the API.
 *
 * Returns `undefined` when this is not a locally created id (so the caller
 * should fetch it), `null` when it is known to be gone, or the product itself.
 */
export function resolveLocalProduct(
  id: number,
  overlay: ProductOverlay,
): Product | null | undefined {
  const created = overlay.created.find((product) => product.id === id);
  if (!created) return undefined;
  if (overlay.deleted.includes(id)) return null;
  return withPatch(created, overlay);
}

/** Apply overlay state to a product fetched from the API; `null` means deleted. */
export function applyOverlayToFetchedProduct(
  product: Product,
  overlay: ProductOverlay,
): Product | null {
  if (overlay.deleted.includes(product.id)) return null;
  return withPatch(product, overlay);
}

/* ------------------------------------------------------------------ *
 * Writing
 * ------------------------------------------------------------------ */

/**
 * Build the local product stored after a successful POST /products/add.
 *
 * `apiResult` is the object DummyJSON echoed back. We keep our own id because the
 * API returns the same id (195) for every creation since it stores nothing, and
 * reusing it would collide across multiple adds.
 */
export function buildCreatedProduct(
  apiResult: Product | null,
  payload: ProductWritePayload,
  localId: number,
): Product {
  const thumbnail = payload.thumbnail ?? "";

  return {
    id: localId,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    brand: payload.brand,
    price: payload.price,
    stock: payload.stock,
    rating: payload.rating,
    discountPercentage: 0,
    tags: [],
    images: thumbnail ? [thumbnail] : [],
    thumbnail,
    reviews: [],
    availabilityStatus: payload.stock > 0 ? "In Stock" : "Out of Stock",
    // Provenance kept for debugging: the id DummyJSON claimed it created.
    sku: apiResult?.sku,
    localChange: "created",
  };
}

/** Fields a PUT should change in the local copy of a server product. */
export function buildUpdatedPatch(
  payload: ProductWritePayload,
  previous: Product | null,
): Partial<Product> {
  return {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    brand: payload.brand,
    price: payload.price,
    stock: payload.stock,
    rating: payload.rating,
    ...(payload.thumbnail
      ? { thumbnail: payload.thumbnail, images: [payload.thumbnail] }
      : previous
        ? { thumbnail: previous.thumbnail, images: previous.images }
        : {}),
    availabilityStatus: payload.stock > 0 ? "In Stock" : "Out of Stock",
  };
}
