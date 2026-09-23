"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { StockBadge } from "@/components/ui/StockBadge";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/api";
import { ProductActions } from "./ProductActions";
import { ProductImage } from "./ProductImage";

/**
 * Small-screen presentation: one card per product, shown below `md`.
 *
 * Same fields as the table, re-ordered for a narrow column rather than squeezed
 * into a horizontally scrolling table.
 */

interface ProductsCardListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  updatingId: number | null;
  deletingId: number | null;
}

function ProductCard({
  product,
  onEdit,
  onDelete,
  isUpdating,
  isDeleting,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  return (
    <li className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex gap-3.5">
        <ProductImage
          src={product.thumbnail}
          alt={product.title}
          className="size-20 rounded-xl ring-1 ring-slate-200"
          sizes="80px"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/products/${product.id}`}
              className="line-clamp-2 font-semibold text-slate-900 transition hover:text-brand-700"
            >
              {product.title}
            </Link>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral" className="capitalize">
              {product.category.replace(/-/g, " ")}
            </Badge>
            {product.localChange === "created" ? (
              <Badge tone="success">New (local)</Badge>
            ) : null}
            {product.localChange === "updated" ? (
              <Badge tone="brand">Edited (local)</Badge>
            ) : null}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="text-base font-bold text-slate-900">
              {formatPrice(product.price)}
            </span>
            <StockBadge stock={product.stock} />
          </div>

          <div className="mt-2">
            <Rating value={product.rating} count={product.reviews?.length} />
          </div>
        </div>
      </div>

      <div className="mt-3.5 border-t border-slate-100 pt-3">
        <ProductActions
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
        />
      </div>
    </li>
  );
}

export function ProductsCardList({
  products,
  onEdit,
  onDelete,
  updatingId,
  deletingId,
}: ProductsCardListProps) {
  return (
    <ul className="flex flex-col gap-3 p-3 md:hidden">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          isUpdating={updatingId === product.id}
          isDeleting={deletingId === product.id}
        />
      ))}
    </ul>
  );
}
