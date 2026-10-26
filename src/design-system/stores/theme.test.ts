import { describe, expect, it } from 'vitest';
import {
  nextTheme,
  parseTheme,
  resolveInitialTheme,
  spreadCircle,
  switchesInstantly,
  themeOnSystemChange,
} from './theme.logic';

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

describe('spreadCircle', () => {
  const viewport = { width: 1000, height: 800 };

  it('starts at the center of the button', () => {
    const { x, y } = spreadCircle({ left: 940, top: 4, width: 30, height: 30 }, viewport);
    expect([x, y]).toEqual([955, 19]);
  });

  it('reaches the farthest corner of the screen', () => {
    // 오른쪽 위 버튼(955, 19)에서 가장 먼 모서리는 왼쪽 아래(0, 800).
    expect(spreadCircle({ left: 940, top: 4, width: 30, height: 30 }, viewport).radius).toBeCloseTo(
      Math.hypot(955, 781),
    );
    // 왼쪽 아래 버튼(20, 780)에서 가장 먼 모서리는 오른쪽 위(1000, 0).
    expect(
      spreadCircle({ left: 10, top: 770, width: 20, height: 20 }, viewport).radius,
    ).toBeCloseTo(Math.hypot(980, 780));
  });

  it('covers the whole screen from its center', () => {
    const tall = { width: 600, height: 800 };
    expect(spreadCircle({ left: 290, top: 390, width: 20, height: 20 }, tall).radius).toBe(500);
  });
});

describe('switchesInstantly', () => {
  const calm = { navigating: false, reducedMotion: false, supported: true };

  it('spreads when nothing stands in the way', () => {
    expect(switchesInstantly(calm)).toBe(false);
  });

  it('switches instantly while the router is moving to another screen', () => {
    expect(switchesInstantly({ ...calm, navigating: true })).toBe(true);
  });

  it('switches instantly when the reader prefers reduced motion', () => {
    expect(switchesInstantly({ ...calm, reducedMotion: true })).toBe(true);
  });

  it('switches instantly when the browser has no View Transitions', () => {
    expect(switchesInstantly({ ...calm, supported: false })).toBe(true);
  });
});
