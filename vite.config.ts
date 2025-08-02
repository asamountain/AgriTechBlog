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
      // Explicit React aliases to prevent duplication
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
    // Ensure single React instance
    dedupe: ['react', 'react-dom', 'react/jsx-runtime']
  },
  root: './client',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000, // Increase to 1MB to suppress warnings
    rollupOptions: {
      output: {
        // More aggressive chunking to isolate potential issues
        manualChunks: (id: string) => {
          // Absolutely keep React in main bundle
          if (id.includes('/react/') || 
              id.includes('/react-dom/') || 
              id.includes('react/jsx-runtime') ||
              id.includes('@tanstack/react-query')) {
            return undefined;
          }
          
          // Split vendor libraries more carefully
          if (id.includes('node_modules')) {
            // Large UI libraries
            if (id.includes('@radix-ui')) {
              return 'radix-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('wouter')) {
              return 'router-vendor';
            }
            // Everything else
            return 'vendor';
          }
          
          // Keep everything else in main bundle
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
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    // Force rebuild to ensure clean dependencies
    force: true
  },
});

