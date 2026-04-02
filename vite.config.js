import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // If embedding on a landing page as a sub-path:
  // base: '/demo/',
  base: '/nuzzle-demo/',
  server: {
    proxy: {
      '/api/messages': {
        target: 'https://api.anthropic.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/messages/, '/messages'),
      },
    },
  },
})
