"use client";

import { useId, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/Modal";
import type { Category, Product, ProductFormValues } from "@/lib/types";
import {
  EMPTY_PRODUCT_FORM,
  hasErrors,
  productToFormValues,
  validateProductForm,
  type ProductFormErrors,
} from "@/lib/validation";

/**
 * Add / edit form.
 *
 * The fields live in their own component so they can be *keyed* by the target
 * product. Switching from "add" to "edit #5" therefore remounts the fields with
 * the right initial values, instead of an effect that copies props into state
 * after the first paint (which would both flash the previous values and cause an
 * extra render pass).
 *
 * Validation runs on submit, and from then on live as the user types — reporting
 * every keystroke before the first submit would flag a half-typed title as an
 * error, which reads as hostile. On a failed submit, focus moves to the first
 * invalid field so a keyboard user is not left hunting for it.
 *
 * Duplicate submissions are blocked with a ref (synchronous) plus the parent's
 * `isSubmitting` flag (visual). The Save button sits in the modal footer — outside
 * the <form> — so it is associated with the form through the `form` attribute
 * rather than by duplicating the submit plumbing.
 */

const noop = () => undefined;

interface ProductFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  product: Product | null;
  categories: Category[];
  isSubmitting: boolean;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onClose: () => void;
}

interface ProductFormFieldsProps {
  formId: string;
  product: Product | null;
  categories: Category[];
  isSubmitting: boolean;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}

function ProductFormFields({
  formId,
  product,
  categories,
  isSubmitting,
  onSubmit,
}: ProductFormFieldsProps) {
  // Lazy initialiser: the initial values are computed exactly once per mount, and
  // a new target means a new mount (see the `key` in the parent).
  const [values, setValues] = useState<ProductFormValues>(() =>
    product ? productToFormValues(product) : EMPTY_PRODUCT_FORM,
  );
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const inFlightRef = useRef(false);

  const handleFieldChange = (field: keyof ProductFormValues, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    // Live validation only after a submit attempt, so typing is never nagged.
    if (hasSubmitted) setErrors(validateProductForm(next));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlightRef.current) return; // synchronous guard against a double submit

    const nextErrors = validateProductForm(values);
    setHasSubmitted(true);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      const firstInvalid = Object.keys(nextErrors)[0];
      if (firstInvalid) document.getElementById(`product-${firstInvalid}`)?.focus();
      return;
    }

    inFlightRef.current = true;
    try {
      await onSubmit(values);
    } finally {
      inFlightRef.current = false;
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Title"
        htmlFor="product-title"
        required
        error={errors.title}
        className="sm:col-span-2"
      >
        <Input
          id="product-title"
          data-autofocus
          value={values.title}
          onChange={(event) => handleFieldChange("title", event.target.value)}
          placeholder="e.g. Wireless Noise-Cancelling Headphones"
          invalid={Boolean(errors.title)}
          disabled={isSubmitting}
        />
      </Field>

      <Field label="Brand" htmlFor="product-brand" error={errors.brand}>
        <Input
          id="product-brand"
          value={values.brand}
          onChange={(event) => handleFieldChange("brand", event.target.value)}
          placeholder="e.g. Sony"
          invalid={Boolean(errors.brand)}
          disabled={isSubmitting}
        />
      </Field>

      <Field label="Category" htmlFor="product-category" required error={errors.category}>
        <Select
          id="product-category"
          value={values.category}
          onChange={(event) => handleFieldChange("category", event.target.value)}
          invalid={Boolean(errors.category)}
          disabled={isSubmitting}
        >
          <option value="">Select a category…</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Price (USD)" htmlFor="product-price" required error={errors.price}>
        <Input
          id="product-price"
          inputMode="decimal"
          value={values.price}
          onChange={(event) => handleFieldChange("price", event.target.value)}
          placeholder="19.99"
          invalid={Boolean(errors.price)}
          disabled={isSubmitting}
        />
      </Field>

      <Field label="Stock" htmlFor="product-stock" required error={errors.stock}>
        <Input
          id="product-stock"
          inputMode="numeric"
          value={values.stock}
          onChange={(event) => handleFieldChange("stock", event.target.value)}
          placeholder="25"
          invalid={Boolean(errors.stock)}
          disabled={isSubmitting}
        />
      </Field>

      <Field
        label="Rating"
        htmlFor="product-rating"
        error={errors.rating}
        hint="0 to 5. Leave blank for an unrated product."
      >
        <Input
          id="product-rating"
          inputMode="decimal"
          value={values.rating}
          onChange={(event) => handleFieldChange("rating", event.target.value)}
          placeholder="4.5"
          invalid={Boolean(errors.rating)}
          disabled={isSubmitting}
        />
      </Field>

      <Field
        label="Image URL"
        htmlFor="product-thumbnail"
        error={errors.thumbnail}
        className="sm:col-span-2"
      >
        <Input
          id="product-thumbnail"
          value={values.thumbnail}
          onChange={(event) => handleFieldChange("thumbnail", event.target.value)}
          placeholder="https://example.com/image.jpg"
          invalid={Boolean(errors.thumbnail)}
          disabled={isSubmitting}
        />
      </Field>

      <Field
        label="Description"
        htmlFor="product-description"
        required
        error={errors.description}
        className="sm:col-span-2"
      >
        <Textarea
          id="product-description"
          value={values.description}
          onChange={(event) => handleFieldChange("description", event.target.value)}
          placeholder="A short description of the product…"
          invalid={Boolean(errors.description)}
          disabled={isSubmitting}
        />
      </Field>
    </form>
  );
}

export function ProductFormDialog({
  open,
  mode,
  product,
  categories,
  isSubmitting,
  onSubmit,
  onClose,
}: ProductFormDialogProps) {
  const formId = useId();
  const isEdit = mode === "edit";

  return (
    <Modal
      open={open}
      onClose={isSubmitting ? noop : onClose}
      title={isEdit ? "Edit product" : "Add product"}
      description={
        isEdit
          ? `Update the details of "${product?.title ?? "this product"}".`
          : "Create a product. It is sent to the API and kept in a local overlay, because DummyJSON does not persist writes."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            isLoading={isSubmitting}
            loadingText={isEdit ? "Saving…" : "Creating…"}
          >
            {isEdit ? "Save changes" : "Create product"}
          </Button>
        </>
      }
    >
      {/* `Modal` renders nothing while closed, so the fields mount fresh on every
          open; the key covers switching straight from one product to another. */}
      <ProductFormFields
        key={product ? `${mode}-${product.id}` : "create"}
        formId={formId}
        product={product}
        categories={categories}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}
