import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'echarts': ['echarts'],
        },
      },
    },
  },
  // 添加静态资源处理
  publicDir: 'public',
  server: {
    port: 3000,
  },
}) 