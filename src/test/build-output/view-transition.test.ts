import { describe, expect, it } from 'vitest';
import { built, pages } from './dist';

describe.skipIf(!built)('build output', () => {
  it('names the <html> view transition root on every page, for the theme spread', () => {
    // Astro는 `<html>`에 범위 속성을 붙이고, 그 범위의 이름을 `<head>`의 `<style>`에 적는다.
    const unnamed = pages.filter(({ html }) => {
      const scope = /<html\b[^>]*\bdata-astro-transition-scope="([^"]+)"/.exec(html)?.[1];
      return (
        !scope ||
        !html.includes(`[data-astro-transition-scope="${scope}"] { view-transition-name: root; }`)
      );
    });
    expect(unnamed.map(({ path }) => path)).toEqual([]);
  });
});
