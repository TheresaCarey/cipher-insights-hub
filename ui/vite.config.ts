import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // COOP/COEP headers are required for FHEVM WebAssembly SharedArrayBuffer in production
    // In development, we disable them to avoid conflicts with Base Account SDK
    // Base Account SDK requires COEP to NOT be 'same-origin'
    // FHEVM mock instance works fine without these headers in development
    headers: mode === 'production' ? {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'unsafe-none', // Changed from 'same-origin' for Base Account SDK compatibility
    } : {},
  },
  plugins: [
    react(),
    nodePolyfills({
      // Enable polyfills for Node.js modules
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Polyfill specific modules
      include: ["util", "stream", "crypto", "buffer"],
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis",
    "process.env": {},
  },
  optimizeDeps: {
    exclude: ["@zama-fhe/relayer-sdk"],
  },
}));
