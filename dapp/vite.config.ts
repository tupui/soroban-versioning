import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    port: 8000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "soroban-core": ["@soroban-react/core"],
          soroban: [
            "@soroban-react/chains",
            "@soroban-react/contracts",
            "@soroban-react/freighter",
            "@soroban-react/types",
          ],
          stellar: [
            "@stellar/stellar-sdk",
            "@stellar/freighter-api",
            "@stellar/stellar-base",
          ],
        },
      },
    },
  },
});
