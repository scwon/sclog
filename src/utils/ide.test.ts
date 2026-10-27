import { describe, expect, it } from 'vitest';
import type { BlogPost } from './blog';
import { docEndLinks, fileCrumbs, postFile, postUrl } from './ide';

/** 컬렉션 하나의 글. 파일 크기는 보지 않으므로 `filePath`는 없다. */
function makePost(collection: 'blog' | 'ai-written', id: string, pubDate: string): BlogPost {
  return {
    id,
    collection,
    body: '',
    data: { title: id, pubDate: new Date(pubDate), tags: [], draft: false, description: id },
  } as unknown as BlogPost;
}

describe('글 주소와 파일 경로', () => {
  it('keeps /blog/<slug>/ and posts/<year>/<slug>.mdx for a post in the blog collection', () => {
    const post = makePost('blog', 'retro', '2023-04-30');
    expect(postUrl(post)).toBe('/blog/retro/');
    expect(postFile(post)).toMatchObject({
      path: 'posts/2023/retro.mdx',
      url: '/blog/retro/',
      kind: 'post',
    });
  });

  it('puts a post of the ai-written collection under /ai-written/ and ai-written/<year>/', () => {
    const post = makePost('ai-written', 'retro', '2026-10-01');
    expect(postUrl(post)).toBe('/ai-written/retro/');
    expect(postFile(post)).toMatchObject({
      path: 'ai-written/2026/retro.mdx',
      url: '/ai-written/retro/',
      kind: 'post',
    });
  });
});

describe('docEndLinks (글 끝 이동 줄)', () => {
  it('puts the next file first, then posts.log and 맨 위로', () => {
    const links = docEndLinks('posts', {
      url: '/blog/newer-post/',
      title: '다음 글 제목',
      path: 'posts/2025/newer-post.mdx',
    });
    expect(links).toEqual([
      {
        href: '/blog/newer-post/',
        label: 'newer-post.mdx →',
        note: '다음 글 제목',
        name: '다음 파일: 다음 글 제목',
        next: true,
      },
      { href: '/', label: 'posts.log' },
      { href: '#editor', label: '맨 위로' },
    ]);
  });

  it('drops only the next file line when there is no next file', () => {
    expect(docEndLinks('posts', null)).toEqual([
      { href: '/', label: 'posts.log' },
      { href: '#editor', label: '맨 위로' },
    ]);
  });

  it('returns to ai-written.log at /ai-written/ from an AI post', () => {
    expect(docEndLinks('ai-written', null)).toEqual([
      { href: '/ai-written/', label: 'ai-written.log' },
      { href: '#editor', label: '맨 위로' },
    ]);
  });
});

describe('fileCrumbs (경로 표시줄)', () => {
  it('links the posts segment of a post path to the home log', () => {
    expect(fileCrumbs({ path: 'posts/2023/retro.mdx', kind: 'post' })).toEqual([
      { label: 'posts', href: '/', current: false },
      { label: '2023', href: undefined, current: false },
      { label: 'retro.mdx', href: undefined, current: true },
    ]);
  });

  it('links the ai-written segment of an AI post path to ai-written.log', () => {
    expect(fileCrumbs({ path: 'ai-written/2026/retro.mdx', kind: 'post' })).toEqual([
      { label: 'ai-written', href: '/ai-written/', current: false },
      { label: '2026', href: undefined, current: false },
      { label: 'retro.mdx', href: undefined, current: true },
    ]);
  });

  it('puts a log tab under its folder: posts › posts.log, ai-written › ai-written.log', () => {
    expect(fileCrumbs({ path: 'posts.log', kind: 'log' })).toEqual([
      { label: 'posts', href: '/', current: false },
      { label: 'posts.log', href: undefined, current: true },
    ]);
    expect(fileCrumbs({ path: 'ai-written.log', kind: 'log' })).toEqual([
      { label: 'ai-written', href: '/ai-written/', current: false },
      { label: 'ai-written.log', href: undefined, current: true },
    ]);
  });

  it('links tags to the tag list', () => {
    expect(fileCrumbs({ path: 'tags/회고', kind: 'page' })).toEqual([
      { label: 'tags', href: '/blog/tags/', current: false },
      { label: '회고', href: undefined, current: true },
    ]);
  });
});
