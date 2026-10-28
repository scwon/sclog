import { describe, expect, it } from 'vitest';
import type { TreeRoot } from './Shell';
import { nextFile, treeUrls } from './tree.logic';

/** 탐색기 트리 고정값: 루트 폴더(`posts` 먼저, `ai-written` 다음), 폴더 안의 글은 새 글 먼저(연도로 나누지 않음). */
const tree: TreeRoot[] = [
  {
    name: 'posts',
    url: '/blog/',
    files: [
      { url: '/blog/c/', title: '셋째 글', path: 'posts/2025/c.mdx' },
      { url: '/blog/b/', title: '둘째 글', path: 'posts/2025/b.mdx' },
      { url: '/blog/a/', title: '첫 글', path: 'posts/2025/a.mdx' },
      { url: '/blog/old/', title: '지난해 글', path: 'posts/2024/old.mdx' },
    ],
  },
  {
    name: 'ai-written',
    url: '/ai-written/',
    files: [
      { url: '/ai-written/y/', title: 'AI 둘째 글', path: 'ai-written/2025/y.mdx' },
      { url: '/ai-written/x/', title: 'AI 첫 글', path: 'ai-written/2025/x.mdx' },
    ],
  },
];

describe('nextFile (다음 파일)', () => {
  it('returns the post right after it in the same folder, the newer one', () => {
    expect(nextFile(tree, '/blog/a/')).toEqual({
      url: '/blog/b/',
      title: '둘째 글',
      path: 'posts/2025/b.mdx',
    });
    expect(nextFile(tree, '/blog/b/')?.url).toBe('/blog/c/');
  });

  it('returns null for the newest post of a folder', () => {
    expect(nextFile(tree, '/blog/c/')).toBeNull();
  });

  it('crosses years inside a folder: the newest post of last year continues with the oldest of this year', () => {
    expect(nextFile(tree, '/blog/old/')?.url).toBe('/blog/a/');
  });

  it('continues an AI-written post with an AI-written post', () => {
    expect(nextFile(tree, '/ai-written/x/')?.url).toBe('/ai-written/y/');
  });

  it('does not cross into the next root folder', () => {
    expect(nextFile(tree, '/ai-written/y/')).toBeNull();
    expect(nextFile(tree, '/blog/c/')).toBeNull();
  });

  it('returns null when there is only one post', () => {
    const single: TreeRoot[] = [
      {
        name: 'posts',
        url: '/blog/',
        files: [{ url: '/blog/only/', title: '한 편', path: 'posts/2023/only.mdx' }],
      },
    ];
    expect(nextFile(single, '/blog/only/')).toBeNull();
  });

  it('returns null for a URL that is not a post in the tree', () => {
    expect(nextFile(tree, '/')).toBeNull();
  });
});

describe('treeUrls', () => {
  it('lists the post URLs of every root folder, posts first', () => {
    expect(treeUrls(tree)).toEqual([
      '/blog/c/',
      '/blog/b/',
      '/blog/a/',
      '/blog/old/',
      '/ai-written/y/',
      '/ai-written/x/',
    ]);
  });
});
