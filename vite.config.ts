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
    rollupOptions: {
      output: {
        // Manual chunks for better caching and smaller initial load
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Group react-related
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "vendor-react";
            }
            // Group radix-ui
            if (id.includes("@radix-ui")) {
              return "vendor-radix";
            }
            // Group tanstack
            if (id.includes("@tanstack")) {
              return "vendor-query";
            }
            // Group supabase
            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }
            // Group charts
            if (id.includes("recharts") || id.includes("d3")) {
              return "vendor-charts";
            }
          }
        },
      },
    },
  },
}));
