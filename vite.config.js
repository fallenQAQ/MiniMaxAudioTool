import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// Vite 配置：Vue 插件 + PWA + 开发代理（兜底 CORS）
export default defineConfig({
  // 便于静态托管，使用相对路径
  base: './',
  // element-plus 体积较大，放宽 chunk 体积警告阈值以消除构建告警
  build: {
    chunkSizeWarningLimit: 1500
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'MiniMaxAudioTool',
        short_name: 'MiniMax Audio',
        description: 'MiniMax 音频能力前端工具集',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // 预缓存已构建的静态资源（JS/CSS/HTML/图标/字体等）
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // 运行时缓存策略：
        // 重要：MiniMax API 请求（/v1/、/minimax 前缀、api.minimaxi.com）一律使用 NetworkOnly，
        // 绝不缓存响应——API 请求携带鉴权 Key，缓存会导致鉴权失败与数据陈旧问题。
        // 静态资源已由 globPatterns 预缓存覆盖，无需额外运行时规则。
        runtimeCaching: [
          {
            // 匹配 MiniMax API 调用（生产直连 api.minimaxi.com/v1/* 或开发代理 /minimax/v1/*）
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/v1/') ||
              url.pathname.startsWith('/minimax/') ||
              url.hostname === 'api.minimaxi.com',
            handler: 'NetworkOnly',
            options: {
              // 显式命名，便于识别；NetworkOnly 不会写入任何缓存
              cacheName: 'minimax-api-no-store'
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  server: {
    port: 5173,
    // 开发代理兜底 CORS：/minimax 前缀转发到 MiniMax 开放平台
    proxy: {
      '/minimax': {
        target: 'https://api.minimaxi.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/minimax/, '')
      }
    }
  }
})
