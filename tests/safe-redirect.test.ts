import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/safe-redirect";

/**
 * `?next=` comes from the address bar, so it is attacker-controllable. A
 * post-login redirect that trusted it would let a link to the real app bounce the
 * user to a look-alike domain — an open redirect, and a phishing primitive.
 */

describe("safeRedirectPath", () => {
  it("accepts a same-site path", () => {
    expect(safeRedirectPath("/products")).toBe("/products");
    expect(safeRedirectPath("/products/5?page=2")).toBe("/products/5?page=2");
  });

  it("falls back when nothing is given", () => {
    expect(safeRedirectPath(null)).toBe("/products");
    expect(safeRedirectPath(undefined)).toBe("/products");
    expect(safeRedirectPath("")).toBe("/products");
    expect(safeRedirectPath("   ")).toBe("/products");
  });

  it("rejects an absolute URL to another origin", () => {
    expect(safeRedirectPath("https://evil.example")).toBe("/products");
    expect(safeRedirectPath("http://evil.example/x")).toBe("/products");
  });

  it("rejects the protocol-relative form", () => {
    expect(safeRedirectPath("//evil.example")).toBe("/products");
    expect(safeRedirectPath("//evil.example/path")).toBe("/products");
  });

  it("rejects the backslash trick some browsers normalise into a host", () => {
    expect(safeRedirectPath("/\\evil.example")).toBe("/products");
    expect(safeRedirectPath("\\\\evil.example")).toBe("/products");
  });

  it("rejects a value with an embedded scheme", () => {
    expect(safeRedirectPath("/redirect?to=https://evil.example")).toBe("/products");
  });

  it("rejects a relative path that is not rooted", () => {
    expect(safeRedirectPath("products")).toBe("/products");
  });

  it("strips control characters that could smuggle in extra segments", () => {
    expect(safeRedirectPath("/products\u0000")).toBe("/products");
    expect(safeRedirectPath("/pro\u001fducts")).toBe("/products");
  });
});
