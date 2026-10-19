import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

// Resolve the canonical real path to fix OneDrive symlink/junction issues.
// OneDrive maps "sem 5 MiniProj" <-> "MINI PROJ SEM 5" and Vite uses the
// canonical path internally, causing dual React instances if root differs.
const __dirname = fs.realpathSync(path.dirname(fileURLToPath(import.meta.url)))

// https://vitejs.dev/config/
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      strict: false,
    },
  },
})
