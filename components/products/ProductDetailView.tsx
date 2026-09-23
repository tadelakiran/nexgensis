"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useToast } from "@/components/providers/ToastProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Rating } from "@/components/ui/Rating";
import { StockBadge } from "@/components/ui/StockBadge";
import { EmptyState, ErrorState, LoadingSpinner } from "@/components/ui/StatePanel";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import { useCategories } from "@/hooks/useCategories";
import { useProductDetail } from "@/hooks/useProductDetail";
import { useProductMutations } from "@/hooks/useProductMutations";
import { toApiError } from "@/lib/axios";
import { discountedPrice, formatDate, formatNumber, formatPercent, formatPrice } from "@/lib/format";
import type { Product, ProductFormValues } from "@/lib/types";
import { ProductDeleteDialog } from "./ProductDeleteDialog";
import { ProductFormDialog } from "./ProductFormDialog";
import { ProductImage } from "./ProductImage";

/**
 * Product detail screen.
 *
 * The id arrives as a raw string from the URL, so it is validated in
 * `useProductDetail` before any request is made — `/products/abc` renders the
 * "not found" state immediately instead of firing a doomed request.
 */

interface ProductDetailViewProps {
  /** Raw `[id]` segment straight from the route. */
  id: string;
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-sm font-bold tracking-wide text-slate-900 uppercase">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Image gallery.
 *
 * The parent renders this with `key={product.id}`, so navigating between two
 * products remounts it and the selected image resets naturally — no effect needed
 * to spot a changed id.
 */
function Gallery({ product }: { product: Product }) {
  const images =
    product.images.length > 0 ? product.images : product.thumbnail ? [product.thumbnail] : [];
  const [activeIndex, setActiveIndex] = useState(0);

  const safeIndex = images.length > 0 ? Math.min(activeIndex, images.length - 1) : 0;
  const active = images[safeIndex];

  return (
    <div className="flex flex-col gap-3">
      <ProductImage
        src={active ?? ""}
        alt={product.title}
        className="aspect-square w-full rounded-2xl bg-white ring-1 ring-slate-200"
        sizes="(max-width: 1024px) 100vw, 480px"
        priority
        imageClassName="object-contain p-4"
      />

      {images.length > 1 ? (
        <ul className="flex flex-wrap gap-2.5">
          {images.map((image, index) => (
            <li key={`${image}-${index}`}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === safeIndex}
                className={[
                  "block overflow-hidden rounded-xl ring-2 transition",
                  index === safeIndex
                    ? "ring-brand-500"
                    : "ring-slate-200 hover:ring-slate-300",
                ].join(" ")}
              >
                <ProductImage src={image} alt="" className="size-16" sizes="64px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Reviews({ product }: { product: Product }) {
  const reviews = product.reviews ?? [];

  if (reviews.length === 0) {
    return <p className="text-sm text-slate-500">No reviews yet for this product.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-slate-100">
      {reviews.map((review, index) => (
        <li key={`${review.reviewerEmail}-${index}`} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-600 text-xs font-bold text-white">
                {review.reviewerName.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {review.reviewerName}
              </span>
            </div>
            <Rating value={review.rating} />
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{review.comment}</p>
          <p className="mt-1.5 text-xs text-slate-400">{formatDate(review.date)}</p>
        </li>
      ))}
    </ul>
  );
}

export function ProductDetailView({ id }: ProductDetailViewProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const { product, isLoading, isNotFound, error, retry } = useProductDetail(id);

  const { categories } = useCategories();
  const { updatingId, deletingId, update, remove } = useProductMutations();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const backLink = (
    <Link
      href="/products"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
    >
      ← Back to products
    </Link>
  );

  const handleUpdate = async (values: ProductFormValues) => {
    if (!product) return;
    try {
      const ok = await update(product, values);
      if (!ok) return;
      setIsEditOpen(false);
      pushToast({
        tone: "success",
        title: "Product updated",
        description: `"${values.title}" was saved locally.`,
      });
    } catch (caught: unknown) {
      pushToast({
        tone: "error",
        title: "Could not update the product",
        description: toApiError(caught).message,
      });
    }
  };

  const handleDelete = async (target: Product) => {
    try {
      const ok = await remove(target);
      if (!ok) return;
      setIsDeleteOpen(false);
      pushToast({
        tone: "success",
        title: "Product deleted",
        description: `"${target.title}" was removed.`,
      });
      // The record no longer exists in this app's view, so this page has nothing
      // left to show.
      router.push("/products");
    } catch (caught: unknown) {
      pushToast({
        tone: "error",
        title: "Could not delete the product",
        description: toApiError(caught).message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <LoadingSpinner label="Loading product…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <ErrorState error={error} onRetry={retry} context="this product" />
      </div>
    );
  }

  if (isNotFound || !product) {
    return (
      <div className="flex flex-col gap-5">
        {backLink}
        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          <EmptyState
            title="Product not found"
            description={
              <>
                There is no product with the id{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                  {id}
                </code>
                . It may have been removed locally, or the link may be wrong.
              </>
            }
            action={
              <Link
                href="/products"
                className="inline-flex h-9 items-center rounded-xl px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Browse all products
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const hasDiscount = product.discountPercentage > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {backLink}

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            isLoading={updatingId === product.id}
          >
            <PencilIcon className="size-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            isLoading={deletingId === product.id}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <TrashIcon className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Gallery key={product.id} product={product} />

        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand" className="capitalize">
                {product.category.replace(/-/g, " ")}
              </Badge>
              {product.brand ? <Badge tone="neutral">{product.brand}</Badge> : null}
              {product.localChange === "created" ? (
                <Badge tone="success">New (local)</Badge>
              ) : null}
              {product.localChange === "updated" ? (
                <Badge tone="brand">Edited (local)</Badge>
              ) : null}
            </div>

            <h1 className="mt-3.5 text-2xl font-bold tracking-tight text-slate-900">
              {product.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {formatPrice(product.price)}
              </span>
              {hasDiscount ? (
                <Badge tone="success">
                  {formatPercent(product.discountPercentage)} off
                </Badge>
              ) : null}
            </div>

            {hasDiscount ? (
              <p className="mt-1.5 text-sm text-slate-500">
                {formatPrice(discountedPrice(product.price, product.discountPercentage))} once the
                discount is applied.
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Rating value={product.rating} count={product.reviews?.length} />
              <StockBadge stock={product.stock} />
            </div>

            <p className="mt-5 text-sm leading-relaxed text-slate-600">{product.description}</p>
          </section>

          <Section title="Specifications">
            <dl className="divide-y divide-slate-100">
              <SpecRow label="Product ID" value={`#${product.id}`} />
              <SpecRow label="SKU" value={product.sku ?? "—"} />
              <SpecRow label="Brand" value={product.brand ?? "—"} />
              <SpecRow label="Category" value={product.category.replace(/-/g, " ")} />
              <SpecRow
                label="Dimensions"
                value={
                  product.dimensions
                    ? `${product.dimensions.width} × ${product.dimensions.height} × ${product.dimensions.depth} cm`
                    : "—"
                }
              />
              <SpecRow
                label="Weight"
                value={product.weight ? `${product.weight} kg` : "—"}
              />
              <SpecRow label="Warranty" value={product.warrantyInformation ?? "—"} />
              <SpecRow label="Shipping" value={product.shippingInformation ?? "—"} />
              <SpecRow label="Returns" value={product.returnPolicy ?? "—"} />
              <SpecRow
                label="Min. order"
                value={
                  product.minimumOrderQuantity
                    ? `${formatNumber(product.minimumOrderQuantity)} units`
                    : "—"
                }
              />
              <SpecRow label="Last updated" value={formatDate(product.meta?.updatedAt)} />
            </dl>

            {product.tags.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
                {product.tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </Section>
        </div>
      </div>

      <Section title={`Reviews${product.reviews?.length ? ` (${product.reviews.length})` : ""}`}>
        <Reviews product={product} />
      </Section>

      <ProductFormDialog
        open={isEditOpen}
        mode="edit"
        product={product}
        categories={categories}
        isSubmitting={updatingId === product.id}
        onSubmit={handleUpdate}
        onClose={() => setIsEditOpen(false)}
      />

      <ProductDeleteDialog
        product={isDeleteOpen ? product : null}
        onConfirm={handleDelete}
        onClose={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
