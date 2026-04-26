import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { beasties } from 'vite-plugin-beasties'

// Build-time LCP optimization: fetch the hero backgrounds pool and inject a
// <link rel="preload" as="image" fetchpriority="high"> for the first URL into
// index.html. Browser discovers the LCP image in the initial document and
// starts downloading it before the JS bundle has even parsed. If the API is
// unreachable at build time, the plugin silently skips injection.
function heroBgPreload() {
  const API = 'https://api.oyuncukantinim.com.tr/api.php?action=get_hero_backgrounds'
  const TIMEOUT_MS = 5000
  return {
    name: 'hero-bg-preload',
    apply: 'build',
    async transformIndexHtml(html) {
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
        const res = await fetch(API, { signal: ctrl.signal })
        clearTimeout(t)
        if (!res.ok) return html
        const json = await res.json()
        const list = Array.isArray(json?.data) ? json.data : []
        const first = list[0]?.image_url
        if (!first) return html
        if (html.includes(`href="${first}"`)) return html
        const tag = `    <link rel="preload" as="image" fetchpriority="high" href="${first}" />`
        return html.replace('</head>', `${tag}\n  </head>`)
      } catch {
        return html
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    heroBgPreload(),
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
