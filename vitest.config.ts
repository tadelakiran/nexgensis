import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Tests target the pure modules: URL parsing, pagination arithmetic, overlay
 * merging, validation and endpoint selection. Those are where the logic that can
 * actually be wrong lives; the React components are covered by the manual checks
 * listed in the README.
 *
 * The `@` alias mirrors `tsconfig.json` so a test imports a module the same way
 * the application does.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src/", import.meta.url)),
    },
  },
});
