import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
