import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE,
  PAGE_SIZES,
  QUERY_KEYS,
  SORT_FIELDS,
  SORT_ORDERS,
  type PageSize,
  type SortField,
  type SortOrder,
} from "@/lib/constants";

/**
 * The view state of the products screen, and the only place that translates
 * between a URL query string and that state.
 *
 * Every value the user can change (page, page size, search text, category, sort)
 * lives in the URL. Consequences we get for free:
 *   - refresh keeps the view;
 *   - a shared link opens the same view;
 *   - the browser Back button steps through the user's exploration.
 *
 * `parseQuery` is deliberately paranoid: every field is validated against a
 * whitelist and falls back to a default. That is what makes hand-edited URLs
 * like `?page=abc`, `?limit=7`, `?order=sideways` or `?sort=nonsense` harmless.
 * It matters in practice — DummyJSON answers `order=sideways` with HTTP 400, so
 * a URL that leaked into the app unvalidated would show an error screen instead
 * of a product list.
 */

export interface ProductQuery {
  /** 1-based page number. */
  page: number;
  limit: PageSize;
  q: string;
  category: string;
  sort: SortField;
  order: SortOrder;
}

/**
 * The minimum interface needed to read query values. Both the DOM's
 * `URLSearchParams` and Next's read-only `ReadonlyURLSearchParams` satisfy it,
 * so this module never has to import anything from Next.js and stays unit
 * testable.
 */
export interface QuerySource {
  get(key: string): string | null;
}

export const DEFAULT_QUERY: ProductQuery = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  q: "",
  category: "",
  sort: "default",
  order: "asc",
};

/** Longest search term we accept, so a pasted novel cannot blow up the request. */
const MAX_QUERY_LENGTH = 100;

/**
 * Strict numeric parse: `Number("12abc")` is NaN, so junk is rejected rather
 * than silently truncated the way `parseInt` would do.
 */
function toFiniteNumber(raw: string | null): number | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** `?page=` — anything below 1, non-numeric or absent becomes page 1. */
export function parsePage(raw: string | null): number {
  const value = toFiniteNumber(raw);
  if (value === null) return DEFAULT_QUERY.page;
  const page = Math.floor(value);
  if (page < 1) return DEFAULT_QUERY.page;
  // Only a sanity bound. Whether the page actually exists is decided after the
  // response arrives (see `isPageOutOfRange`), so a huge-but-plausible page
  // still renders a friendly empty state instead of being silently rewritten.
  return Math.min(page, MAX_PAGE);
}

/** `?limit=` — must be exactly 10, 20 or 50. DummyJSON would accept anything. */
export function parseLimit(raw: string | null): PageSize {
  const value = toFiniteNumber(raw);
  const match = PAGE_SIZES.find((size) => size === value);
  return match ?? DEFAULT_PAGE_SIZE;
}

/** `?sort=` — one of the fields we advertise in the UI, else "default". */
export function parseSort(raw: string | null): SortField {
  const candidate = (raw ?? "").trim().toLowerCase();
  return (SORT_FIELDS as readonly string[]).includes(candidate)
    ? (candidate as SortField)
    : DEFAULT_QUERY.sort;
}

/** `?order=` — asc or desc only. */
export function parseOrder(raw: string | null): SortOrder {
  const candidate = (raw ?? "").trim().toLowerCase();
  return (SORT_ORDERS as readonly string[]).includes(candidate)
    ? (candidate as SortOrder)
    : DEFAULT_QUERY.order;
}

/**
 * Read a full, valid `ProductQuery` out of any query source.
 *
 * Normalisation rule: search and category are mutually exclusive (see
 * `buildProductsRequest` for the API reason). If a URL tries to use both — for
 * example an older bookmark — the search term wins and the category is dropped,
 * keeping the UI consistent with the request that will actually be sent.
 */
export function parseQuery(source: QuerySource): ProductQuery {
  const q = (source.get(QUERY_KEYS.q) ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const rawCategory = (source.get(QUERY_KEYS.category) ?? "").trim();

  return {
    page: parsePage(source.get(QUERY_KEYS.page)),
    limit: parseLimit(source.get(QUERY_KEYS.limit)),
    q,
    category: q ? "" : rawCategory,
    sort: parseSort(source.get(QUERY_KEYS.sort)),
    order: parseOrder(source.get(QUERY_KEYS.order)),
  };
}

/**
 * Serialise the state back to a query string.
 *
 * Defaults are omitted so URLs stay short and readable: page 1, page size 10 and
 * "no sort" produce no parameters at all. This also powers URL self-healing —
 * `canonicalQueryString` re-serialises whatever we parsed, so a link like
 * `?page=abc&limit=7` is rewritten to a clean canonical URL on load.
 */
export function queryToParams(query: ProductQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.page > 1) params.set(QUERY_KEYS.page, String(query.page));
  if (query.limit !== DEFAULT_PAGE_SIZE) params.set(QUERY_KEYS.limit, String(query.limit));
  if (query.q) params.set(QUERY_KEYS.q, query.q);
  if (query.category) params.set(QUERY_KEYS.category, query.category);

  // `order` is meaningless without a sort field, so it is only written alongside
  // one. A bare `?order=desc` is therefore dropped by normalisation.
  if (query.sort !== "default") {
    params.set(QUERY_KEYS.sort, query.sort);
    params.set(QUERY_KEYS.order, query.order);
  }

  return params;
}

/** The canonical, cleaned-up query string for a raw one (no leading `?`). */
export function canonicalQueryString(source: QuerySource): string {
  return queryToParams(parseQuery(source)).toString();
}

/** `/products` plus the query string, always in the same key order. */
export function productsHref(query: ProductQuery): string {
  const params = queryToParams(query).toString();
  return params ? `/products?${params}` : "/products";
}

/** True when two queries would produce an identical request. */
export function isSameQuery(a: ProductQuery, b: ProductQuery): boolean {
  return (
    a.page === b.page &&
    a.limit === b.limit &&
    a.q === b.q &&
    a.category === b.category &&
    a.sort === b.sort &&
    a.order === b.order
  );
}

/**
 * A page beyond the end of the result set is a valid URL, and must render an
 * empty state rather than an error. Returns true when the requested page has no
 * rows while earlier pages do.
 */
export function isPageOutOfRange(page: number, total: number, pageSize: number): boolean {
  if (total <= 0) return false;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  return page > lastPage;
}
