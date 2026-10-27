import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Entry = {
  id: string;
  collection: 'blog' | 'ai-written';
  body?: string;
  data: { title: string; pubDate: Date; tags: string[]; draft: boolean; description: string };
};

const entries: Entry[] = [];

vi.mock('astro:content', () => ({
  getCollection: async (name: string, filter?: (e: Entry) => boolean) =>
    entries.filter((e) => e.collection === name && (!filter || filter(e))),
}));

const { getReadingTime, getPublishedPosts, getAllTags, getPostsByTag, postPaths } =
  await import('./blog');

/** 글 화면 정적 경로의 [슬러그, 글 id] 쌍. */
async function slugs(folder: 'posts' | 'ai-written') {
  return (await postPaths(folder)).map(({ params, props }) => [params.slug, props.post.id]);
}

function makePost(
  id: string,
  pubDate: string,
  tags: string[] = [],
  draft = false,
  collection: Entry['collection'] = 'blog',
): Entry {
  return {
    id,
    collection,
    data: { title: id, pubDate: new Date(pubDate), tags, draft, description: id },
  };
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

describe('published posts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-23'));
    entries.splice(
      0,
      entries.length,
      makePost('old', '2023-04-30', ['회고']),
      makePost('new', '2026-01-01', ['회고', '커리어']),
      makePost('draft', '2026-02-01', [], true),
      makePost('future', '2027-01-01'),
      makePost('ai-mid', '2025-06-01', ['회고', 'AI'], false, 'ai-written'),
      makePost('ai-draft', '2026-03-01', [], true, 'ai-written'),
      makePost('ai-future', '2027-02-01', [], false, 'ai-written'),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('getPublishedPosts of the posts folder drops drafts and future posts, newest first', async () => {
    const posts = await getPublishedPosts('posts');
    expect(posts.map((p) => p.id)).toEqual(['new', 'old']);
  });

  it('getPublishedPosts of the ai-written folder applies the same draft and date rules', async () => {
    const posts = await getPublishedPosts('ai-written');
    expect(posts.map((p) => p.id)).toEqual(['ai-mid']);
  });

  it('getPublishedPosts without a folder merges both folders, newest first', async () => {
    const posts = await getPublishedPosts();
    expect(posts.map((p) => p.id)).toEqual(['new', 'ai-mid', 'old']);
  });

  it('getAllTags counts tags of one folder only', async () => {
    expect([...(await getAllTags('posts')).entries()]).toEqual([
      ['회고', 2],
      ['커리어', 1],
    ]);
    expect([...(await getAllTags('ai-written')).entries()]).toEqual([
      ['회고', 1],
      ['AI', 1],
    ]);
  });

  it('getPostsByTag returns published posts of one folder carrying the tag', async () => {
    expect((await getPostsByTag('posts', '회고')).map((p) => p.id)).toEqual(['new', 'old']);
    expect((await getPostsByTag('ai-written', '회고')).map((p) => p.id)).toEqual(['ai-mid']);
  });

  it('postPaths gives a page only to published posts of one folder, by slug', async () => {
    expect(await slugs('posts')).toEqual([
      ['new', 'new'],
      ['old', 'old'],
    ]);
    expect(await slugs('ai-written')).toEqual([['ai-mid', 'ai-mid']]);
  });
});
