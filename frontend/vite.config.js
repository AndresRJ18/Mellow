import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/analyze': { target: 'http://localhost:8000', changeOrigin: true },
      '/refine': { target: 'http://localhost:8000', changeOrigin: true },
      '/artists': { target: 'http://localhost:8000', changeOrigin: true },
      '/playlist': { target: 'http://localhost:8000', changeOrigin: true },
      '/auth/login': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
