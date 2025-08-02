import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Custom Vite plugin to suppress specific CSS warnings
function suppressCssWarnings() {
  return {
    name: 'suppress-css-warnings',
    configResolved(config: any) {
      const originalWarn = config.logger.warn;
      config.logger.warn = (msg: string, options: any) => {
        // Suppress specific CSS syntax warnings
        if (msg.includes('Expected identifier but found "-"') || 
            msg.includes('css-syntax-error')) {
          return;
        }
        originalWarn(msg, options);
      };
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    suppressCssWarnings()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  root: './client',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Simplified chunking to avoid module loading issues
        manualChunks: (id: string) => {
          // Keep React in main bundle to prevent useState errors
          if (id.includes('react') || id.includes('react-dom')) {
            return undefined;
          }
          
          // Only split large vendor libraries
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react') || id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('react-query') || id.includes('wouter')) {
              return 'query-vendor';
            }
            return 'vendor';
          }
          
          // Keep everything else in main bundle to avoid constructor issues
          return undefined;
        },
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
    // Enable minification and tree shaking
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', '@tanstack/react-query'],
  },
});

