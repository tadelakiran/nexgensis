"use client";

import { useCallback, useRef, useState } from "react";

import { useProductsOverlay } from "@/features/products/hooks/useProductsOverlay";
import {
  createProduct as createProductRequest,
  deleteProduct as deleteProductRequest,
  updateProduct as updateProductRequest,
} from "@/services/products.service";
import type { Product, ProductFormValues } from "@/types/api";
import { formValuesToPayload } from "@/features/products/lib/validation";

/**
 * Add / edit / delete.
 *
 * Each action does two things: performs the real HTTP request through the shared
 * Axios client (so validation, auth headers and error handling are genuine), then
 * records the outcome in the local overlay so the change is actually visible —
 * DummyJSON discards writes.
 *
 * Duplicate submissions are blocked with a `Set` in a ref, *not* with React
 * state. State is asynchronous, so two clicks in the same tick would both observe
 * `isCreating === false` and fire two requests. The ref is mutated synchronously
 * inside the handler, which closes that window. The `isCreating` state still
 * exists, but only to show the spinner and disable the button.
 *
 * Errors are deliberately not swallowed: they propagate as `ApiError` so the
 * calling component can decide how to report them (toast, inline message, …).
 */

export interface ProductMutationState {
  isCreating: boolean;
  updatingId: number | null;
  deletingId: number | null;
  /** Resolves to the created product, or `null` if the call was already in flight. */
  create: (values: ProductFormValues) => Promise<Product | null>;
  update: (product: Product, values: ProductFormValues) => Promise<boolean>;
  remove: (product: Product) => Promise<boolean>;
}

export function useProductMutations(): ProductMutationState {
  const { addCreated, applyUpdate, applyDelete } = useProductsOverlay();

  const [isCreating, setIsCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const inFlightRef = useRef<Set<string>>(new Set());

  const create = useCallback(
    async (values: ProductFormValues): Promise<Product | null> => {
      if (inFlightRef.current.has("create")) return null;
      inFlightRef.current.add("create");
      setIsCreating(true);

      try {
        const payload = formValuesToPayload(values);
        const apiResult = await createProductRequest(payload);
        // DummyJSON answers 201 with the fields we sent plus an id it will never
        // reuse consistently, so the overlay keeps its own id.
        return addCreated(apiResult, payload);
      } finally {
        inFlightRef.current.delete("create");
        setIsCreating(false);
      }
    },
    [addCreated],
  );

  const update = useCallback(
    async (product: Product, values: ProductFormValues): Promise<boolean> => {
      const key = `update:${product.id}`;
      if (inFlightRef.current.has(key)) return false;
      inFlightRef.current.add(key);
      setUpdatingId(product.id);

      try {
        const payload = formValuesToPayload(values);

        // A locally created row carries an id DummyJSON has never seen, so
        // PUT /products/1001 would 404. The overlay is the only store that knows
        // about it, so we skip the request and apply the edit locally.
        if (product.localChange !== "created") {
          await updateProductRequest(product.id, payload);
        }

        applyUpdate(product.id, payload, product);
        return true;
      } finally {
        inFlightRef.current.delete(key);
        setUpdatingId(null);
      }
    },
    [applyUpdate],
  );

  const remove = useCallback(
    async (product: Product): Promise<boolean> => {
      const key = `delete:${product.id}`;
      if (inFlightRef.current.has(key)) return false;
      inFlightRef.current.add(key);
      setDeletingId(product.id);

      try {
        // Same reasoning as `update`: never DELETE an id the API does not know.
        if (product.localChange !== "created") {
          await deleteProductRequest(product.id);
        }

        applyDelete(product.id);
        return true;
      } finally {
        inFlightRef.current.delete(key);
        setDeletingId(null);
      }
    },
    [applyDelete],
  );

  return { isCreating, updatingId, deletingId, create, update, remove };
}
