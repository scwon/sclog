import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type Declarations = Map<string, string>;

const dir = import.meta.dirname;
const read = (file: string) => readFileSync(resolve(dir, file), 'utf8');

/** 토큰 파일은 중첩 없는 `선택자 { 선언 }` 블록만 가진다. 선택자별 커스텀 프로퍼티를 모은다. */
function parseBlocks(css: string): Map<string, Declarations> {
  const blocks = new Map<string, Declarations>();
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, selector, body] of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const declarations: Declarations = new Map();
    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      declarations.set(name, value.trim());
    }
    blocks.set(selector.trim().replace(/\s+/g, ' '), declarations);
  }
  return blocks;
}

const primitives = parseBlocks(read('primitives.css')).get(':root') ?? new Map();
const semantic = parseBlocks(read('semantic.css'));
const dark = semantic.get(":root, [data-theme='dark']") ?? new Map();
const light = semantic.get("[data-theme='light']") ?? new Map();
const shared = semantic.get(':root') ?? new Map();
const themes = { dark, light };
const theme = /@theme inline\s*\{([^}]*)\}/.exec(read('../styles/index.css'))?.[1] ?? '';

describe('semantic tokens', () => {
  it('define both themes and the theme-independent tokens', () => {
    expect(dark.size).toBeGreaterThan(0);
    expect(light.size).toBeGreaterThan(0);
    expect(shared.size).toBeGreaterThan(0);
  });

  it('are not redefined by a theme when theme-independent', () => {
    expect([...shared.keys()].filter((name) => dark.has(name) || light.has(name))).toEqual([]);
  });

  it('are all exposed as Tailwind colors through @theme inline', () => {
    const exposed = new Set(
      [...theme.matchAll(/--color-([\w-]+):\s*var\(--([\w-]+)\)/g)]
        .filter(([, utility, token]) => utility === token)
        .map(([, , token]) => `--${token}`),
    );
    expect([...dark.keys()].filter((name) => !exposed.has(name))).toEqual([]);
  });

  it('use the same token names in both themes', () => {
    expect([...light.keys()].toSorted()).toEqual([...dark.keys()].toSorted());
  });

  it.each(Object.entries({ ...themes, shared }))(
    'only reference primitive tokens (%s)',
    (_, tokens) => {
      const invalid = [...tokens].filter(([, value]) => {
        const reference = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
        return !reference || !primitives.has(reference);
      });
      expect(invalid).toEqual([]);
    },
  );
});

describe('motion tokens', () => {
  it('give the cursor blink one 1100ms cycle through --motion-blink', () => {
    const reference = /^var\((--[\w-]+)\)$/.exec(shared.get('--motion-blink') ?? '')?.[1] ?? '';
    expect(primitives.get(reference)).toBe('1100ms');
  });
});

describe('@theme inline', () => {
  it('only exposes semantic tokens, never primitives', () => {
    const references = [...theme.matchAll(/var\((--[\w-]+)\)/g)].map(([, name]) => name);
    expect(references.length).toBeGreaterThan(0);
    expect(references.filter((name) => !dark.has(name) && !shared.has(name))).toEqual([]);
  });
});

/** WCAG 2.x 상대 휘도. 불투명 `#rrggbb`만 받는다. */
function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`opaque hex color expected: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(match[1].slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].toSorted((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** 의미 토큰 → 원시 토큰 → 값. */
function resolveColor(tokens: Declarations, name: string): string {
  const reference = /^var\((--[\w-]+)\)$/.exec(tokens.get(name) ?? '')?.[1] ?? '';
  return primitives.get(reference) ?? '';
}

const BODY = 4.5;
const SUPPORTING = 3;
const surfaces = ['--surface', '--surface-panel', '--surface-raised'];
const pairs: [foreground: string, background: string, minimum: number][] = [
  ...['--text', '--text-soft', '--prose'].flatMap((fg) =>
    surfaces.map((bg): [string, string, number] => [fg, bg, BODY]),
  ),
  ...surfaces.map((bg): [string, string, number] => ['--text-muted', bg, SUPPORTING]),
  ['--on-accent', '--accent', BODY],
  ['--accent-text', '--surface', BODY],
];

/** 반투명 `rgb(r g b / a)`를 불투명 바탕(`#rrggbb`) 위에 겹친 색. */
function over(layer: string, base: string): string {
  const match = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(layer);
  if (!match) throw new Error(`translucent rgb() expected: ${layer}`);
  const alpha = Number(match[4]);
  const hex = [1, 2, 3].map((i) => {
    const below = parseInt(base.slice(2 * i - 1, 2 * i + 1), 16);
    const value = Math.round(Number(match[i]) * alpha + below * (1 - alpha));
    return value.toString(16).padStart(2, '0');
  });
  return `#${hex.join('')}`;
}

/**
 * 고른 줄(`--state-selected` 바탕: 탐색기의 지금 파일, 개요의 지금 장, 팔레트의 고른 줄) 위의 글자. 강조 글자
 * (`--accent-text`)는 밝은 테마에서 이 바탕 위 명암비가 모자라, 고른 줄에서는 이 글자들만 쓴다.
 */
const selectedPairs: [foreground: string, background: string][] = ['--text', '--text-soft'].flatMap(
  (fg) => ['--surface-panel', '--surface-raised'].map((bg): [string, string] => [fg, bg]),
);

/**
 * 찾기 줄(⌘F)의 칠하기(`ide.css`의 `::highlight(name)`)가 쓰는 글자색·바탕 토큰. 칠한 글자는 본문 글자색(강조·코드
 * 색·흐린 글자)과 상관없이 늘 이 글자색이어야 하므로 규칙에서 바로 읽는다.
 */
function highlightTokens(name: string): { color: string | null; background: string | null } {
  const body =
    new RegExp(String.raw`::highlight\(${name}\)\s*\{([^}]*)\}`).exec(
      read('../styles/ide.css'),
    )?.[1] ?? '';
  const token = (property: string) =>
    new RegExp(String.raw`(?:^|[\s;])${property}\s*:\s*var\((--[\w-]+)\)`).exec(body)?.[1] ?? null;
  return { color: token('color'), background: token('background-color') };
}
const findMatch = highlightTokens('find-match');
const findCurrent = highlightTokens('find-current');

describe('contrast', () => {
  it('matches known WCAG ratios', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });

  describe.each(Object.entries(themes))('%s theme', (_, tokens) => {
    it.each(pairs)('%s on %s is at least %d:1', (fg, bg, minimum) => {
      expect(contrast(resolveColor(tokens, fg), resolveColor(tokens, bg))).toBeGreaterThanOrEqual(
        minimum,
      );
    });

    // 모든 일치(`find-match`)는 에디터 바탕(`--surface`) 위에 겹친 반투명 형광 띠다.
    it('find-match: its own text color on its band over --surface is at least 4.5:1', () => {
      expect(findMatch).toEqual({ color: expect.any(String), background: expect.any(String) });
      const { color, background } = findMatch;
      const marked = over(
        resolveColor(tokens, background ?? ''),
        resolveColor(tokens, '--surface'),
      );
      expect(contrast(resolveColor(tokens, color ?? ''), marked)).toBeGreaterThanOrEqual(BODY);
    });

    it('find-current: its text color on its background is at least 4.5:1', () => {
      expect(findCurrent).toEqual({ color: expect.any(String), background: expect.any(String) });
      const { color, background } = findCurrent;
      expect(
        contrast(resolveColor(tokens, color ?? ''), resolveColor(tokens, background ?? '')),
      ).toBeGreaterThanOrEqual(BODY);
    });

    // 선택 툴바의 상자(바탕 `--state-current`) 안에서 고른 본문 글자는 그 위에 선택색(`--marker`)이 한 겹 더 깔린다.
    it('selection toolbar box: --prose on --marker over --state-current over --surface is at least 4.5:1', () => {
      const box = over(resolveColor(tokens, '--state-current'), resolveColor(tokens, '--surface'));
      const selected = over(resolveColor(tokens, '--marker'), box);
      expect(contrast(resolveColor(tokens, '--prose'), selected)).toBeGreaterThanOrEqual(BODY);
    });

    it.each(selectedPairs)('%s on --state-selected over %s is at least 4.5:1', (fg, bg) => {
      const selected = over(resolveColor(tokens, '--state-selected'), resolveColor(tokens, bg));
      expect(contrast(resolveColor(tokens, fg), selected)).toBeGreaterThanOrEqual(BODY);
    });
  });
});
