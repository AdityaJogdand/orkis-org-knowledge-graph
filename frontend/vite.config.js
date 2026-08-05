import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['ogl'],
  },
  server: {
    proxy: {
      "/auth": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
      "/admin": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
    },
  },
})