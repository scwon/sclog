import { describe, expect, it } from 'vitest';
import { nextTheme, parseTheme, resolveInitialTheme, themeOnSystemChange } from './theme.logic';

describe('resolveInitialTheme', () => {
  it('uses a valid stored theme first', () => {
    expect(resolveInitialTheme({ stored: 'light', prefersLight: false })).toBe('light');
    expect(resolveInitialTheme({ stored: 'dark', prefersLight: true })).toBe('dark');
  });

  it('follows the system setting when nothing valid is stored', () => {
    expect(resolveInitialTheme({ stored: null, prefersLight: true })).toBe('light');
    expect(resolveInitialTheme({ stored: 'sepia', prefersLight: true })).toBe('light');
  });

  it('falls back to the dark theme', () => {
    expect(resolveInitialTheme({ stored: null, prefersLight: false })).toBe('dark');
  });
});

describe('parseTheme', () => {
  it('accepts only dark and light', () => {
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('Light')).toBeNull();
    expect(parseTheme(undefined)).toBeNull();
  });
});

describe('nextTheme', () => {
  it('toggles between the two themes', () => {
    expect(nextTheme('dark')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
  });
});

describe('themeOnSystemChange', () => {
  it('follows the new system setting when nothing valid is stored', () => {
    expect(themeOnSystemChange({ stored: null, prefersLight: true })).toBe('light');
    expect(themeOnSystemChange({ stored: 'sepia', prefersLight: false })).toBe('dark');
  });

  it('keeps the stored choice', () => {
    expect(themeOnSystemChange({ stored: 'dark', prefersLight: true })).toBeNull();
    expect(themeOnSystemChange({ stored: 'light', prefersLight: false })).toBeNull();
  });
});
