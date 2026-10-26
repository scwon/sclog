import { describe, expect, it } from 'vitest';
import type { TreeYear } from './Shell';
import { nextFile } from './tree.logic';

/** 탐색기 트리 고정값: 연도 폴더는 최신 연도 먼저, 폴더 안의 글도 새 글 먼저. */
const tree: TreeYear[] = [
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

  it('returns null when there is only one post', () => {
    const single: TreeYear[] = [
      {
        year: '2023',
        files: [{ url: '/blog/only/', title: '한 편', path: 'posts/2023/only.mdx' }],
      },
    ];
    expect(nextFile(single, '/blog/only/')).toBeNull();
  });

  it('returns null for a URL that is not a post in the tree', () => {
    expect(nextFile(tree, '/')).toBeNull();
  });
});
