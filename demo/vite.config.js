import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  base: "/slow-scroll/",
  build: {
    // Preserve the browser targets used by Vite 5.
    target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
