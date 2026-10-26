import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveInitialTheme } from '@/design-system/stores/theme.logic';

/**
 * `pnpm build`가 만든 `dist/`를 바깥에서 검사한다. `dist/`가 없으면 건너뛴다(CI는 build 뒤 test).
 */
const dist = resolve(import.meta.dirname, '../../dist');
const built = existsSync(dist);

function files(extension: string): string[] {
  if (!built) return [];
  return readdirSync(dist, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith(extension))
    .map((file) => resolve(dist, file));
}

const pages = files('.html').map((path) => ({ path, html: readFileSync(path, 'utf8') }));
const styles = files('.css').map((path) => ({ path, css: readFileSync(path, 'utf8') }));

/** `<head>` 안에서 `data-theme`를 정하는 인라인 스크립트 본문. */
function themeScript(html: string): string | undefined {
  const head = /<head>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? '';
  return [...head.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map(([, body]) => body)
    .find((body) => body.includes('data-theme'));
}

/** dist 안 경로 → 그 페이지의 URL: `index.html` → `/`, `a/index.html` → `/a/`, `404.html` → `/404` */
function urlOf(path: string): string {
  const relative = path
    .slice(dist.length + 1)
    .split(sep)
    .join('/');
  return relative.endsWith('index.html')
    ? `/${relative.slice(0, -'index.html'.length)}`
    : `/${relative.slice(0, -'.html'.length)}`;
}

/** 에디터 루트(`<main>`)의 `data-file-url`. */
function fileUrl(html: string): string | undefined {
  return /<main[^>]*\bdata-file-url="([^"]*)"/.exec(html)?.[1];
}

interface Environment {
  stored?: string | null;
  storageThrows?: boolean;
  prefersLight?: boolean;
}

/** 스크립트를 브라우저 대역(localStorage·matchMedia·documentElement) 위에서 실행한다. */
function runThemeScript(script: string, env: Environment) {
  const attributes = new Map<string, string>();
  const listeners = new Map<string, (event: unknown) => void>();
  const localStorage = {
    getItem(name: string) {
      if (env.storageThrows) throw new Error('SecurityError');
      return name === 'theme' ? (env.stored ?? null) : null;
    },
  };
  const window: Record<string, unknown> = {
    localStorage,
    matchMedia: (query: string) => ({
      matches: query.includes('light') ? Boolean(env.prefersLight) : !env.prefersLight,
    }),
  };
  const document = {
    documentElement: {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      getAttribute: (name: string) => attributes.get(name) ?? null,
    },
    addEventListener: (type: string, listener: (event: unknown) => void) =>
      listeners.set(type, listener),
  };
  new Function('window', 'document', 'localStorage', 'matchMedia', script)(
    window,
    document,
    localStorage,
    window.matchMedia,
  );
  return { theme: attributes.get('data-theme'), listeners };
}

describe.skipIf(!built)('build output', () => {
  it.each([
    'blog/pro-developer-2023-days/index.html',
    'blog/index.html',
    'blog/tags/index.html',
    'blog/tags/회고/index.html',
    '404.html',
  ])('has %s', (file) => {
    expect(existsSync(resolve(dist, file))).toBe(true);
  });

  it('puts the theme script in the head of every page', () => {
    expect(pages.length).toBeGreaterThan(0);
    expect(pages.filter(({ html }) => !themeScript(html)).map(({ path }) => path)).toEqual([]);
    expect(new Set(pages.map(({ html }) => themeScript(html))).size).toBe(1);
  });

  describe('theme script', () => {
    const script = themeScript(pages[0]?.html ?? '') ?? '';
    const cases = [null, 'dark', 'light', 'sepia'].flatMap((stored) =>
      [true, false].flatMap((prefersLight) =>
        [false, true].map((storageThrows) => ({ stored, prefersLight, storageThrows })),
      ),
    );

    // 인라인 스크립트와 테마 스토어의 순수 로직이 같은 규칙(저장값 → 시스템 설정 → 어두운 테마)인지 맞대어 본다.
    it.each(cases)('agrees with resolveInitialTheme for %o', (env) => {
      const expected = resolveInitialTheme({
        stored: env.storageThrows ? null : env.stored,
        prefersLight: env.prefersLight,
      });
      expect(runThemeScript(script, env).theme).toBe(expected);
    });

    // <ClientRouter />는 화면을 옮길 때 <html> 속성을 새 문서 것으로 바꾸므로, 바꾸기 직전에 지금 테마를 옮겨 붙인다.
    it('carries the current theme onto the next page before a client-side swap', () => {
      const { listeners } = runThemeScript(script, { stored: 'light' });
      const next = new Map<string, string>();
      listeners.get('astro:before-swap')?.({
        newDocument: {
          documentElement: { setAttribute: (n: string, v: string) => next.set(n, v) },
        },
      });
      expect(next.get('data-theme')).toBe('light');
    });
  });

  describe('page ↔ shell contract', () => {
    it('gives every page an editor root whose data-file-url is its own URL', () => {
      const mismatched = pages
        .map(({ path, html }) => ({ expected: urlOf(path), actual: fileUrl(html) }))
        .filter(({ expected, actual }) => actual !== expected);
      expect(mismatched).toEqual([]);
    });

    it('keeps the post URLs: every post source has /blog/<slug>/', () => {
      const slugs = readdirSync(resolve(import.meta.dirname, '../content/blog'))
        .filter((name) => name.endsWith('.mdx'))
        .map((name) => name.slice(0, -'.mdx'.length));
      expect(slugs.length).toBeGreaterThan(0);
      const missing = slugs.filter(
        (slug) => !existsSync(resolve(dist, 'blog', slug, 'index.html')),
      );
      expect(missing).toEqual([]);
    });
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

  it('has no dark class or Google Fonts in any page', () => {
    // `dark:hidden` 같은 변형 유틸리티는 허용하고, 단독 `dark` 클래스만 막는다.
    const darkClass = /class="(?:[^"]*\s)?dark(?:\s[^"]*)?"/;
    const offending = pages.filter(
      ({ html }) => darkClass.test(html) || html.includes('fonts.googleapis.com'),
    );
    expect(offending.map(({ path }) => path)).toEqual([]);
  });

  it('has no .dark selector or old token names in any stylesheet', () => {
    const old =
      /\.dark(?![\w\\-])|--color-primary\b|--color-bg\b|--radius-card\b|--font-logo\b|--muted-foreground\b/;
    expect(styles.length).toBeGreaterThan(0);
    expect(styles.filter(({ css }) => old.test(css)).map(({ path }) => path)).toEqual([]);
  });

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
