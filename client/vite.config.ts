import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server:{
    allowedHosts: [
      "f42e-160-176-153-214.ngrok-free.app",
    ],
    proxy: {
      "/api": {
        target: "https://neelearningandtranslationservices.onrender.com",
        changeOrigin: true,
        secure: true,
      },
      "/payments": {
        target: "https://neelearningandtranslationservices.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  }
})
