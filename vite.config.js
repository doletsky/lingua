import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      manifest: {
        name: 'Португальский с Нуля',
        short_name: 'PT Learning',
        description: 'Изучение португальского языка за 15 минут в день',
        theme_color: '#42b883',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/lingua/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json}']
      }
    })
  ],
  base: '/lingua/' // ← Изменено!
})