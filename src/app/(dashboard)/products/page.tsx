import { Suspense } from "react";

import { ProductsSkeleton } from "@/features/products/components/ProductsSkeleton";
import { ProductsView } from "@/features/products/components/ProductsView";

/**
 * A client component that calls `useSearchParams` must sit inside a Suspense
 * boundary, otherwise the production build fails with "Missing Suspense boundary
 * with useSearchParams". `ProductsView` reads the view state from the URL, so the
 * boundary is required — and it doubles as the first-load skeleton.
 */
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsSkeleton rows={10} />}>
      <ProductsView />
    </Suspense>
  );
}
