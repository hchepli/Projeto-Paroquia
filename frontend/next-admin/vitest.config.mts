import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    environment: 'node',
    // proxy.test.ts fica na raiz (ao lado do proxy.ts) e estava fora do include
    include: ['src/**/*.test.ts', '*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
});