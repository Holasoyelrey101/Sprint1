import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['https://sprint1-production-3874.up.railway.app/'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/backend-status': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true, 
        rewrite: () => '/',
      },
    },
  },
})
