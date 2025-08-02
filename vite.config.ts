import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Custom plugin to suppress CSS warnings
const suppressCssWarnings = () => {
  return {
    name: 'suppress-css-warnings',
    configResolved(config: any) {
      // Override console.warn to filter out CSS syntax warnings
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes('Expected identifier but found "-"') || 
            message.includes('css-syntax-error')) {
          return; // Suppress CSS syntax warnings
        }
        originalWarn.apply(console, args);
      };
    }
  };
};

export default defineConfig({
  plugins: [react(), suppressCssWarnings()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    // Increase chunk size warning limit to 800KB for better control
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Manual chunk splitting to reduce bundle sizes
        manualChunks: (id) => {
          // Keep React and React-DOM in main bundle to prevent useState errors
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              // Return undefined to keep React in main bundle
              return undefined;
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
              return 'utils-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            if (id.includes('@tiptap')) {
              return 'editor-vendor';
            }
            // Other node_modules go to vendor chunk
            return 'vendor';
          }
          
          // Split pages into individual chunks
          if (id.includes('/pages/')) {
            if (id.includes('admin-seo-dashboard')) {
              return 'admin-seo';
            }
            if (id.includes('admin-working')) {
              return 'admin-working';
            }
            if (id.includes('create-post')) {
              return 'create-post';
            }
            if (id.includes('blog-post')) {
              return 'blog-post';
            }
            if (id.includes('home')) {
              return 'home';
            }
            if (id.includes('posts')) {
              return 'posts';
            }
            return 'pages';
          }
          
          // Split components
          if (id.includes('/components/')) {
            if (id.includes('debug-flow-visualizer')) {
              return 'debug-components';
            }
            if (id.includes('/ui/')) {
              return 'ui-components';
            }
            return 'components';
          }
          
          // Split hooks and libs
          if (id.includes('/hooks/') || id.includes('/lib/')) {
            return 'utils';
          }
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
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    // Enable source maps for debugging (optional)
    sourcemap: false,
  },
  css: {
    // Suppress CSS warnings during build
    devSourcemap: false,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      'date-fns',
      'clsx',
      'tailwind-merge',
      '@tanstack/react-query',
      'framer-motion',
    ],
  },
});

