import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
  build: {
    rollupOptions: {
      output: {
        // 第三方库单独打包，业务代码更新时浏览器可继续使用缓存
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/highlight|lowlight|markdown|remark|rehype|micromark|mdast|hast|unified/.test(id)) return 'markdown'
          return 'vendor'
        },
      },
    },
  },
})
