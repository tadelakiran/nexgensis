import { ProductDetailView } from "@/components/products/ProductDetailView";

export const metadata = {
  title: "Product details",
};

/**
 * Next.js 16 hands route params over as a Promise — synchronous access was removed
 * in this version — so they must be awaited.
 *
 * The raw string is passed through untouched rather than parsed here: validation
 * belongs in `useProductDetail`, which turns `abc`, `1.5` or a missing record into
 * the same deliberate "not found" screen.
 */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailView id={id} />;
}
