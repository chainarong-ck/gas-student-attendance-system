import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vite.dev/config/
export default defineConfig({
  mode: 'production',
  plugins: [
    react(),
    viteSingleFile(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
