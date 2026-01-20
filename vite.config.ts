import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers for smaller bundle
    target: "es2020",
    // Enable minification
    minify: "esbuild",
    // Reduce chunk size warning threshold
    chunkSizeWarningLimit: 1000,
    // Let Vite handle chunk splitting automatically
    // Manual chunks caused circular dependency issues in production
  },
}));
