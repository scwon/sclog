import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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

interface Environment {
  stored?: string | null;
  storageThrows?: boolean;
  prefersLight?: boolean;
}

/** 스크립트를 브라우저 대역(localStorage·matchMedia·documentElement) 위에서 실행하고 붙은 테마를 돌려준다. */
function runThemeScript(script: string, env: Environment): string | undefined {
  const attributes = new Map<string, string>();
  const localStorage = {
    getItem(key: string) {
      if (env.storageThrows) throw new Error('SecurityError');
      return key === 'theme' ? (env.stored ?? null) : null;
    },
  };
  const window = {
    localStorage,
    matchMedia: (query: string) => ({
      matches: query.includes('light') ? Boolean(env.prefersLight) : !env.prefersLight,
    }),
  };
  const document = {
    documentElement: {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      dataset: new Proxy({} as Record<string, string>, {
        set: (_, key, value) => (attributes.set(`data-${String(key)}`, String(value)), true),
      }),
    },
  };
  new Function('window', 'document', 'localStorage', 'matchMedia', script)(
    window,
    document,
    localStorage,
    window.matchMedia,
  );
  return attributes.get('data-theme');
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

    it('uses the stored theme first', () => {
      expect(runThemeScript(script, { stored: 'light', prefersLight: false })).toBe('light');
      expect(runThemeScript(script, { stored: 'dark', prefersLight: true })).toBe('dark');
    });

    it('follows the system setting when nothing valid is stored', () => {
      expect(runThemeScript(script, { prefersLight: true })).toBe('light');
      expect(runThemeScript(script, { stored: 'sepia', prefersLight: true })).toBe('light');
      expect(runThemeScript(script, { storageThrows: true, prefersLight: true })).toBe('light');
    });

    it('falls back to the dark theme', () => {
      expect(runThemeScript(script, {})).toBe('dark');
      expect(runThemeScript(script, { storageThrows: true })).toBe('dark');
    });
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
});
