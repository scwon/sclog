import { atom, onMount } from 'nanostores';
import { REDUCED_MOTION } from '../media';
import {
  DEFAULT_THEME,
  nextTheme,
  parseTheme,
  spreadCircle,
  switchesInstantly,
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

/** 테마 버튼(`ThemeToggle`)이 붙이는 표지. 테마 퍼짐의 시작점을 찾는다. */
const THEME_TOGGLE = '[data-theme-toggle]';
/** 테마 퍼짐 동안 `<html>`에 붙는 속성(motion.css가 이 속성으로 퍼짐 규칙을 켠다)과 원의 사용자 정의 속성. */
const SPREAD_ATTRIBUTE = 'themeSpread';
const SPREAD_PROPERTIES = ['--theme-spread-x', '--theme-spread-y', '--theme-spread-r'] as const;

// 라우터가 화면을 옮기는 중인가: 다음 화면을 준비하기 시작할 때부터 새 화면 준비가 끝날 때까지.
// 이 모듈은 창 틀 아일랜드와 함께 한 번만 실행되므로 리스너도 한 번만 붙는다.
let navigating = false;
if (typeof document !== 'undefined') {
  document.addEventListener('astro:before-preparation', () => {
    navigating = true;
  });
  document.addEventListener('astro:page-load', () => {
    navigating = false;
  });
}

/** 지금 진행 중인 테마 퍼짐. 새 퍼짐이 앞의 것을 건너뛰게 했을 때 앞의 정리가 새 퍼짐의 속성을 지우지 않게 한다. */
let spreading: ViewTransition | null = null;

/**
 * 지금 테마의 반대로 바꾸고 저장한다. 새 테마는 테마 버튼 가운데에서 원형으로 퍼진다(테마 퍼짐).
 * 테마 버튼과 명령 팔레트의 테마 전환 명령이 모두 이 함수를 부르고, 어디서 불러도 시작점은 테마 버튼이다.
 *
 * 퍼짐은 별도 `document.startViewTransition`으로 그리고, 모양·시간은 motion.css의 키프레임이 정한다.
 * 화면 이동 중, 움직임 줄이기 설정, View Transitions가 없는 브라우저, 테마 버튼이 없는 화면에서는 바로 바꾼다.
 */
export function toggleTheme(): void {
  const next = nextTheme($theme.get());
  const button = document.querySelector(THEME_TOGGLE);
  const instant = switchesInstantly({
    navigating,
    reducedMotion: window.matchMedia(REDUCED_MOTION).matches,
    supported: 'startViewTransition' in document,
  });
  if (!button || instant) {
    setTheme(next);
    return;
  }

  const root = document.documentElement;
  const { x, y, radius } = spreadCircle(button.getBoundingClientRect(), {
    width: window.innerWidth,
    height: window.innerHeight,
  });
  root.style.setProperty(SPREAD_PROPERTIES[0], `${x}px`);
  root.style.setProperty(SPREAD_PROPERTIES[1], `${y}px`);
  root.style.setProperty(SPREAD_PROPERTIES[2], `${radius}px`);
  root.dataset[SPREAD_ATTRIBUTE] = '';

  const transition = document.startViewTransition(() => setTheme(next));
  spreading = transition;
  // 다른 전환(라우터 이동, 다음 퍼짐)이 건너뛰게 하면 ready가 거부된다. 테마는 이미 바뀌었으니 무시한다.
  transition.ready.catch(() => {});
  const finish = () => {
    if (spreading !== transition) return;
    spreading = null;
    delete root.dataset[SPREAD_ATTRIBUTE];
    for (const name of SPREAD_PROPERTIES) root.style.removeProperty(name);
  };
  transition.finished.then(finish, finish);
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
