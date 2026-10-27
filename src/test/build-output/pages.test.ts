import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SITE } from '@/site';
import { built, dist, pages, urlOf } from './dist';

describe.skipIf(!built)('build output', () => {
  it.each([
    'blog/pro-developer-2023-days/index.html',
    'blog/index.html',
    'blog/tags/index.html',
    'blog/tags/회고/index.html',
    'ai-written/index.html',
    'ai-written/why-ai-written-folder/index.html',
    '404.html',
  ])('has %s', (file) => {
    expect(existsSync(resolve(dist, file))).toBe(true);
  });

  it('puts the AI notice under the title block of AI posts only, before the body', () => {
    const notice = `<p class="doc-notice">${SITE.aiWrittenNotice}</p>`;
    const posts = pages
      .map(({ path, html }) => ({ url: urlOf(path), html }))
      .filter(({ html }) => html.includes('data-file-kind="post"'));
    expect(posts.some(({ url }) => url.startsWith('/ai-written/'))).toBe(true);
    for (const { url, html } of posts) {
      const at = html.indexOf(notice);
      expect({ url, notice: at >= 0 }).toEqual({ url, notice: url.startsWith('/ai-written/') });
      if (at < 0) continue;
      expect(html.indexOf('</header>')).toBeLessThan(at);
      expect(at).toBeLessThan(html.indexOf('class="doc-prose"'));
    }
  });

  it('lists every page except 404 in the sitemap, with the same URLs', () => {
    expect(existsSync(resolve(dist, 'sitemap-index.xml'))).toBe(true);
    const sitemap = readFileSync(resolve(dist, 'sitemap-0.xml'), 'utf8');
    const listed = new Set(
      [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) =>
        decodeURI(new URL(loc).pathname),
      ),
    );
    const expected = pages.map(({ path }) => urlOf(path)).filter((url) => url !== '/404');
    expect([...listed].toSorted()).toEqual(expected.toSorted());
  });
});
