import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { beasties } from 'vite-plugin-beasties'

export default defineConfig({
  plugins: [
    react(),
    beasties({
      options: {
        preload: 'swap',          // remaining CSS is loaded async, applied once ready
        inlineFonts: true,        // inline small font-face rules used above the fold
        pruneSource: true,        // strip inlined rules from the external stylesheet
        mergeStylesheets: true,   // fewer <style> / <link> tags in the HTML
        logLevel: 'warn',
      },
    }),
  ],
  build: {
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('lucide-react')) return 'vendor-lucide';
          if (id.includes('react-dom') || id.includes('react-router-dom') || (id.includes('/node_modules/react/') && !id.includes('react-dom'))) return 'vendor-react';
        },
      },
    },
  },
})
