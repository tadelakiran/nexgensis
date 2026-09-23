import { describe, expect, it } from "vitest";

import type { Product, ProductFormValues } from "@/types/api";
import {
  EMPTY_PRODUCT_FORM,
  formValuesToPayload,
  hasErrors,
  productToFormValues,
  validateProductForm,
} from "@/features/products/lib/validation";

/** A form that should always pass, used as the base for one-field-at-a-time edits. */
const validForm: ProductFormValues = {
  title: "Wireless Headphones",
  description: "A comfortable pair of over-ear headphones.",
  category: "beauty",
  brand: "Sony",
  price: "19.99",
  stock: "25",
  rating: "4.5",
  thumbnail: "https://example.com/image.jpg",
};

const withField = (field: keyof ProductFormValues, value: string) => ({
  ...validForm,
  [field]: value,
});

describe("validateProductForm", () => {
  it("accepts a complete form", () => {
    expect(validateProductForm(validForm)).toEqual({});
  });

  it("treats brand, rating and thumbnail as optional", () => {
    expect(
      validateProductForm({ ...validForm, brand: "", rating: "", thumbnail: "" }),
    ).toEqual({});
  });

  it("reports every empty required field at once", () => {
    const errors = validateProductForm(EMPTY_PRODUCT_FORM);
    expect(Object.keys(errors).sort()).toEqual([
      "category",
      "description",
      "price",
      "stock",
      "title",
    ]);
    expect(hasErrors(errors)).toBe(true);
  });

  it("enforces the title length limits", () => {
    expect(validateProductForm(withField("title", "ab")).title).toBeDefined();
    expect(validateProductForm(withField("title", "   ")).title).toBeDefined();
    expect(validateProductForm(withField("title", "x".repeat(81))).title).toBeDefined();
    expect(validateProductForm(withField("title", "abc")).title).toBeUndefined();
    expect(validateProductForm(withField("title", "x".repeat(80))).title).toBeUndefined();
  });

  it("enforces the description length limits", () => {
    expect(validateProductForm(withField("description", "too short")).description).toBeDefined();
    expect(
      validateProductForm(withField("description", "x".repeat(601))).description,
    ).toBeDefined();
    expect(
      validateProductForm(withField("description", "x".repeat(10))).description,
    ).toBeUndefined();
  });

  describe("price", () => {
    it("rejects non-numeric, negative and zero values", () => {
      expect(validateProductForm(withField("price", "abc")).price).toBeDefined();
      expect(validateProductForm(withField("price", "-5")).price).toBeDefined();
      expect(validateProductForm(withField("price", "0")).price).toBeDefined();
      expect(validateProductForm(withField("price", "")).price).toBeDefined();
    });

    it("rejects more than two decimal places but accepts one or two", () => {
      expect(validateProductForm(withField("price", "12.345")).price).toBeDefined();
      expect(validateProductForm(withField("price", "12.3")).price).toBeUndefined();
      expect(validateProductForm(withField("price", "12.34")).price).toBeUndefined();
      expect(validateProductForm(withField("price", "12")).price).toBeUndefined();
      expect(validateProductForm(withField("price", "1.5")).price).toBeUndefined();
    });

    it("rejects an unrealistically high value", () => {
      expect(validateProductForm(withField("price", "1000001")).price).toBeDefined();
    });
  });

  describe("stock", () => {
    it("requires a whole number", () => {
      expect(validateProductForm(withField("stock", "1.5")).stock).toBeDefined();
      expect(validateProductForm(withField("stock", "-1")).stock).toBeDefined();
      expect(validateProductForm(withField("stock", "abc")).stock).toBeDefined();
      expect(validateProductForm(withField("stock", "0")).stock).toBeUndefined();
      expect(validateProductForm(withField("stock", "150")).stock).toBeUndefined();
    });
  });

  describe("rating", () => {
    it("allows a blank rating", () => {
      expect(validateProductForm(withField("rating", "")).rating).toBeUndefined();
    });

    it("requires a value between 0 and 5", () => {
      expect(validateProductForm(withField("rating", "5")).rating).toBeUndefined();
      expect(validateProductForm(withField("rating", "5.00")).rating).toBeUndefined();
      expect(validateProductForm(withField("rating", "0")).rating).toBeUndefined();
      expect(validateProductForm(withField("rating", "2.56")).rating).toBeUndefined();
      expect(validateProductForm(withField("rating", "-1")).rating).toBeDefined();
      expect(validateProductForm(withField("rating", "great")).rating).toBeDefined();
      expect(validateProductForm(withField("rating", "5.999")).rating).toBeDefined();
    });

    it("rejects a rating just above the maximum", () => {
      // Regression: the pattern used to allow anything starting with 0-5, so
      // "5.1" validated and would have been sent to the API.
      expect(validateProductForm(withField("rating", "5.1")).rating).toBe(
        "Rating cannot be higher than 5.",
      );
      expect(validateProductForm(withField("rating", "9")).rating).toBeDefined();
    });
  });

  describe("thumbnail", () => {
    it("requires a full http(s) URL when one is given", () => {
      expect(validateProductForm(withField("thumbnail", "https://a.com/b.jpg")).thumbnail).toBeUndefined();
      expect(validateProductForm(withField("thumbnail", "http://a.com/b.jpg")).thumbnail).toBeUndefined();
      expect(validateProductForm(withField("thumbnail", "a.com/b.jpg")).thumbnail).toBeDefined();
      expect(validateProductForm(withField("thumbnail", "javascript:alert(1)")).thumbnail).toBeDefined();
    });
  });

  it("rejects an over-long brand", () => {
    expect(validateProductForm(withField("brand", "x".repeat(41))).brand).toBeDefined();
  });
});

describe("formValuesToPayload", () => {
  it("converts the numeric fields and trims text", () => {
    const payload = formValuesToPayload({
      ...validForm,
      title: "  Wireless Headphones  ",
      price: "19.99",
      stock: "25",
      rating: "4.5",
    });

    expect(payload).toEqual({
      title: "Wireless Headphones",
      description: validForm.description,
      category: "beauty",
      brand: "Sony",
      price: 19.99,
      stock: 25,
      rating: 4.5,
      thumbnail: "https://example.com/image.jpg",
    });
    expect(typeof payload.price).toBe("number");
  });

  it("defaults a blank rating to 0 and omits optional empty strings", () => {
    const payload = formValuesToPayload({ ...validForm, rating: "", brand: "", thumbnail: "" });

    expect(payload.rating).toBe(0);
    expect(payload).not.toHaveProperty("brand");
    expect(payload).not.toHaveProperty("thumbnail");
  });
});

describe("productToFormValues", () => {
  const product: Product = {
    id: 1,
    title: "Essence Mascara",
    description: "A popular mascara.",
    category: "beauty",
    price: 9.99,
    discountPercentage: 10.48,
    rating: 2.56,
    stock: 99,
    tags: [],
    brand: "Essence",
    images: [],
    thumbnail: "https://cdn.dummyjson.com/a.webp",
    reviews: [],
  };

  it("seeds the form from a product", () => {
    expect(productToFormValues(product)).toEqual({
      title: "Essence Mascara",
      description: "A popular mascara.",
      category: "beauty",
      brand: "Essence",
      price: "9.99",
      stock: "99",
      rating: "2.56",
      thumbnail: "https://cdn.dummyjson.com/a.webp",
    });
  });

  it("leaves the rating blank for an unrated product", () => {
    expect(productToFormValues({ ...product, rating: 0 }).rating).toBe("");
  });

  it("survives a product with no brand or image", () => {
    const bare = productToFormValues({ ...product, brand: undefined, thumbnail: "" });
    expect(bare.brand).toBe("");
    expect(bare.thumbnail).toBe("");
  });

  it("produces values that validate cleanly", () => {
    expect(validateProductForm(productToFormValues(product))).toEqual({});
  });
});
