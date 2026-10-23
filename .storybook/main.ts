import type { StorybookConfig } from '@storybook/react-vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-themes'],
  // 마루 부리 서브셋(/fonts/…)처럼 사이트가 public/에서 제공하는 파일을 같은 경로로 연다.
  staticDirs: ['../public'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (viteConfig) => {
    viteConfig.resolve = viteConfig.resolve || {};
    viteConfig.resolve.alias = {
      ...viteConfig.resolve.alias,
      '@': resolve(import.meta.dirname, '../src'),
    };
    viteConfig.plugins = viteConfig.plugins || [];
    viteConfig.plugins.push(tailwindcss());
    return viteConfig;
  },
};

export default config;
