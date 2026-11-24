import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_TARGET || env.BACKEND_URL || 'http://127.0.0.1:8005';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/pages': path.resolve(__dirname, './src/pages'),
        '@/features': path.resolve(__dirname, './src/pages'),
        '@/routes': path.resolve(__dirname, './src/routes'),
        '@/api': path.resolve(__dirname, './src/api'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/stores': path.resolve(__dirname, './src/stores'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        'react-i18next': path.resolve(__dirname, './src/i18n/index.ts'),
      },
    },
    server: {
      port: 5175,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/storage': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
