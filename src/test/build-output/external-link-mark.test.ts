import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isExternalLink } from '@/utils/external-link';
import { anchors, built, dist, pages, postBody } from './dist';

describe.skipIf(!built)('build output', () => {
  describe('external link mark', () => {
    const SPOKEN = '(외부 링크)';
    // 사이트 주소(astro.config의 `site`)는 사이트맵 주소에서 읽는다.
    const sitemap = built ? readFileSync(resolve(dist, 'sitemap-0.xml'), 'utf8') : '';
    const SITE = new URL(/<loc>([^<]+)<\/loc>/.exec(sitemap)?.[1] ?? 'https://invalid.example')
      .origin;

    // 지금 발행된 글 본문에는 링크가 없어 아래 두 검사는 링크가 생기면 그때부터 실제로 걸린다.
    // 표시를 넣는 규칙 자체는 src/utils/external-link.test.ts가 시험용 글 조각으로 본다.
    const posts = pages.filter(({ html }) => postBody(html) !== '');
    const bodyLinks = posts.flatMap(({ path, html }) =>
      anchors(postBody(html)).map((link) => ({ path, ...link })),
    );

    it('finds the post bodies', () => {
      expect(posts.length).toBeGreaterThan(0);
    });

    it('gives every external body link the ↗ icon and the hidden "(외부 링크)", without target', () => {
      const external = bodyLinks.filter(({ href }) => isExternalLink(href, SITE));
      const unmarked = external.filter(
        ({ inner, attributes }) =>
          !/<svg\b[^>]*aria-hidden="true"/.test(inner) ||
          !inner.includes(`<span class="sr-only"> ${SPOKEN}</span>`) ||
          /\btarget=/.test(attributes),
      );
      expect(unmarked).toEqual([]);
    });

    it('leaves same-site body links unmarked', () => {
      const marked = bodyLinks
        .filter(({ href }) => !isExternalLink(href, SITE))
        .filter(({ inner }) => inner.includes(SPOKEN) || inner.includes('<svg'));
      expect(marked).toEqual([]);
    });

    it('marks nothing outside the post body, such as the shell links', () => {
      const outside = pages.filter(({ html }) => html.replace(postBody(html), '').includes(SPOKEN));
      expect(outside.map(({ path }) => path)).toEqual([]);
    });
  });
});
