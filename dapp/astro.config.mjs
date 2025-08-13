import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import netlify from "@astrojs/netlify";

// Static config for lighthouse testing
const isLighthouseBuild = process.env.LIGHTHOUSE_BUILD === "true";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  adapter: isLighthouseBuild ? undefined : netlify(),
  output: isLighthouseBuild ? "static" : "server", // Static for lighthouse, server for production
  build: {
    inlineStylesheets: "auto",
    assets: "_astro",
  },
  vite: {
    build: {
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // React and core UI libraries
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            // Stellar blockchain libraries
            if (
              id.includes("@stellar/") ||
              id.includes("stellar-wallets-kit")
            ) {
              return "stellar-vendor";
            }
            // Remove old MDXEditor chunks - no longer needed
            // Crypto libraries
            if (
              id.includes("crypto") ||
              id.includes("noble/curves") ||
              id.includes("sha3")
            ) {
              return "crypto-vendor";
            }
            // IPFS and storage
            if (id.includes("@web3-storage/") || id.includes("ipfs")) {
              return "storage-vendor";
            }
            // Validation and forms
            if (id.includes("lossless-json")) {
              return "validation-vendor";
            }
            // Split large markdown processing
            if (id.includes("markdown") || id.includes("github-markdown")) {
              return "markdown-vendor";
            }
            // All other node_modules
            if (id.includes("node_modules")) {
              return "vendor";
            }
          },
        },
      },
    },
    ssr: {
      noExternal: ["@astrojs/react"],
    },
  },
  compressHTML: true,
  experimental: {
    clientPrerender: true,
  },
  image: {
    domains: ["testnet.tansu.dev"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.githubusercontent.com",
      },
    ],
  },
});
