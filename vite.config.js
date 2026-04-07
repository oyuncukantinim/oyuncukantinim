import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-lucide': ['lucide-react'],
          'admin': [
            './src/pages/admin/Dashboard',
            './src/pages/admin/Users',
            './src/pages/admin/Listings',
            './src/pages/admin/Orders',
            './src/pages/admin/Reviews',
            './src/pages/admin/Categories',
            './src/pages/admin/Doping',
            './src/pages/admin/Epins',
            './src/pages/admin/Announcements',
            './src/pages/admin/Messages',
            './src/pages/admin/Support',
            './src/pages/admin/Settings',
            './src/pages/admin/PopularGames',
            './src/pages/admin/Finance',
            './src/pages/admin/DevNotes',
            './src/pages/admin/AdminLogs',
          ],
        },
      },
    },
  },
})
