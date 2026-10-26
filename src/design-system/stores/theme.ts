import { atom, onMount } from 'nanostores';
import {
  DEFAULT_THEME,
  nextTheme,
  parseTheme,
  themeOnSystemChange,
  type Theme,
} from './theme.logic';

/**
 * 테마 스토어의 DOM·storage 바인딩. 테마의 원본은 `<html data-theme>`이고(ADR 0002), 스토어는 그 거울이다.
 * 첫 값은 레이아웃 `<head>` 인라인 스크립트가 붙여 둔 속성에서 읽고(저장값 → 시스템 설정 → 어두운 테마),
 * 그 뒤로는 누가 바꾸든(이 스토어, Storybook 툴바, 화면 이동) 속성 변화를 따라간다.
 */

const STORAGE_KEY = 'theme';
const SYSTEM_LIGHT = '(prefers-color-scheme: light)';

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** 속성이 없거나 모르는 값이면 CSS와 같이 어두운 테마로 본다. 서버에서는 어두운 테마. */
function readAttribute(): Theme {
  if (typeof document === 'undefined') return DEFAULT_THEME;
  return parseTheme(document.documentElement.dataset.theme) ?? DEFAULT_THEME;
}

/** 현재 테마. 컴포넌트는 `useStore($theme)`로 구독한다. */
export const $theme = atom<Theme>(readAttribute());

/**
 * 다음 두 프레임 동안 전환 효과를 끈다(base.css의 `[data-theme-switching]` 규칙).
 * 테마를 바꾸는 쪽이 부르면 호버 전환이 옛 테마 색을 거쳐 번지지 않고 모든 색이 한 번에 바뀐다.
 */
export function suppressThemeTransitions(): void {
  const root = document.documentElement;
  root.dataset.themeSwitching = '';
  requestAnimationFrame(() => requestAnimationFrame(() => delete root.dataset.themeSwitching));
}

/** 저장하지 않고 속성만 바꾼다. */
function applyTheme(theme: Theme): void {
  suppressThemeTransitions();
  document.documentElement.dataset.theme = theme;
  $theme.set(theme);
}

/** 테마를 바꾸고 선택을 저장한다. 저장한 뒤로는 시스템 설정 변경을 따르지 않는다. */
export function setTheme(theme: Theme): void {
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // 저장소를 쓸 수 없으면 이번 페이지에서만 바뀐다.
  }
}

/** 지금 테마의 반대로 바꾸고 저장한다. */
export function toggleTheme(): void {
  setTheme(nextTheme($theme.get()));
}

/** 시스템 설정이 바뀌면 따른다. 저장한 선택이 있으면 따르지 않는다. */
function followSystem(event: MediaQueryListEvent): void {
  const next = themeOnSystemChange({ stored: readStored(), prefersLight: event.matches });
  if (next) applyTheme(next);
}

/** 스토어를 `data-theme` 속성에 맞춘다. */
function syncFromAttribute(): void {
  $theme.set(readAttribute());
}

// 구독자가 생기면 `data-theme` 변화와 시스템 설정 변경을 듣는다. nanostores는 서버 렌더링 중 `get()`에도
// 잠깐 마운트하므로, DOM이 없으면 아무것도 하지 않는다.
onMount($theme, () => {
  if (typeof document === 'undefined') return;
  syncFromAttribute();
  const observer = new MutationObserver(syncFromAttribute);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const query = window.matchMedia(SYSTEM_LIGHT);
  query.addEventListener('change', followSystem);
  return () => {
    observer.disconnect();
    query.removeEventListener('change', followSystem);
  };
});
