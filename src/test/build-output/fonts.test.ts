import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { built, dist, pages, styles } from './dist';

describe.skipIf(!built)('build output', () => {
  describe('fonts', () => {
    const fontFaces = styles.flatMap(({ css }) =>
      [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => ({
        family: /font-family:\s*["']?([^;"']+)/.exec(body)?.[1] ?? '',
        urls: [...body.matchAll(/url\(\s*["']?([^"')]+)/g)].map(([, url]) => url),
      })),
    );

    it('loads nothing from external font hosts', () => {
      const external = /fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net/;
      const offending = [
        ...pages.map(({ path, html }) => ({ path, text: html })),
        ...styles.map(({ path, css }) => ({ path, text: css })),
      ]
        .filter(({ text }) => external.test(text))
        .map(({ path }) => path);
      expect(offending).toEqual([]);
    });

    it.each([
      'Bricolage Grotesque Variable',
      'Pretendard Variable',
      'MaruBuri',
      'JetBrains Mono Variable',
    ])('ships @font-face for %s', (family) => {
      expect(fontFaces.some((face) => face.family === family)).toBe(true);
    });

    it('serves every @font-face file from the site itself', () => {
      const urls = fontFaces.flatMap((face) => face.urls);
      expect(urls.length).toBeGreaterThan(0);
      // 같은 출처 경로: 루트 기준 `/…`이며 `//host`나 `https:`가 아니고, dist에 실제 파일이 있다.
      // Vite가 작은 파일을 CSS에 인라인한 `data:`는 요청이 없으므로 허용한다.
      const missing = urls
        .filter((url) => !url.startsWith('data:'))
        .filter(
          (url) =>
            !url.startsWith('/') || url.startsWith('//') || !existsSync(resolve(dist, `.${url}`)),
        );
      expect(missing).toEqual([]);
    });
  });
});
