import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SITE } from '@/site';
import { anchors, built, dist, pages, urlOf } from './dist';

describe.skipIf(!built)('build output', () => {
  it.each([
    'blog/pro-developer-2023-days/index.html',
    'blog/index.html',
    'blog/posts.log/index.html',
    'blog/tags/index.html',
    'blog/tags/회고/index.html',
    'ai-written/index.html',
    'ai-written/ai-written.log/index.html',
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

  it('lists only the two folders on the root, each linking to its directory view', () => {
    const html = readFileSync(resolve(dist, 'index.html'), 'utf8');
    const main = html.slice(html.indexOf('<main'));
    expect(/data-file-kind="root"/.test(main)).toBe(true);
    const links = anchors(main)
      .filter(({ attributes }) => attributes.includes('flow-entry-link'))
      .map(({ href, inner }) => ({ href, label: inner.replace(/<[^>]*>/g, '').trim() }));
    expect(links).toEqual([
      { href: '/blog/', label: 'posts/' },
      { href: '/ai-written/', label: 'ai-written/' },
    ]);
    expect(main.includes('flow-link')).toBe(false);
    expect(main.includes('flow-file')).toBe(false);
  });

  it.each([
    ['blog/index.html', '/blog/', '/blog/tags/', '/blog/posts.log/', 'posts.log'],
    [
      'ai-written/index.html',
      '/ai-written/',
      '/ai-written/tags/',
      '/ai-written/ai-written.log/',
      'ai-written.log',
    ],
  ])(
    'makes %s a directory view with tags/, the log and one file line per post of that folder',
    (file, base, tags, logUrl, logName) => {
      const html = readFileSync(resolve(dist, file), 'utf8');
      const main = html.slice(html.indexOf('<main'));
      expect(/data-file-kind="dir"/.test(main)).toBe(true);
      const entries = anchors(main)
        .filter(({ attributes }) => attributes.includes('flow-entry-link'))
        .map(({ href, inner }) => ({ href, label: inner.replace(/<[^>]*>/g, '').trim() }));
      expect(entries).toEqual([
        { href: tags, label: 'tags/' },
        { href: logUrl, label: logName },
      ]);
      const files = anchors(main)
        .filter(({ attributes }) => attributes.includes('flow-file-link'))
        .map(({ href }) => href);
      const posts = pages
        .map(({ path }) => urlOf(path))
        .filter((url) => url.startsWith(base) && !url.startsWith(tags) && url !== base)
        .filter((url) => url !== logUrl);
      expect(files.toSorted()).toEqual(posts.toSorted());
      // 연도 줄(`2023/` 제목)은 없다.
      expect(main.includes('년 글')).toBe(false);
    },
  );

  it('offers the root, then each folder directory view, log and tag list as places to go from 404', () => {
    const html = existsSync(resolve(dist, '404.html'))
      ? readFileSync(resolve(dist, '404.html'), 'utf8')
      : '';
    const main = html.slice(html.indexOf('<main'));
    const links = anchors(main)
      .filter(({ attributes }) => attributes.includes('flow-entry-link'))
      .map(({ href, inner }) => ({ href, label: inner.replace(/<[^>]*>/g, '').trim() }));
    expect(links).toEqual([
      { href: '/', label: '/' },
      { href: '/blog/', label: 'posts/' },
      { href: '/blog/posts.log/', label: 'posts.log' },
      { href: '/blog/tags/', label: 'tags/' },
      { href: '/ai-written/', label: 'ai-written/' },
      { href: '/ai-written/ai-written.log/', label: 'ai-written.log' },
      { href: '/ai-written/tags/', label: 'ai-written/tags/' },
    ]);
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
