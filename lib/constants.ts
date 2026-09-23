/**
 * Single source of truth for the values that appear in the URL, in the query
 * string sent to DummyJSON, and in the UI controls.
 *
 * The `as const` arrays double as runtime whitelists. Anything not in them is
 * replaced with a safe default by `lib/url-query.ts`, which is what stops
 * hand-edited URLs such as `?limit=7&order=sideways` from breaking the page
 * (DummyJSON answers `order=sideways` with HTTP 400).
 */

export const API_BASE_URL = "https://dummyjson.com";

/** Page sizes offered in the UI. DummyJSON accepts any limit, so we enforce ours. */
export const PAGE_SIZES = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 10;

/** `default` means "send no sortBy at all" and keeps DummyJSON's natural order. */
export const SORT_FIELDS = ["default", "title", "price", "rating"] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const SORT_ORDERS = ["asc", "desc"] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

/** How long the search box waits after the last keystroke before it hits the API. */
export const SEARCH_DEBOUNCE_MS = 400;

/** Abort a request that hangs so the UI can offer Retry instead of spinning forever. */
export const REQUEST_TIMEOUT_MS = 15_000;

/** Upper bound for `?page=`. Keeps `skip` in a sane range for absurd URLs like `?page=99999999`. */
export const MAX_PAGE = 10_000;

/** How many numbered buttons the pagination bar tries to show at once. */
export const PAGE_WINDOW = 5;

/**
 * Locally created products get ids from this range. DummyJSON's catalogue is
 * 1..194 and it reuses a single id for new items, so we allocate our own ids
 * above the real range to keep them unique in the client store.
 */
export const LOCAL_ID_BASE = 1000;

/** Query-string keys. Referenced everywhere instead of repeating string literals. */
export const QUERY_KEYS = {
  page: "page",
  limit: "limit",
  q: "q",
  category: "category",
  sort: "sort",
  order: "order",
} as const;

/** localStorage keys, namespaced and versioned so a schema change is easy to spot. */
export const STORAGE_KEYS = {
  token: "dja.auth.token",
  user: "dja.auth.user",
  overlay: "dja.products.overlay.v1",
} as const;

/** Shown on the login screen so reviewers can get in without reading the README. */
export const DEMO_CREDENTIALS = {
  username: "emilys",
  password: "emilyspass",
} as const;

/**
 * Optional `delay` query parameter DummyJSON supports. Exposed as a UI toggle so
 * the stale-search-response race can be reproduced on demand instead of only
 * theorised about.
 */
export const SLOW_MODE_DELAY_MS = 2000;
