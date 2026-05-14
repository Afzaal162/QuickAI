import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // or your backend port
        changeOrigin: true,
        timeout: 60000, // 60 seconds
        proxyTimeout: 60000,
      },
    },
  },
})