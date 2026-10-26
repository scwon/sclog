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
  });
});
