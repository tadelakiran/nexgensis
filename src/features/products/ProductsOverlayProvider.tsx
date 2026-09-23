"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { STORAGE_KEYS } from "@/lib/constants";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage";
import {
  buildCreatedProduct,
  buildUpdatedPatch,
  createEmptyOverlay,
  hydrateOverlay,
  isOverlayEmpty,
  overlayChangeCount,
  type ProductOverlay,
} from "@/features/products/lib/product-overlay";
import type { Product, ProductWritePayload } from "@/types/api";

import { ProductsOverlayContext, type ProductsOverlayContextValue } from "./overlay-context";

/**
 * Holds the add/edit/delete changes that DummyJSON refuses to persist.
 *
 * Kept in React state (so the whole app re-renders when it changes) and mirrored
 * to localStorage (so a refresh does not lose the demo changes). Every mutating
 * method takes the *already-validated* payload: validation lives in
 * `features/products/lib/validation.ts` and the API call lives in the hook that
 * triggers it, which keeps this provider focused on state.
 */
export function ProductsOverlayProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<ProductOverlay>(createEmptyOverlay);
  const [isReady, setIsReady] = useState(false);

  /*
   * Load whatever the last session left behind.
   *
   * Same reasoning as the auth rehydration: localStorage does not exist on the
   * server, so reading it during render would produce a hydration mismatch (the
   * header's change counter and any locally created rows would appear on the
   * client but not in the server HTML). Reading it in an effect is the safe order.
   */
  /* eslint-disable react-hooks/set-state-in-effect -- client-only storage read; see note above */
  useEffect(() => {
    setOverlay(hydrateOverlay(readStorage(STORAGE_KEYS.overlay)));
    setIsReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* Persist on every change. Skipped until the initial read finishes, otherwise
     the first render would overwrite stored data with an empty overlay. */
  useEffect(() => {
    if (!isReady) return;
    if (isOverlayEmpty(overlay)) {
      removeStorage(STORAGE_KEYS.overlay);
      return;
    }
    writeStorage(STORAGE_KEYS.overlay, JSON.stringify(overlay));
  }, [overlay, isReady]);

  const addCreated = useCallback(
    (apiResult: Product | null, payload: ProductWritePayload): Product => {
      // Built outside the state updater so the updater stays pure and can be
      // called twice by React's StrictMode double-invoke without double-adding.
      const product = buildCreatedProduct(apiResult, payload, overlay.nextId);

      setOverlay((current) => ({
        ...current,
        created: [product, ...current.created],
        nextId: overlay.nextId + 1,
      }));

      return product;
    },
    [overlay.nextId],
  );

  const applyUpdate = useCallback(
    (id: number, payload: ProductWritePayload, previous: Product | null) => {
      const patch = buildUpdatedPatch(payload, previous);

      setOverlay((current) => {
        // A locally created row is stored whole, so edit it in place.
        if (current.created.some((product) => product.id === id)) {
          return {
            ...current,
            created: current.created.map((product) =>
              product.id === id
                ? { ...product, ...patch, localChange: "created" as const }
                : product,
            ),
          };
        }

        // A server row is stored as a patch so the next fetch stays authoritative
        // for every field the user did not touch.
        const key = String(id);
        const existing = current.updated[key] ?? {};
        return {
          ...current,
          updated: { ...current.updated, [key]: { ...existing, ...patch } },
        };
      });
    },
    [],
  );

  const applyDelete = useCallback((id: number) => {
    setOverlay((current) => {
      // Removing something that only ever existed locally: drop it outright.
      if (current.created.some((product) => product.id === id)) {
        const updated = { ...current.updated };
        delete updated[String(id)];
        return {
          ...current,
          created: current.created.filter((product) => product.id !== id),
          updated,
        };
      }

      if (current.deleted.includes(id)) return current;
      return { ...current, deleted: [...current.deleted, id] };
    });
  }, []);

  const discardChanges = useCallback(() => {
    setOverlay(createEmptyOverlay());
    removeStorage(STORAGE_KEYS.overlay);
  }, []);

  const changeCount = overlayChangeCount(overlay);

  const value = useMemo<ProductsOverlayContextValue>(
    () => ({
      overlay,
      changeCount,
      hasChanges: changeCount > 0,
      isReady,
      addCreated,
      applyUpdate,
      applyDelete,
      discardChanges,
    }),
    [overlay, changeCount, isReady, addCreated, applyUpdate, applyDelete, discardChanges],
  );

  return (
    <ProductsOverlayContext.Provider value={value}>
      {children}
    </ProductsOverlayContext.Provider>
  );
}
