import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  base: "/TSGB/",
  server: {
    port: 1234
  },
  build: {
    outDir: "../../dist",
  }
})
