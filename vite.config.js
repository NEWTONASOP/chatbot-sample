import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/v1': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});