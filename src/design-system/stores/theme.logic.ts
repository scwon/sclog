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
