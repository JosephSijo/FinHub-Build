import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['images/logo-icon.png', 'mesh-grid.svg'],
      manifest: {
        name: 'FinHub',
        short_name: 'FinHub',
        description: 'Your Personal Wealth Architect',
        theme_color: '#020617', // Slate 950
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/images/logo-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/logo-icon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/images/logo-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          vendor: ['react', 'react-dom'],

          // UI Libraries
          ui: [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'lucide-react'
          ],

          // Heavy libraries
          charts: ['recharts'],
          motion: ['motion'],
          forms: ['react-hook-form', 'react-day-picker']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3100,
    open: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.worldbank.org https://api.exchangerate-api.com https://v6.exchangerate-api.com https://api.openai.com https://api.anthropic.com https://*.googleapis.com https://generative-language.googleapis.com https://api.deepseek.com https://api.perplexity.ai; img-src 'self' data: https://*.supabase.co https://placehold.co https://grainy-gradients.vercel.app; frame-ancestors 'none'; worker-src 'self' blob:;",
    }
  },
  preview: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.worldbank.org https://api.exchangerate-api.com https://v6.exchangerate-api.com https://api.openai.com https://api.anthropic.com https://*.googleapis.com https://generative-language.googleapis.com https://api.deepseek.com https://api.perplexity.ai; img-src 'self' data: https://*.supabase.co https://placehold.co https://grainy-gradients.vercel.app; frame-ancestors 'none'; worker-src 'self' blob:;",
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  }
});