import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ injectRegister: "script" })
  ],
  base: "/TSGB/",
  assetsInclude: "*.png",
  server: {
    port: 1234,
  },
  build: {
    outDir: "../../dist",
  },
})


