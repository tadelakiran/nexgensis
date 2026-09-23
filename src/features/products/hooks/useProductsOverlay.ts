"use client";

import { useContext } from "react";

import {
  ProductsOverlayContext,
  type ProductsOverlayContextValue,
} from "@/features/products/overlay-context";

/**
 * Read and mutate the local add/edit/delete overlay.
 *
 * Throws when used outside the provider, so a misplaced call fails loudly rather
 * than silently losing the user's changes.
 */
export function useProductsOverlay(): ProductsOverlayContextValue {
  const context = useContext(ProductsOverlayContext);
  if (!context) {
    throw new Error("useProductsOverlay must be used inside a <ProductsOverlayProvider>.");
  }
  return context;
}
