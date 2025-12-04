// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: './', // CRITICAL: Use relative paths for assets in Capacitor
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // 这里是关键配置
    proxy: {
      '/IBSjnuweb': { // 匹配所有以 /IBSjnuweb 开头的请求
        target: 'https://pynhcx.jnu.edu.cn', // 转发目标
        changeOrigin: true, // 修改请求头中的 Host 为目标域名
        secure: false, // 忽略 SSL 证书验证（因为学校有些证书可能是自签名的或过期的）
      }
    }
  }
})