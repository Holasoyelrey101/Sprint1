import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['frontend-production-98d34.up.railway.app'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', //procurar siempre ocupar este puerto para el backend
        changeOrigin: true,
      },
      '/backend-status': {
        target: 'http://127.0.0.1:8000', //procurar siempre ocupar este puerto para el backend
        changeOrigin: true, 
        rewrite: () => '/',
      },
    },
  },
})
