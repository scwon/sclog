import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogDir, built, dist, fileUrl, pages, urlOf } from './dist';

describe.skipIf(!built)('build output', () => {
  describe('page ↔ shell contract', () => {
    it('gives every page an editor root whose data-file-url is its own URL', () => {
      const mismatched = pages
        .map(({ path, html }) => ({ expected: urlOf(path), actual: fileUrl(html) }))
        .filter(({ expected, actual }) => actual !== expected);
      expect(mismatched).toEqual([]);
    });

    it('keeps the post URLs: every post source has /blog/<slug>/', () => {
      const slugs = readdirSync(blogDir)
        .filter((name) => name.endsWith('.mdx'))
        .map((name) => name.slice(0, -'.mdx'.length));
      expect(slugs.length).toBeGreaterThan(0);
      const missing = slugs.filter(
        (slug) => !existsSync(resolve(dist, 'blog', slug, 'index.html')),
      );
      expect(missing).toEqual([]);
    });
  });
});
