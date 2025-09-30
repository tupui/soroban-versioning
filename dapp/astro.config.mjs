import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  adapter: netlify(),
  vite: {
    server: {
      proxy: {
        '/api/rpc': {
          target: 'https://soroban-rpc.creit.tech',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/rpc/, ''),
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-name, x-client-version',
          }
        }
      }
    }
  }
});
