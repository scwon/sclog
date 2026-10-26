import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { markdownToHtml, mdxToJs } from 'satteri';
import { describe, expect, it } from 'vitest';
// 창 틀 아이콘과 같은 모양인지 맞대어 보려고 테스트에서만 아이콘 파일을 직접 가져온다.
import { ExternalIcon } from '@/design-system/components/Shell/icons';
import { hastExternalLinks, isExternalLink } from './external-link';

const SITE = 'https://www.scwon.me';

describe('isExternalLink', () => {
  it.each(['https://github.com/scwon', 'http://example.com/a?b=c#d', '//example.com/path'])(
    'is true for another host: %s',
    (href) => {
      expect(isExternalLink(href, SITE)).toBe(true);
    },
  );

  it.each([
    'https://www.scwon.me/blog/',
    'https://scwon.me/blog/',
    'http://SCWON.me',
    'https://www.scwon.me',
  ])('is false for the site host with or without www.: %s', (href) => {
    expect(isExternalLink(href, SITE)).toBe(false);
  });

  it.each(['/blog/pro-developer-2023-days/', 'other/', '../a', ''])(
    'is false for a relative URL: %s',
    (href) => {
      expect(isExternalLink(href, SITE)).toBe(false);
    },
  );

  it.each(['#왜-개발자', '#'])('is false for a hash: %s', (href) => {
    expect(isExternalLink(href, SITE)).toBe(false);
  });

  it.each(['mailto:scwon1999@gmail.com', 'tel:010', 'javascript:void(0)'])(
    'is false for a non-http(s) scheme: %s',
    (href) => {
      expect(isExternalLink(href, SITE)).toBe(false);
    },
  );

  it('treats a site given without www. the same way', () => {
    expect(isExternalLink('https://www.scwon.me/a', 'https://scwon.me')).toBe(false);
    expect(isExternalLink('https://github.com', 'https://scwon.me')).toBe(true);
  });
});

/**
 * 시험용 글 조각을 빌드와 같은 처리기(Sätteri)로 HTML로 바꾼다.
 * 플러그인 목록을 넘기면 결과 타입이 Promise일 수도 있게 잡히므로 `await`로 받는다.
 */
async function render(markdown: string, plugins = [hastExternalLinks({ site: SITE })]) {
  return (await markdownToHtml(markdown, { hastPlugins: plugins })).html;
}

/** 시험용 MDX 조각을 JS로 바꾼다. */
async function compile(mdx: string) {
  return (await mdxToJs(mdx, { hastPlugins: [hastExternalLinks({ site: SITE })] })).code;
}

/** 스크린 리더가 읽는 글자: `aria-hidden` svg와 태그를 걷어 낸다. */
function spoken(html: string): string {
  return html.replace(/<svg\b[^>]*aria-hidden="true"[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '');
}

describe('hastExternalLinks', () => {
  it('reads an external link with "(외부 링크)" and draws an aria-hidden ↗ svg', async () => {
    const html = await render('[GitHub 저장소](https://github.com/scwon)');

    expect(spoken(html).trim()).toBe('GitHub 저장소 (외부 링크)');
    expect(html).toMatch(/<svg\b[^>]*aria-hidden="true"/);
  });

  it('keeps the last letter and the ↗ together in a no-wrap group', async () => {
    const html = await render('[GitHub 저장소](https://github.com/scwon)');

    // 묶음 앞 글자와 묶음 사이에 공백이 없으므로 묶음 경계에서 줄이 바뀔 자리가 생기지 않는다.
    expect(html).toContain('GitHub 저장<span class="whitespace-nowrap">소<svg');
  });

  it('glues the ↗ to an element that ends the link, such as inline code', async () => {
    const html = await render('[설정 `astro.config.mjs`](https://docs.astro.build/)');

    expect(html).toContain('<span class="whitespace-nowrap"><code>astro.config.mjs</code><svg');
    expect(spoken(html).trim()).toBe('설정 astro.config.mjs (외부 링크)');
  });

  it('marks a bare URL that GFM turns into a link', async () => {
    expect(spoken(await render('출처: https://example.com/a')).trim()).toBe(
      '출처: https://example.com/a (외부 링크)',
    );
  });

  it('adds no target and leaves the link attributes as they were', async () => {
    const html = await render('[예시](https://example.com "예시 사이트")');

    expect(html).toContain('<a href="https://example.com" title="예시 사이트">');
    expect(html).not.toContain('target=');
  });

  it.each([
    'https://scwon.me/blog/',
    '/blog/pro-developer-2023-days/',
    '#왜-개발자',
    'mailto:scwon1999@gmail.com',
  ])('leaves a link to %s unmarked', async (href) => {
    const markdown = `[여기](${href})`;
    expect(await render(markdown)).toBe(await render(markdown, []));
  });

  it('marks a link written as JSX <a href="…"> in MDX, and only an external one', async () => {
    expect(await compile('<a href="https://github.com">GitHub</a>')).toContain('(외부 링크)');
    expect(await compile('<a href="/blog/">글 목록</a>')).not.toContain('(외부 링크)');
  });

  it('draws the same ↗ as the shell GitHub link', async () => {
    const path = /<path d="([^"]+)"/.exec(await render('[GitHub](https://github.com)'))?.[1];
    const shell = renderToStaticMarkup(createElement(ExternalIcon));

    expect(path).toBeDefined();
    expect(shell).toContain(`d="${path}"`);
  });
});
