import { useSyncExternalStore } from 'react';

/**
 * 스크립트가 보는 미디어 쿼리. CSS는 같은 조건을 `@media`로 직접 쓴다.
 */

/** 움직임 줄이기 설정. 켜져 있으면 스크립트가 움직임(열기 요약의 타이핑, 탭 등장, 펼침, 테마 퍼짐)을 건너뛴다. */
export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** 키 표기를 보일 수 있는 포인터(마우스·트랙패드). 터치 화면에서는 팔레트·찾기 줄에 키 표기를 넣지 않는다. */
export const FINE_POINTER = '(hover: hover) and (pointer: fine)';

/**
 * 마우스를 쓰는 화면인가(`FINE_POINTER`). 팔레트·찾기 줄처럼 브라우저에서만 그리는 컴포넌트가 쓰므로 서버 값(`true`)은
 * 쓰이지 않는다.
 */
export function useFinePointer(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(FINE_POINTER);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(FINE_POINTER).matches,
    () => true,
  );
}
