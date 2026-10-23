import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      'astro:content': resolve(import.meta.dirname, './src/test/astro-content.stub.ts'),
    },
  },
});
