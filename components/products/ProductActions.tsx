"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import type { Product } from "@/lib/types";

/**
 * Row actions, shared by the desktop table and the mobile card list so the two
 * layouts can never drift apart.
 */

interface ProductActionsProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function ProductActions({
  product,
  onEdit,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: ProductActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link
        href={`/products/${product.id}`}
        className="inline-flex h-9 items-center rounded-xl px-3 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50"
      >
        View
      </Link>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onEdit(product)}
        isLoading={isUpdating}
        aria-label={`Edit ${product.title}`}
      >
        <PencilIcon className="size-4" />
        <span className="hidden lg:inline">Edit</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(product)}
        isLoading={isDeleting}
        aria-label={`Delete ${product.title}`}
        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
      >
        <TrashIcon className="size-4" />
        <span className="hidden lg:inline">Delete</span>
      </Button>
    </div>
  );
}
