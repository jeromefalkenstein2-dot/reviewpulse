import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // App Bridge needs this
    'process.env': {},
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Proxy only specific billing API endpoints, NOT the /billing frontend route
      '/billing/create-checkout': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/billing/portal': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/billing/webhook': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Track click endpoints go directly to backend
      '^/track/': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Unsubscribe links
      '^/unsubscribe/': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Auth routes
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
