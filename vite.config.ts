// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const manualVendorChunk = (id: string) => {
  if (!id.includes('node_modules')) {
    return undefined;
  }

  if (id.includes('@google/genai')) {
    return 'ai-sdk';
  }

  if (id.includes('recharts')) {
    return 'charts';
  }

  if (id.includes('@supabase/supabase-js')) {
    return 'supabase';
  }

  if (id.includes('@capacitor/')) {
    return 'capacitor';
  }

  if (id.includes('lucide-react')) {
    return 'icons';
  }

  if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
    return 'react-vendor';
  }

  return 'vendor';
}

export default defineConfig({
  base: './', // CRITICAL: Use relative paths for assets in Capacitor
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: manualVendorChunk,
      },
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
