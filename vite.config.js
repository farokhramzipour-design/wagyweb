import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_MAP_IR_API_KEY': JSON.stringify('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjhhOWIyMWU0MGNiNTY5MmEwYmI3NjdiMjM5YzJmMTQxZjZhMWI3MDA0NjBlMmNkMDdjOTdmZDU5NDcxYjA0MDNlZGYzZjE1ZDA5YjRkNjY5In0.eyJhdWQiOiIzNjI0NCIsImp0aSI6IjhhOWIyMWU0MGNiNTY5MmEwYmI3NjdiMjM5YzJmMTQxZjZhMWI3MDA0NjBlMmNkMDdjOTdmZDU5NDcxYjA0MDNlZGYzZjE1ZDA5YjRkNjY5IiwiaWF0IjoxNzY3NjM3MDc5LCJuYmYiOjE3Njc2MzcwNzksImV4cCI6MTc3MDE0MjY3OSwic3ViIjoiIiwic2NvcGVzIjpbImJhc2ljIl19.cFJtSI6iVDVZ5bMzgBWeIKmXYX_pd1Lb8DCpVpwo8VNOL2OVddOT16mHoBNdRGJ9lHtS7sFPEqJOch4v-9CS7_jdmsP3RSUV7UGZdIEkH9zhq_VbWzuo3Uhbzy_OI0a1mSMwpfh0lQk4Pdz9w1rHSgGTI6M8aRUKFJ-8rLUf6DATYE5AtBtTUnI0UJ0UnADyGwcahMgvpwxPLlJh4Zm4Mz2IMfB4rwOcgdAhSCWNcCXz9KuzjiESCkJ4aIVjV8UNr2h4czDz8Z5_3pfk0A--a0kfeRcyHb6XDC_OBx6ikp3VTBwJtdiyF9GkoQuZmfFgPzQphg3VkAzNr56_GGDLlQ')
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
