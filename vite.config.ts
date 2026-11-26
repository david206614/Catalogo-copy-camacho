import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE_PATH || (command === 'build' ? '/Catalogo-copy-camacho/' : '/'),
  plugins: [
    react(),
    tailwindcss(),
  ],
}))
