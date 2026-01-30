import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  server: {
    proxy: {
      "/api": "http://localhost:8081",
      "/uploads": "http://localhost:8081",
    },
  },
  build: {
    outDir: "../backend/src/main/resources/static",
    emptyOutDir: true,
  },
});
