import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type { SearchIndex } from '@/design-system';
import { aiWrittenDir, blogDir, built, dist } from './dist';

const VOID = new Set([
  'area',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

/**
 * 글 화면에서 줄 번호가 붙는 블록(`ide.css`의 `.doc-fm-line, .doc-title, .doc-byline, .doc-notice, .doc-prose > *`)을
 * 문서 순서로 돌려준다. 값은 블록의 `id`(없으면 빈 문자열)다. 본문은 `.doc-prose`의 직계 자식만 센다.
 */
function numberedBlocks(html: string): string[] {
  const head = [
    ...html.matchAll(/<[a-z0-9]+\b[^>]*\bclass="(doc-fm-line|doc-title|doc-byline|doc-notice)"/g),
  ];
  const blocks = head.map(() => '');
  const start = /<div class="doc-prose"[^>]*>/.exec(html);
  if (!start) return blocks;
  const tag = /<(\/?)([a-zA-Z][\w-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  tag.lastIndex = start.index + start[0].length;
  let depth = 0;
  for (let match = tag.exec(html); match; match = tag.exec(html)) {
    const [, closing, name, attributes] = match;
    if (closing) {
      if (depth === 0) break;
      depth -= 1;
      continue;
    }
    if (depth === 0) blocks.push(/\bid="([^"]*)"/.exec(attributes)?.[1] ?? '');
    if (!VOID.has(name.toLowerCase()) && !attributes.trimEnd().endsWith('/')) depth += 1;
  }
  return blocks;
}

/**
 * 두 폴더의 원본 글 가운데 발행된 글(초안이 아니고 발행일이 지난 글)의 URL과 파일 경로, 최신 글부터.
 * 직접 쓴 글은 `/blog/<슬러그>/`·`posts/<연도>/…`, AI 글은 `/ai-written/<슬러그>/`·`ai-written/<연도>/…`.
 */
function publishedPosts(): { url: string; path: string }[] {
  const folders = [
    { dir: blogDir, postBase: '/blog/', root: 'posts' },
    { dir: aiWrittenDir, postBase: '/ai-written/', root: 'ai-written' },
  ];
  return folders
    .flatMap(({ dir, postBase, root }) =>
      readdirSync(dir)
        .filter((name) => name.endsWith('.mdx'))
        .map((name) => ({ dir, postBase, root, name })),
    )
    .map(({ dir, postBase, root, name }) => {
      const frontmatter = /^---\n([\s\S]*?)\n---/.exec(readFileSync(resolve(dir, name), 'utf8'));
      const field = (key: string) =>
        new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(frontmatter?.[1] ?? '')?.[1].trim();
      const slug = name.slice(0, -'.mdx'.length);
      const date = new Date(field('pubDate') ?? '');
      return {
        url: `${postBase}${slug}/`,
        path: `${root}/${date.getUTCFullYear()}/${name}`,
        date,
        draft: field('draft') === 'true',
      };
    })
    .filter(({ date, draft }) => !draft && date.valueOf() <= Date.now())
    .toSorted((a, b) => b.date.valueOf() - a.date.valueOf())
    .map(({ url, path }) => ({ url, path }));
}

describe.skipIf(!built)('build output', () => {
  describe('search index', () => {
    const path = resolve(dist, 'search-index.json');
    const raw = existsSync(path) ? readFileSync(path) : Buffer.alloc(0);
    const index = existsSync(path) ? (JSON.parse(raw.toString('utf8')) as SearchIndex) : null;

    it('is version 1 and has every published post of both folders, newest first', () => {
      expect(index?.v).toBe(1);
      const listed = index?.posts.map((post) => ({ url: post.url, path: post.path }));
      expect(listed).toEqual(publishedPosts());
      expect(listed?.some((post) => post.path.startsWith('ai-written/'))).toBe(true);
    });

    it.each(index?.posts ?? [])('numbers the last block of $url like its page', (post) => {
      const html = readFileSync(resolve(dist, `.${post.url}index.html`), 'utf8');
      const lines = numberedBlocks(html);
      expect(post.blocks.map(({ line }) => line)).toEqual(lines.map((_, i) => i + 1));
      expect(post.blocks.at(-1)?.line).toBe(lines.length);
      // 장·절 제목 블록이 글 화면에서 그 id를 가진 블록과 같은 줄에 있다.
      const headingLines = post.blocks
        .filter(({ chapter, section }) => chapter || section)
        .map(({ line, chapter, section }) => ({ id: section?.id ?? chapter?.id, line }))
        .filter(({ id }, i, all) => all.findIndex((other) => other.id === id) === i);
      expect(headingLines).toEqual(
        headingLines.map(({ id }) => ({ id, line: lines.indexOf(id ?? '') + 1 })),
      );
    });

    // 재검토 조건: 결정 티켓 `.scratch/blog-details/issues/01-search-options.md`, 연구 `docs/research/blog-search.md`.
    it('stays under 100KB gzipped', () => {
      expect(raw.length).toBeGreaterThan(0);
      const size = gzipSync(raw, { level: 9 }).length;
      // 넘으면 실패 내용에 재검토 안내가 그대로 보이도록 판정을 문장으로 비교한다.
      const verdict =
        size < 100 * 1024
          ? 'under 100KB'
          : `search-index.json is ${(size / 1024).toFixed(1)}KB gzipped (limit 100KB). ` +
            'Re-measure Pagefind against the JSON index with the real posts, as "다시 볼 때" in ' +
            'ticket 01 (.scratch/blog-details/issues/01-search-options.md) and "다시 검토할 조건" ' +
            'in docs/research/blog-search.md require.';
      expect(verdict).toBe('under 100KB');
    });
  });
});
