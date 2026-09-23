"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductImage } from "./ProductImage";

/**
 * Delete confirmation.
 *
 * `product` doubles as the open flag: passing `null` closes the dialog, which
 * means there is no way to render it without a target.
 */

interface ProductDeleteDialogProps {
  product: Product | null;
  onConfirm: (product: Product) => Promise<void>;
  onClose: () => void;
}

export function ProductDeleteDialog({
  product,
  onConfirm,
  onClose,
}: ProductDeleteDialogProps) {
  return (
    <ConfirmDialog
      open={product !== null}
      title="Delete this product?"
      confirmLabel="Delete product"
      workingLabel="Deleting…"
      onClose={onClose}
      onConfirm={async () => {
        if (product) await onConfirm(product);
      }}
      description={
        product ? (
          <div className="space-y-4">
            <p>
              This calls <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">DELETE
              /products/{product.id}</code> and then removes the product from this view.
            </p>

            <div className="flex items-center gap-3.5 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200 ring-inset">
              <ProductImage
                src={product.thumbnail}
                alt={product.title}
                className="size-12 rounded-xl ring-1 ring-slate-200"
                sizes="48px"
              />
              <div className="min-w-0">
                <p className="line-clamp-1 font-semibold text-slate-900">{product.title}</p>
                <p className="text-xs text-slate-500">
                  {formatPrice(product.price)} · {product.category.replace(/-/g, " ")}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              DummyJSON does not persist deletes, so the product would reappear on a server that
              really stored it. Locally it stays hidden — use “Reset” in the header to bring it
              back.
            </p>
          </div>
        ) : null
      }
    />
  );
}
