import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { product } from './src/config/product.ts'

/** Injects the centralized product name/description into index.html at build time. */
function productHtmlPlugin(): Plugin {
  return {
    name: 'inkline-product-html',
    transformIndexHtml(html) {
      return html
        .replaceAll('%PRODUCT_NAME%', product.name)
        .replaceAll('%PRODUCT_DESCRIPTION%', product.description)
    },
  }
}

// Set by `tauri dev`/`tauri build` (see https://v2.tauri.app/start/frontend/vite/).
// Used below to keep the dev server well-behaved for the desktop shell
// without changing anything about the plain browser dev/build path.
const isTauriBuild = !!process.env.TAURI_ENV_PLATFORM

// https://vite.dev/config/
export default defineConfig({
  // Tauri manages its own terminal output; clearing the screen would hide
  // Rust build errors and warnings.
  clearScreen: false,
  server: {
    // Must match `build.devUrl` in src-tauri/tauri.conf.json.
    port: 5173,
    strictPort: true,
    watch: {
      // Ignore Rust source changes so editing src-tauri/ doesn't trigger a
      // frontend reload (Tauri recompiles and restarts on its own).
      ignored: ['**/src-tauri/**'],
    },
  },
  // esbuild's default target is fine for browsers; under Tauri we can target
  // the bundled WebView2/Chromium engine more precisely, matching Tauri's
  // own recommended Vite setup.
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: isTauriBuild ? ['chrome105'] : undefined,
    minify: isTauriBuild && process.env.TAURI_ENV_DEBUG ? false : undefined,
    sourcemap: isTauriBuild && !!process.env.TAURI_ENV_DEBUG,
  },
  plugins: [
    react(),
    tailwindcss(),
    productHtmlPlugin(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      manifest: {
        name: product.name,
        short_name: product.shortName,
        description: product.description,
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Documents live in IndexedDB, never the SW cache. Only precache
        // the built app shell (JS/CSS/HTML/icons).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
})
