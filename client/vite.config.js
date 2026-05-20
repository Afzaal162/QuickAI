import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on current mode (development or production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          // Fallback to localhost during local dev if VITE_BASE_URL isn't set locally
          target: env.VITE_BASE_URL || 'http://localhost:3000', 
          changeOrigin: true,
          timeout: 60000,
          proxyTimeout: 60000,
        },
      },
    },
  }
})