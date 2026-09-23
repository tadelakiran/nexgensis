import { http } from "@/lib/axios";
import type { PageSize, SortField, SortOrder } from "@/lib/constants";
import type { Category, Product, ProductWritePayload, ProductsResponse } from "@/types/api";

/**
 * Every products-related HTTP call lives here — no `fetch`/`axios` call is ever
 * written inside a component, which keeps the UI code about rendering only.
 */

export interface FetchProductsOptions {
  page: number;
  limit: PageSize;
  q?: string;
  category?: string;
  sort?: SortField;
  order?: SortOrder;
  /** DummyJSON's `delay` parameter, driven by the UI's "Slow mode" toggle. */
  delayMs?: number;
}

export interface ProductsRequest {
  url: string;
  params: Record<string, string | number>;
}

/**
 * Decide which endpoint and parameters satisfy the current view state.
 *
 * Exported and pure on purpose: this function *is* the documented answer to
 * "what happens when someone searches inside a category?". DummyJSON supports
 * either a text search OR a category listing, never both —
 * `/products/search?q=phone&category=smartphones` silently drops `category`
 * (verified: it returns all 23 "phone" matches across every category, not just
 * the 16 smartphones). The UI therefore keeps the two controls mutually
 * exclusive, and this function prefers search if both somehow arrive.
 */
export function buildProductsRequest(options: FetchProductsOptions): ProductsRequest {
  const { page, limit, q, category, sort = "default", order = "asc", delayMs } = options;

  const params: Record<string, string | number> = {
    limit,
    skip: (page - 1) * limit,
  };

  if (sort !== "default") {
    params.sortBy = sort;
    params.order = order;
  }

  if (delayMs && delayMs > 0) {
    params.delay = delayMs;
  }

  const query = (q ?? "").trim();
  const slug = (category ?? "").trim();

  if (query) {
    params.q = query;
    return { url: "/products/search", params };
  }

  if (slug) {
    return { url: `/products/category/${encodeURIComponent(slug)}`, params };
  }

  return { url: "/products", params };
}

/** GET /products | /products/search?q= | /products/category/{slug} */
export async function fetchProducts(
  options: FetchProductsOptions,
  signal?: AbortSignal,
): Promise<ProductsResponse> {
  const { url, params } = buildProductsRequest(options);
  const { data } = await http.get<ProductsResponse>(url, { params, signal });
  return data;
}

/** GET /products/{id} — throws an ApiError with status 404 for an unknown id. */
export async function fetchProduct(id: number, signal?: AbortSignal): Promise<Product> {
  const { data } = await http.get<Product>(`/products/${id}`, { signal });
  return data;
}

/** GET /products/categories */
export async function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  const { data } = await http.get<Category[]>("/products/categories", { signal });
  return data;
}

/* ------------------------------------------------------------------ *
 * Writes.
 *
 * Verified behaviour: DummyJSON answers these with 201/200 and a realistic
 * payload, but the change is thrown away server-side — a follow-up GET returns
 * the original record. We still perform the real HTTP call (so the client layer
 * is exercised, validated and error-handled for real) and then keep the result
 * in a local overlay. See `lib/product-overlay.ts`.
 * ------------------------------------------------------------------ */

/** POST /products/add */
export async function createProduct(payload: ProductWritePayload): Promise<Product> {
  const { data } = await http.post<Product>("/products/add", payload);
  return data;
}

/** PUT /products/{id} */
export async function updateProduct(
  id: number,
  payload: ProductWritePayload,
): Promise<Product> {
  const { data } = await http.put<Product>(`/products/${id}`, payload);
  return data;
}

/** DELETE /products/{id} */
export async function deleteProduct(id: number): Promise<Product> {
  const { data } = await http.delete<Product>(`/products/${id}`);
  return data;
}
