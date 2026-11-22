import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['import', 'global-builtin', 'color-functions']
      }
    }
  },
  server: {
    host: true, // Escucha en 127.0.0.1, localhost y en la red local
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:44311',
        changeOrigin: false,
        headers: { Host: 'localhost:44311' },
        secure: false, // Permite certificados autofirmados de desarrollo de ASP.NET
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/Files': {
        target: 'https://127.0.0.1:44311',
        changeOrigin: false,
        headers: { Host: 'localhost:44311' },
        secure: false
      },
      '/sitemap.xml': {
        target: 'https://127.0.0.1:44311',
        changeOrigin: false,
        headers: { Host: 'localhost:44311' },
        secure: false
      },
      '/hubs': {
        target: 'https://127.0.0.1:44311',
        changeOrigin: false,
        headers: { Host: 'localhost:44311' },
        secure: false,
        ws: true
      }
    }
  }
});
