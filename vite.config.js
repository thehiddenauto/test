import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Build configuration for production
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps for production
    minify: 'terser',
    
    // Optimize bundle splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor dependencies
          vendor: ['react', 'react-dom'],
          
          // Split router separately
          router: ['react-router-dom'],
          
          // Split UI libraries
          ui: ['lucide-react', 'framer-motion'],
          
          // Split external services
          services: ['@supabase/supabase-js', '@stripe/stripe-js', '@stripe/react-stripe-js'],
          
          // Split utilities
          utils: ['zustand', 'react-hot-toast', 'react-helmet-async']
        }
      }
    },
    
    // Terser configuration for production
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'] // Remove specific console methods
      },
      mangle: {
        safari10: true // Support Safari 10
      }
    },
    
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    chunkSizeWarningLimit: 1000, // Warn about chunks larger than 1MB
    
    // Target modern browsers for better optimization
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    cors: true,
    host: true // Allow external connections
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    open: true,
    cors: true,
    host: true
  },
  
  // Environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  },
  
  // CSS optimization
  css: {
    postcss: {
      plugins: []
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'zustand',
      'react-hot-toast'
    ],
    exclude: [
      '@supabase/supabase-js', // Large dependency, don't pre-bundle
      '@stripe/stripe-js'      // External service, load on demand
    ]
  },
  
  // Asset handling
  assetsInclude: ['**/*.woff2', '**/*.woff', '**/*.ttf'],
  
  // Production performance optimizations
  esbuild: {
    // Remove console and debugger in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})
