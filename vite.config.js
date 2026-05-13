import { defineConfig } from "vite";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [cloudflare()],
  server: {
    port: 3000,
    proxy: {
      "/v1/nvidia": {
        target: "https://integrate.api.nvidia.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/v1\/nvidia/, "/v1"),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, _req, _res) => {
            const apiKey = "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";
            proxyReq.setHeader("Authorization", `Bearer ${apiKey}`);
          });
        },
      },
    },
  },
});