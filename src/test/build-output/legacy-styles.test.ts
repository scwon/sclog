import { describe, expect, it } from 'vitest';
import { built, pages, styles } from './dist';

describe.skipIf(!built)('build output', () => {
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
