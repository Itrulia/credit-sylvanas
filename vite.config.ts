import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import type { Plugin } from 'vite'

// never invent the address: the legal pages say it is pending until it is set
let warned = false
function contactEmailWarning(): Plugin {
  return {
    name: 'contact-email-warning',
    configResolved(config) {
      if (!warned && !config.env.VITE_CONTACT_EMAIL) {
        warned = true
        config.logger.warn(
          'VITE_CONTACT_EMAIL is empty: /impressum and /privacy say contact details are pending.',
        )
      }
    },
  }
}

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    contactEmailWarning(),
    devtools(),
    // must come before tanstackStart(): runs the SSR environment in workerd
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: false,
        autoStaticPathsDiscovery: false,
        // about.html, not about/index.html: the asset layer would 307 /about to /about/
        autoSubfolderIndex: false,
      },
      pages: [
        { path: '/' },
        { path: '/about' },
        { path: '/impressum' },
        { path: '/privacy' },
      ],
    }),
    viteReact(),
  ],
})
