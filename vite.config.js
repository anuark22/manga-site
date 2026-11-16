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
        target: 'https://localhost:44311',
        changeOrigin: true,
        secure: false, // Permite certificados autofirmados de desarrollo de ASP.NET
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/Files': {
        target: 'https://localhost:44311',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
