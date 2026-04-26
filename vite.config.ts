import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

// Allow Firebase config to be supplied via plain (non-VITE_) secrets.
// This makes deployment portable: just set FIREBASE_API_KEY in Secrets and it
// is injected into the bundle as VITE_FIREBASE_API_KEY at build time.
const firebaseDefines: Record<string, string> = {};
const firebaseEnvPairs: Array<[string, string]> = [
  ["VITE_FIREBASE_API_KEY", "FIREBASE_API_KEY"],
  ["VITE_FIREBASE_AUTH_DOMAIN", "FIREBASE_AUTH_DOMAIN"],
  ["VITE_FIREBASE_PROJECT_ID", "FIREBASE_PROJECT_ID"],
  ["VITE_FIREBASE_STORAGE_BUCKET", "FIREBASE_STORAGE_BUCKET"],
  ["VITE_FIREBASE_MESSAGING_SENDER_ID", "FIREBASE_MESSAGING_SENDER_ID"],
  ["VITE_FIREBASE_APP_ID", "FIREBASE_APP_ID"],
  ["VITE_FIREBASE_MEASUREMENT_ID", "FIREBASE_MEASUREMENT_ID"],
];
for (const [viteKey, plainKey] of firebaseEnvPairs) {
  const value = process.env[viteKey] ?? process.env[plainKey];
  if (value) {
    firebaseDefines[`import.meta.env.${viteKey}`] = JSON.stringify(value);
  }
}

export default defineConfig({
  base: basePath,
  define: firebaseDefines,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
