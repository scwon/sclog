import { describe, expect, it } from 'vitest';
import type { SearchBlock, SearchIndex, SearchPost } from '../../stores/search-index';
import { capHits, excerpt, searchPosts } from './search.logic';

const developer = { id: '개발자란', no: '04', text: '개발자란?' };
const y34 = { id: '3-4년차', text: '3~4년차' };

/** 줄 번호를 1부터 매긴 블록들. 장·절은 블록마다 따로 준다. */
function post(slug: string, title: string, blocks: Omit<SearchBlock, 'line'>[]): SearchPost {
  return {
    url: `/blog/${slug}/`,
    title,
    path: `posts/2025/${slug}.mdx`,
    blocks: blocks.map((block, index) => ({ ...block, line: index + 1 })),
  };
}

const text = (
  value: string,
  chapter: SearchBlock['chapter'] = null,
  section: SearchBlock['section'] = null,
) => ({
  chapter,
  section,
  text: value,
});

/** 색인 고정값. `posts`는 최신 글이 먼저다. */
const index: SearchIndex = {
  v: 1,
  posts: [
    post('newest', '가장 새 글', [text('가장 새 글'), text('개발 이야기 하나', developer)]),
    post('middle', '중간 글', [
      text('중간 글'),
      text('개발 둘', developer),
      text('개발 셋', developer, y34),
      text(''),
    ]),
    post('oldest', '개발 일지', [text('개발 일지'), text('오래된 본문')]),
  ],
};

describe('searchPosts', () => {
  it('ignores queries shorter than two characters after trimming', () => {
    expect(searchPosts(index, '개')).toBeNull();
    expect(searchPosts(index, '  개 ')).toBeNull();
    expect(searchPosts(index, '')).toBeNull();
  });

  it('finds "개발" from a syllable still being typed ("개바")', () => {
    const results = searchPosts(index, '개바');
    expect(results?.files.map((file) => file.name)).toEqual([
      'oldest.mdx',
      'middle.mdx',
      'newest.mdx',
    ]);
  });

  it('finds part of a compound word ("발자" in "개발자")', () => {
    const results = searchPosts(
      { v: 1, posts: [post('a', '글', [text('나는 개발자다')])] },
      '발자',
    );
    expect(results?.files[0].hits[0].ranges).toEqual([[4, 6]]);
  });

  it('trims the query and ignores case', () => {
    const results = searchPosts(
      { v: 1, posts: [post('a', '글', [text('Astro 아일랜드')])] },
      '  ASTRO ',
    );
    expect(results?.lines).toBe(1);
  });

  it('ranks title matches first, then more matching lines, then newer posts', () => {
    const results = searchPosts(index, '개발');
    // oldest: 제목에 "개발" → 맨 위. middle(2줄)이 newest(1줄)보다 위.
    expect(results?.files.map((file) => file.path)).toEqual([
      'posts/2025/oldest.mdx',
      'posts/2025/middle.mdx',
      'posts/2025/newest.mdx',
    ]);
  });

  it('keeps newer posts first when title and line count tie', () => {
    const tie: SearchIndex = {
      v: 1,
      posts: [post('new', '새 글', [text('개발')]), post('old', '옛 글', [text('개발')])],
    };
    expect(searchPosts(tie, '개발')?.files.map((file) => file.name)).toEqual([
      'new.mdx',
      'old.mdx',
    ]);
  });

  it('summarises file and line counts, one line per matching block', () => {
    const results = searchPosts(
      { v: 1, posts: [post('a', '글', [text('개발 개발 개발'), text('개발')])] },
      '개발',
    );
    expect(results?.files).toHaveLength(1);
    expect(results?.lines).toBe(2);
    expect(results?.files[0].hits[0].ranges).toHaveLength(3);
  });

  it('lists lines in post order with the line number of the post screen', () => {
    const results = searchPosts(index, '개발');
    const middle = results?.files.find((file) => file.name === 'middle.mdx');
    expect(middle?.hits.map((hit) => hit.line)).toEqual([2, 3]);
  });

  it('writes the place as "04 chapter › section · Ln N", or just "Ln N" before the first chapter', () => {
    const results = searchPosts(index, '개발');
    const [oldest, middle] = results?.files ?? [];
    expect(oldest.hits.map((hit) => hit.place)).toEqual(['Ln 1']);
    expect(middle.hits.map((hit) => hit.place)).toEqual([
      '04 개발자란? · Ln 2',
      '04 개발자란? › 3~4년차 · Ln 3',
    ]);
  });

  it('links to the section anchor, else the chapter anchor, else the top of the post', () => {
    const results = searchPosts(index, '개발');
    const [oldest, middle] = results?.files ?? [];
    expect(oldest.hits[0].href).toBe('/blog/oldest/');
    expect(middle.hits.map((hit) => hit.href)).toEqual([
      '/blog/middle/#개발자란',
      '/blog/middle/#3-4년차',
    ]);
  });

  it('returns no files when nothing matches', () => {
    expect(searchPosts(index, '디자인')).toEqual({ files: [], lines: 0 });
  });
});

describe('capHits', () => {
  const hits = [1, 2, 3, 4, 5, 6, 7].map((line) => ({ line }));

  it('shows the first five lines and counts the rest', () => {
    expect(capHits(hits, false)).toEqual({ shown: hits.slice(0, 5), more: 2 });
  });

  it('shows every line once expanded', () => {
    expect(capHits(hits, true)).toEqual({ shown: hits, more: 0 });
  });

  it('has nothing more when five or fewer lines match', () => {
    expect(capHits(hits.slice(0, 5), false)).toEqual({ shown: hits.slice(0, 5), more: 0 });
  });
});

describe('excerpt', () => {
  it('cuts at a word boundary instead of inside a word', () => {
    const line = 'tags: ["회고", "개발자", "프론트엔드"]';
    const at = line.indexOf('개발');
    expect(excerpt(line, [[at, at + 2]]).text).toBe('…["회고", "개발자", "프론트엔드"]');
  });

  it('keeps short text whole', () => {
    expect(excerpt('나는 개발자다', [[3, 5]])).toEqual({ text: '나는 개발자다', ranges: [[3, 5]] });
  });

  it('cuts the front with "…" so the first match sits near the start, shifting the ranges', () => {
    const long = `${'가'.repeat(40)} 개발 ${'나'.repeat(10)} 개발`;
    const first = long.indexOf('개발');
    const second = long.lastIndexOf('개발');
    const cut = excerpt(long, [
      [first, first + 2],
      [second, second + 2],
    ]);
    expect(cut.text.startsWith('…')).toBe(true);
    expect(cut.text.indexOf('개발')).toBeLessThanOrEqual(16);
    expect(cut.ranges.map(([start, end]) => cut.text.slice(start, end))).toEqual(['개발', '개발']);
  });
});
