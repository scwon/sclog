import { describe, expect, it } from 'vitest';
import { resolveInitialTheme } from '@/design-system/stores/theme.logic';
import { built, pages } from './dist';

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
});
