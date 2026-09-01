import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
})
