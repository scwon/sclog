import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** 글 frontmatter. 두 컬렉션이 같은 것을 쓴다. 글의 종류는 필드가 아니라 파일이 놓인 폴더가 정한다(ADR 0005). */
const postSchema = z.object({
  title: z.string().min(1).max(100),
  pubDate: z.date(),
  updatedDate: z.date().optional(),
  description: z.string().min(1).max(160),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
  heroImage: z.string().optional(),
  draft: z.boolean().default(false),
});

/** 직접 쓴 글(`posts` 폴더). */
const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: postSchema,
});

/** AI 글(`ai-written` 폴더). */
const aiWrittenCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/ai-written' }),
  schema: postSchema,
});

export const collections = {
  blog: blogCollection,
  'ai-written': aiWrittenCollection,
};
