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
        // Updated from localhost to your live Vercel backend server URL
        target: 'https://quick-ai-server-7fzzdc43e-afzaal-hassans-projects.vercel.app', 
        changeOrigin: true,
        timeout: 60000, // 60 seconds
        proxyTimeout: 60000,
      },
    },
  },
})