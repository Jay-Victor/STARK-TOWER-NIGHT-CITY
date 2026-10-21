import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // GitHub Pages serves this repository from a subpath. Local development and
  // regular builds keep the root base so the experience works at 127.0.0.1.
  base: mode === 'github-pages' ? '/STARK-TOWER-NIGHT-CITY/' : '/',
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1800,
  },
}))
