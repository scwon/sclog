import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1).max(100),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    description: z.string().min(1).max(160),
    tags: z.array(z.string().min(1).max(30)).max(10).default([]),
    heroImage: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
};
