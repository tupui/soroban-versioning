import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// https://astro.build/config
// Using static adapter for both Netlify and IPFS deployments
// All API endpoints are now handled by Cloudflare Workers
export default defineConfig({
  integrations: [react()],
  output: "static",
  adapter: undefined, // Static build, no adapter needed
});
