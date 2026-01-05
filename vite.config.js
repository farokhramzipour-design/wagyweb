import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_MAP_IR_API_KEY': JSON.stringify('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjRjYzE4NzMwNDg0ZGM5NTE3OWRjYTAxMTJkZWE3M2Y2NDU3ZjQ4MDdmOTViN2JlODA5OTMzY2VmZDAwYWZiYTFhODdkYWUxYmZmYmIxODYwIn0.eyJhdWQiOiIzNjIyNyIsImp0aSI6IjRjYzE4NzMwNDg0ZGM5NTE3OWRjYTAxMTJkZWE3M2Y2NDU3ZjQ4MDdmOTViN2JlODA5OTMzY2VmZDAwYWZiYTFhODdkYWUxYmZmYmIxODYwIiwiaWF0IjoxNzY3NTQ1NjI1LCJuYmYiOjE3Njc1NDU2MjUsImV4cCI6MTc3MDA1MTIyNSwic3ViIjoiIiwic2NvcGVzIjpbImJhc2ljIl19.WXA-B-Q0zzggpGDatccflYtgcEX4yAeb5a3lk1_EURZ96dYa3WO-FQRknk8klp2-JLaS4Ige4h1HuGULsyNAdEm0JXXCQD9aPnsU_mNdU7npRAyi3AdAgrswGElVB21N5t8_MvbjtWzHv1YCgN5U0-8nJ2dAEeCRoIk8By1oBGGf8j2n3n1UN9sUuSwRK3b6NyCmisYNyQAJ8iETK-kv-y6G8DwehhifYB6PsiATGSUjWP0HO2tY8bT7w44oQM9I6768X8ManPtYeQKD9nM3Hp_h98-N9EriAxMNDcW9fet3tXCJzyMe03Bj2zK3fLAoJT3cYXv4Sn3AjsNd8bPdBg')
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
