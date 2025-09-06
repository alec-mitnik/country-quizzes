/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // 'build' for production, 'serve' for development
  const isProduction = command === 'build'

  return {
    plugins: [react()],
    esbuild: {
      drop: isProduction ? ['console'] : [],
    },
    test: {
      globals: true,
      // Unlike jsdom, can load stylesheets with nested selectors,
      // but still ignores the nested selectors themselves!
      environment: 'happy-dom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
    },
  };
})
