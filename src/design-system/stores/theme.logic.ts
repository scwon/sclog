/**
 * 테마 스토어의 순수 로직. DOM·storage를 모르고, 현재 상태와 입력으로 다음 상태만 정한다.
 * 바인딩은 theme.ts가 맡는다.
 */

/** 테마 이름. */
export type Theme = 'dark' | 'light';

/** 기본 테마. `data-theme` 속성이 없을 때 CSS도 이 테마로 그린다(ADR 0002). */
export const DEFAULT_THEME: Theme = 'dark';

/** 저장값이나 `data-theme` 속성처럼 밖에서 온 값을 테마로 읽는다. 모르는 값은 `null`. */
export function parseTheme(value: unknown): Theme | null {
  return value === 'dark' || value === 'light' ? value : null;
}

/**
 * 처음 보여 줄 테마: 저장값 → 시스템 설정 → 어두운 테마.
 * 레이아웃 `<head>`의 인라인 스크립트도 같은 규칙을 따르고, 빌드 결과물 테스트가 둘을 맞대어 본다.
 */
export function resolveInitialTheme({
  stored,
  prefersLight,
}: {
  stored: string | null;
  prefersLight: boolean;
}): Theme {
  return parseTheme(stored) ?? (prefersLight ? 'light' : DEFAULT_THEME);
}

/** 테마 전환 버튼을 눌렀을 때의 다음 테마. */
export function nextTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}

/** 시스템 설정이 바뀌었을 때 옮겨 갈 테마. 저장한 선택이 있으면 따르지 않으므로 `null`. */
export function themeOnSystemChange({
  stored,
  prefersLight,
}: {
  stored: string | null;
  prefersLight: boolean;
}): Theme | null {
  return parseTheme(stored) === null ? resolveInitialTheme({ stored: null, prefersLight }) : null;
}

/** 화면 위 상자. `getBoundingClientRect()`의 값과 같은 모양이다. */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 테마 퍼짐의 원: 시작점(px)과 화면을 다 덮는 반지름(px). */
export interface SpreadCircle {
  x: number;
  y: number;
  radius: number;
}

/**
 * 테마 퍼짐의 원. 시작점은 테마 버튼의 가운데이고, 반지름은 시작점에서 가장 먼 화면 모서리까지의 거리라서
 * 원이 다 커지면 화면 전체가 새 테마가 된다.
 */
export function spreadCircle(
  button: Box,
  viewport: { width: number; height: number },
): SpreadCircle {
  const x = button.left + button.width / 2;
  const y = button.top + button.height / 2;
  const radius = Math.hypot(Math.max(x, viewport.width - x), Math.max(y, viewport.height - y));
  return { x, y, radius };
}

/**
 * 테마를 퍼짐 없이 바로 바꿀지. 라우터가 화면을 옮기는 중(`astro:before-preparation`부터 `astro:page-load`까지)이면
 * 두 View Transition이 서로를 끊으므로, 움직임 줄이기 설정이면 움직임을 두지 않으므로,
 * `document.startViewTransition`이 없으면 그릴 수 없으므로 바로 바꾼다.
 */
export function switchesInstantly({
  navigating,
  reducedMotion,
  supported,
}: {
  navigating: boolean;
  reducedMotion: boolean;
  supported: boolean;
}): boolean {
  return navigating || reducedMotion || !supported;
}
