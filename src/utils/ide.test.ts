import { describe, expect, it } from 'vitest';
import { docEndLinks } from './ide';

describe('docEndLinks (글 끝 이동 줄)', () => {
  it('puts the next file first, then posts.log and 맨 위로', () => {
    const links = docEndLinks({
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
    expect(docEndLinks(null)).toEqual([
      { href: '/', label: 'posts.log' },
      { href: '#editor', label: '맨 위로' },
    ]);
  });
});
