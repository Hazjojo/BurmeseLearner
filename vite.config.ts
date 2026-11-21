import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// BASE_PATH lets the same build run at a sub-path (GitHub Pages: /BurmeseLearner/) or at the root (Firebase).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'BurmeseLearner',
        short_name: 'Burmese',
        description: 'Personal Burmese learning: hear it, recall it, say it.',
        theme_color: '#7a2e2e',
        background_color: '#faf7f2',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,json,mp3}'],
        // Never answer Firebase's reserved URLs (sign-in handler, init.json) with the cached app shell,
        // or the Google sign-in redirect lands back in the app instead of completing (endless loop).
        navigateFallbackDenylist: [/^\/__\//],
      },
    }),
  ],
  test: { environment: 'node' },
})
