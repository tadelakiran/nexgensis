/**
 * Types for the DummyJSON payloads.
 *
 * These mirror what the API actually returns — I verified each shape with live
 * requests rather than assuming the documented version was current. Fields the
 * API may omit are optional so a missing key degrades to `undefined` instead of
 * a runtime crash.
 */

export interface Review {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ProductMeta {
  createdAt: string;
  updatedAt: string;
  barcode: string;
  qrCode: string;
}

/**
 * How a product got into the list. `created`/`updated` mark rows that exist only
 * in the local overlay because DummyJSON discards writes.
 */
export type LocalChangeKind = "created" | "updated";

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku?: string;
  weight?: number;
  dimensions?: ProductDimensions;
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
  reviews?: Review[];
  returnPolicy?: string;
  minimumOrderQuantity?: number;
  meta?: ProductMeta;
  images: string[];
  thumbnail: string;
  /** Set by the local overlay; never sent to the API. */
  localChange?: LocalChangeKind;
}

/** Envelope returned by `/products`, `/products/search` and `/products/{category}`. */
export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

/** `/products/categories` returns objects, not plain strings. */
export interface Category {
  slug: string;
  name: string;
  url: string;
}

/** Login request body. */
export interface LoginCredentials {
  username: string;
  password: string;
  expiresInMins?: number;
}

/** `/auth/login` response — the token plus a flat user profile. */
export interface LoginResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
  accessToken: string;
  refreshToken: string;
}

/** The subset of the login response we keep in state and localStorage. */
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
}

/** Editable fields of the add/edit product form. */
export interface ProductFormValues {
  title: string;
  description: string;
  category: string;
  brand: string;
  price: string;
  stock: string;
  rating: string;
  thumbnail: string;
}

/** Write payload sent to DummyJSON (numbers, not form strings). */
export interface ProductWritePayload {
  title: string;
  description: string;
  category: string;
  brand?: string;
  price: number;
  stock: number;
  rating: number;
  thumbnail?: string;
}
