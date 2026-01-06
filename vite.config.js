import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_NESHAN_API_KEY_SERVICE': JSON.stringify('service.57f87e02787a4f8385530b3b8bf5fd41'),
    'process.env.VITE_NEShan_API_KEY_WEB': JSON.stringify('web.93408d79c04a487a9f9209e2390c1af0')
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
