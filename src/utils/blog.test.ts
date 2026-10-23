import { describe, expect, it, vi } from 'vitest';

type Entry = {
  id: string;
  body?: string;
  data: { title: string; pubDate: Date; tags: string[]; draft: boolean; description: string };
};

const entries: Entry[] = [];

vi.mock('astro:content', () => ({
  getCollection: async (_name: string, filter?: (e: Entry) => boolean) =>
    filter ? entries.filter(filter) : entries,
}));

const { getReadingTime, getPublishedPosts, getAllTags, getPostsByTag } = await import('./blog');

function entry(id: string, pubDate: string, tags: string[] = [], draft = false): Entry {
  return { id, data: { title: id, pubDate: new Date(pubDate), tags, draft, description: id } };
}

describe('getReadingTime', () => {
  it('reads empty content as 1 minute', () => {
    expect(getReadingTime('')).toBe(1);
  });

  it('counts 1000 Korean characters as 2 minutes', () => {
    expect(getReadingTime('가'.repeat(1000))).toBe(2);
  });

  it('counts 400 English words as 2 minutes', () => {
    expect(getReadingTime(Array(400).fill('word').join(' '))).toBe(2);
  });

  it('adds Korean and English time before rounding up', () => {
    // 300 chars = 0.6 min, 100 words = 0.5 min → 1.1 → 2
    const text = '가'.repeat(300) + ' ' + Array(100).fill('word').join(' ');
    expect(getReadingTime(text)).toBe(2);
  });
});

describe('getPublishedPosts', () => {
  it('drops drafts and future posts, newest first', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-23'));
    entries.splice(
      0,
      entries.length,
      entry('old', '2023-04-30', ['회고']),
      entry('new', '2026-01-01', ['회고', '커리어']),
      entry('draft', '2026-02-01', [], true),
      entry('future', '2027-01-01'),
    );

    const posts = await getPublishedPosts();
    expect(posts.map((p) => p.id)).toEqual(['new', 'old']);

    expect([...(await getAllTags()).entries()]).toEqual([
      ['회고', 2],
      ['커리어', 1],
    ]);
    expect((await getPostsByTag('커리어')).map((p) => p.id)).toEqual(['new']);
    vi.useRealTimers();
  });
});
