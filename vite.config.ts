<<<<<<< HEAD
/// <reference types="vitest" />
=======
>>>>>>> 3c50204b6f6401d3fe61679a14f59cac0e926379
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
<<<<<<< HEAD
      test: {
        globals: true,
        environment: 'jsdom',
        include: ['services/**/*.test.ts', 'components/**/*.test.tsx'],
        setupFiles: ['./setupTests.ts'],
        css: { modules: { classNameStrategy: 'non-scoped' } },
        coverage: {
          provider: 'v8',
          reporter: ['text', 'lcov', 'html'],
          include: ['services/**/*.ts', 'components/**/*.tsx'],
          exclude: ['services/**/*.test.ts', 'services/**/__mocks__/**', 'components/**/*.test.tsx'],
        },
      },
=======
>>>>>>> 3c50204b6f6401d3fe61679a14f59cac0e926379
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
<<<<<<< HEAD
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
                return 'vendor-recharts';
              }
              if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('node_modules/lucide-react')) {
                return 'vendor-lucide';
              }
              if (id.includes('node_modules/framer-motion')) {
                return 'vendor-framer';
              }
            }
          }
        }
=======
>>>>>>> 3c50204b6f6401d3fe61679a14f59cac0e926379
      }
    };
});
