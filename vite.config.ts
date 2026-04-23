import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { schoolApiMock } from './vite-plugin-school-mock.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), schoolApiMock()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
