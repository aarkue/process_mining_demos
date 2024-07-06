import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  build: { outDir: "../../docs/ocel_graph/", emptyOutDir: true,},
  base: '',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
