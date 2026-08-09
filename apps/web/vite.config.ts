import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const appWorkspaceRoot = fileURLToPath(new URL("../..", import.meta.url));
const katexPackageRoot = dirname(
  dirname(fileURLToPath(import.meta.resolve("katex"))),
);

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          katex: ["katex"],
        },
      },
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [appWorkspaceRoot, katexPackageRoot],
    },
  },
  preview: {
    port: 4173,
  },
});
