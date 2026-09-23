/**
 * The products feature's public type surface.
 *
 * This is a barrel of `export type` only, so it costs nothing at runtime and adds
 * no circular-import risk. Each type is still *defined* next to the logic that
 * owns it — `ProductQuery` with the URL parsing, `ProductFormErrors` with the
 * validation rules, `ProductOverlay` with the merge logic — because co-location
 * is what keeps those modules readable. This file exists so a consumer can import
 * everything product-shaped from one obvious place instead of hunting for four.
 *
 * API contract types stay in `@/types/api`, since they describe DummyJSON rather
 * than this feature.
 */

export type {
  Category,
  LocalChangeKind,
  Product,
  ProductDimensions,
  ProductFormValues,
  ProductMeta,
  ProductWritePayload,
  ProductsResponse,
  Review,
} from "@/types/api";

export type { ProductFormErrors } from "./lib/validation";
export type { ProductOverlay } from "./lib/product-overlay";
export type { ProductQuery } from "./lib/url-query";
