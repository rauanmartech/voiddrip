import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — very stable, long cache life
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Data fetching — shared across all routes
          "vendor-query": ["@tanstack/react-query"],
          // Animation — heavy, lazily needed
          "vendor-motion": ["framer-motion"],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
    // Raise chunk size warning threshold slightly
    chunkSizeWarningLimit: 600,
  },
}));

