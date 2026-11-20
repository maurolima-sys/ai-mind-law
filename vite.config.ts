// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { execSync } from "child_process";
import { loadEnv } from "vite";

const commitHash = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
})();

// App Check debug token: injected only in dev builds, never in production.
// loadEnv with prefix="" reads all variables from .env.local, including VITE_*.
const devEnv = loadEnv("development", process.cwd(), "");
const appCheckDebugToken = (() => {
  if (process.env.NODE_ENV === "production") return undefined;
  return devEnv["VITE_FIREBASE_APPCHECK_DEBUG_TOKEN"] ?? devEnv["FIREBASE_APPCHECK_DEBUG_TOKEN"] ?? undefined;
})();

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify("0.4.0"),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __COMMIT_HASH__: JSON.stringify(commitHash),
      // undefined → the define is omitted entirely in production builds
      ...(appCheckDebugToken !== undefined
        ? { __APPCHECK_DEBUG_TOKEN__: JSON.stringify(appCheckDebugToken) }
        : {}),
    },
  },
});
