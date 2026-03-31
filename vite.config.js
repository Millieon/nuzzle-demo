import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // If embedding on a landing page as a sub-path:
  // base: '/demo/',
})
