import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify("test"),
    __BUILD_TIME__: JSON.stringify(""),
    __COMMIT_HASH__: JSON.stringify(""),
    "import.meta.env.DEV": JSON.stringify(true),
    "import.meta.env.PROD": JSON.stringify(false),
    "import.meta.env.MODE": JSON.stringify("test"),
  },
  test: {
    environment: "jsdom",
    globals: true,
    pool: "vmThreads",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-router",
      "@tanstack/react-query",
    ],
  },
});
