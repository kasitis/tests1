import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/tests1/',
  // THE CONFLICTING 'css' BLOCK HAS BEEN REMOVED.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
