import { configDefaults, defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // 에이전트 워크트리(.claude/worktrees)의 테스트까지 잡지 않게 한다
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      'astro:content': resolve(import.meta.dirname, './src/test/astro-content.stub.ts'),
    },
  },
});
