import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath, URL } from 'node:url';

// Force unique build timestamp
const timestamp = Date.now();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './client/src'),
      '@shared': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './shared'),
    },
  },
  root: './client',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Force different file names to bypass cache with timestamp
    rollupOptions: {
      output: {
        assetFileNames: `assets/[name].${timestamp}.[ext]`,
        chunkFileNames: `assets/[name].${timestamp}.js`,
        entryFileNames: `assets/[name].${timestamp}.js`,
      },
    },
    minify: 'terser',
    sourcemap: false,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    },
  },
});

