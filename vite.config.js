import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(async ({ mode }) => {
  const { HttpsProxyAgent } = await import('https-proxy-agent')
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiKey = env.VITE_ANTHROPIC_API_KEY || ''
  return {
    plugins: [react()],
    base: '/nuzzle-demo/',
    server: {
      proxy: {
        '/api/messages': {
          target: 'https://api.anthropic.com/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/messages/, '/messages'),
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          agent: new HttpsProxyAgent('http://127.0.0.1:7890'),
        },
      },
    },
  }
})
