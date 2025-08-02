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
    // Ensure single React instance
    dedupe: ['react', 'react-dom']
  },
  root: './client',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000, // Increase to 1MB to suppress warnings
    rollupOptions: {
      output: {
        // Simplified chunking to prevent React duplication
        manualChunks: (id: string) => {
          // Keep React ecosystem in main bundle to prevent duplication
          if (id.includes('react') || id.includes('react-dom') || id.includes('@tanstack/react-query')) {
            return undefined;
          }
          
          // Split only the largest vendor libraries
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react') || id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('wouter')) {
              return 'router-vendor';
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
    include: ['react', 'react-dom'],
    // Force single React instance
    force: true
  },
});

