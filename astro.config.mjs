// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import { satteri } from '@astrojs/markdown-satteri';
import { hastExternalLinks } from './src/utils/external-link.ts';

const site = 'https://www.scwon.me';

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [
    // 글 본문(MDX)은 Astro 기본 처리기(Sätteri)에 외부 링크 표시 단계만 더해 그린다.
    mdx({ processor: satteri({ hastPlugins: [hastExternalLinks({ site })] }) }),
    sitemap(),
    react(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
