"use client";

import { createContext } from "react";

import type { Product, ProductWritePayload } from "@/types/api";
import type { ProductOverlay } from "./lib/product-overlay";

/**
 * The local-overlay context, in its own module so `useProductsOverlay` does not
 * have to import the provider component.
 */

export interface ProductsOverlayContextValue {
  overlay: ProductOverlay;
  /** Number of records the user has created, edited or deleted locally. */
  changeCount: number;
  hasChanges: boolean;
  /** True once localStorage has been read, so the UI can avoid a flash. */
  isReady: boolean;
  addCreated: (apiResult: Product | null, payload: ProductWritePayload) => Product;
  applyUpdate: (id: number, payload: ProductWritePayload, previous: Product | null) => void;
  applyDelete: (id: number) => void;
  discardChanges: () => void;
}

export const ProductsOverlayContext = createContext<ProductsOverlayContextValue | null>(null);
