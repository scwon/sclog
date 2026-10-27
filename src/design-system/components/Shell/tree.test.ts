import { describe, expect, it } from 'vitest';
import type { TreeRoot } from './Shell';
import { nextFile, treeUrls } from './tree.logic';

/**
 * 탐색기 트리 고정값: 루트 폴더(`posts` 먼저, `ai-written` 다음), 그 안의 연도 폴더는 최신 연도 먼저,
 * 폴더 안의 글도 새 글 먼저.
 */
const tree: TreeRoot[] = [
  {
    name: 'posts',
    years: [
      {
        year: '2025',
        files: [
          { url: '/blog/c/', title: '셋째 글', path: 'posts/2025/c.mdx' },
          { url: '/blog/b/', title: '둘째 글', path: 'posts/2025/b.mdx' },
          { url: '/blog/a/', title: '첫 글', path: 'posts/2025/a.mdx' },
        ],
      },
      {
        year: '2024',
        files: [{ url: '/blog/old/', title: '지난해 글', path: 'posts/2024/old.mdx' }],
      },
    ],
  },
  {
    name: 'ai-written',
    years: [
      {
        year: '2025',
        files: [
          { url: '/ai-written/y/', title: 'AI 둘째 글', path: 'ai-written/2025/y.mdx' },
          { url: '/ai-written/x/', title: 'AI 첫 글', path: 'ai-written/2025/x.mdx' },
        ],
      },
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

  it('does not cross into the next folder', () => {
    expect(nextFile(tree, '/blog/old/')).toBeNull();
  });

  it('continues an AI-written post with an AI-written post', () => {
    expect(nextFile(tree, '/ai-written/x/')?.url).toBe('/ai-written/y/');
  });

  it('does not cross into the next root folder, even with the same year', () => {
    expect(nextFile(tree, '/ai-written/y/')).toBeNull();
    expect(nextFile(tree, '/blog/c/')).toBeNull();
  });

  it('returns null when there is only one post', () => {
    const single: TreeRoot[] = [
      {
        name: 'posts',
        years: [
          {
            year: '2023',
            files: [{ url: '/blog/only/', title: '한 편', path: 'posts/2023/only.mdx' }],
          },
        ],
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
