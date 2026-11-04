import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const pwa = VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
  manifest: {
    name: 'SkillPass BD',
    short_name: 'SkillPass',
    description: 'স্কিলপাস বিডি — দক্ষ কর্মীদের যাচাই করা প্রোফাইল ও কাজের ইতিহাস',
    lang: 'bn',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#14866d',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
    globIgnores: ['**/AdminDashboardPage-*.js'],
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api\//, /^\/media\//, /^\/static\//],
    cleanupOutdatedCaches: true,
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(process.env.VITEST ? [] : [pwa])],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
});
