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
 * Desktop presentation: a table, shown from `md` up. The card list takes over
 * below that breakpoint (see `ProductsCardList`).
 */

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  updatingId: number | null;
  deletingId: number | null;
}

function LocalChangeBadge({ product }: { product: Product }) {
  if (product.localChange === "created") return <Badge tone="success">New (local)</Badge>;
  if (product.localChange === "updated") return <Badge tone="brand">Edited (local)</Badge>;
  return null;
}

export function ProductsTable({
  products,
  onEdit,
  onDelete,
  updatingId,
  deletingId,
}: ProductsTableProps) {
  return (
    <div className="hidden md:block">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <th scope="col" className="px-5 py-3 font-semibold">
              Product
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Category
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Price
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Rating
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Stock
            </th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-brand-50/40"
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3.5">
                  <ProductImage
                    src={product.thumbnail}
                    alt={product.title}
                    className="size-12 rounded-xl ring-1 ring-slate-200"
                    sizes="48px"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/products/${product.id}`}
                      className="line-clamp-1 font-semibold text-slate-900 transition hover:text-brand-700"
                    >
                      {product.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {product.brand ?? "—"}
                      </span>
                      <LocalChangeBadge product={product} />
                    </div>
                  </div>
                </div>
              </td>

              <td className="px-5 py-3.5">
                <Badge tone="neutral" className="capitalize">
                  {product.category.replace(/-/g, " ")}
                </Badge>
              </td>

              <td className="px-5 py-3.5">
                <span className="font-semibold text-slate-900">
                  {formatPrice(product.price)}
                </span>
                {product.discountPercentage > 0 ? (
                  <span className="mt-0.5 block text-xs text-emerald-600">
                    {product.discountPercentage.toFixed(0)}% off
                  </span>
                ) : null}
              </td>

              <td className="px-5 py-3.5">
                <Rating value={product.rating} count={product.reviews?.length} />
              </td>

              <td className="px-5 py-3.5">
                <StockBadge stock={product.stock} />
              </td>

              <td className="px-5 py-3.5">
                <ProductActions
                  product={product}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isUpdating={updatingId === product.id}
                  isDeleting={deletingId === product.id}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
