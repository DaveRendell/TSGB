import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: "script",
      manifest: {
        "name": "TSGB - Game Boy Emulator",
        "short_name": "TSGB",
        "icons": [
          {"src":"/TSGB/android-chrome-192x192.png","sizes":"192x192","type":"image/png"},
          {"src":"/TSGB/android-chrome-512x512.png","sizes":"512x512","type":"image/png"}
        ],
        "theme_color": "#ffffff",
        "background_color": "#285db1",
        "display": "standalone",
        "description": "An emulator for game for the Game Boy console",
        "start_url": "/TSGB/",
        "lang": "en-gb"
      }
    })
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


