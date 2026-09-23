import type { Product, ProductFormValues, ProductWritePayload } from "@/types/api";

/**
 * Form validation for the add/edit dialog.
 *
 * Pure functions, no React, so the rules can be unit tested (see
 * `tests/validation.test.ts`). Numeric fields are kept as *strings* in form
 * state on purpose: if `price` were a number, an in-progress entry like "12."
 * could not be typed, and an empty box would be indistinguishable from 0. We
 * validate the string, then convert once in `formValuesToPayload`.
 */

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  title: "",
  description: "",
  category: "",
  brand: "",
  price: "",
  stock: "",
  rating: "",
  thumbnail: "",
};

export const FORM_LIMITS = {
  titleMin: 3,
  titleMax: 80,
  descriptionMin: 10,
  descriptionMax: 600,
  brandMax: 40,
  priceMax: 1_000_000,
  stockMax: 1_000_000,
  /** Up to two decimal places, e.g. "12.5" or "12.50". */
  moneyPattern: /^\d+(\.\d{1,2})?$/,
  /** Whole units only. */
  integerPattern: /^\d+$/,
  /**
   * Number *shape* only — up to two decimals. The 0–5 range is enforced
   * numerically below, because a shape-only pattern accepted "5.1": the leading
   * character was in range, so the whole value looked valid.
   */
  ratingPattern: /^\d+(\.\d{1,2})?$/,
  /** Inclusive upper bound for a rating. */
  ratingMax: 5,
} as const;

const isBlank = (value: string): boolean => value.trim() === "";

export function validateProductForm(values: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {};

  /* -- title ------------------------------------------------------- */
  const title = values.title.trim();
  if (title === "") {
    errors.title = "Title is required.";
  } else if (title.length < FORM_LIMITS.titleMin) {
    errors.title = `Title must be at least ${FORM_LIMITS.titleMin} characters.`;
  } else if (title.length > FORM_LIMITS.titleMax) {
    errors.title = `Title must be ${FORM_LIMITS.titleMax} characters or fewer.`;
  }

  /* -- description ------------------------------------------------- */
  const description = values.description.trim();
  if (description === "") {
    errors.description = "Description is required.";
  } else if (description.length < FORM_LIMITS.descriptionMin) {
    errors.description = `Description must be at least ${FORM_LIMITS.descriptionMin} characters.`;
  } else if (description.length > FORM_LIMITS.descriptionMax) {
    errors.description = `Description must be ${FORM_LIMITS.descriptionMax} characters or fewer.`;
  }

  /* -- category ---------------------------------------------------- */
  if (isBlank(values.category)) {
    errors.category = "Choose a category.";
  }

  /* -- brand (optional) ------------------------------------------- */
  if (values.brand.trim().length > FORM_LIMITS.brandMax) {
    errors.brand = `Brand must be ${FORM_LIMITS.brandMax} characters or fewer.`;
  }

  /* -- price ------------------------------------------------------- */
  const price = values.price.trim();
  if (price === "") {
    errors.price = "Price is required.";
  } else if (!FORM_LIMITS.moneyPattern.test(price)) {
    errors.price = "Enter a valid price, e.g. 19.99 (max two decimals).";
  } else if (Number(price) <= 0) {
    errors.price = "Price must be greater than 0.";
  } else if (Number(price) > FORM_LIMITS.priceMax) {
    errors.price = "Price looks unrealistically high.";
  }

  /* -- stock ------------------------------------------------------- */
  const stock = values.stock.trim();
  if (stock === "") {
    errors.stock = "Stock is required.";
  } else if (!FORM_LIMITS.integerPattern.test(stock)) {
    errors.stock = "Stock must be a whole number, e.g. 25.";
  } else if (Number(stock) > FORM_LIMITS.stockMax) {
    errors.stock = "Stock looks unrealistically high.";
  }

  /* -- rating (optional, blank means 0) --------------------------- */
  const rating = values.rating.trim();
  if (rating !== "") {
    if (!FORM_LIMITS.ratingPattern.test(rating)) {
      errors.rating = "Rating must be a number between 0 and 5, e.g. 4.5.";
    } else if (Number(rating) > FORM_LIMITS.ratingMax) {
      errors.rating = "Rating cannot be higher than 5.";
    }
  }

  /* -- thumbnail (optional) --------------------------------------- */
  const thumbnail = values.thumbnail.trim();
  if (thumbnail !== "" && !/^https?:\/\/\S+$/i.test(thumbnail)) {
    errors.thumbnail = "Enter a full image URL starting with http:// or https://.";
  }

  return errors;
}

export function hasErrors(errors: ProductFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Convert validated form strings into the JSON payload sent to DummyJSON. */
export function formValuesToPayload(values: ProductFormValues): ProductWritePayload {
  const brand = values.brand.trim();
  const thumbnail = values.thumbnail.trim();

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category.trim(),
    price: Number(values.price),
    stock: Number(values.stock),
    rating: values.rating.trim() === "" ? 0 : Number(values.rating),
    ...(brand ? { brand } : {}),
    ...(thumbnail ? { thumbnail } : {}),
  };
}

/** Seed the edit form from an existing product. */
export function productToFormValues(product: Product): ProductFormValues {
  return {
    title: product.title,
    description: product.description,
    category: product.category,
    brand: product.brand ?? "",
    price: String(product.price),
    stock: String(product.stock),
    rating: product.rating === 0 ? "" : String(product.rating),
    thumbnail: product.thumbnail ?? "",
  };
}
