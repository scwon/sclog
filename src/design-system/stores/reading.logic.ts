/**
 * 읽기 진행의 순수 로직. 스크롤 값과 블록 위치로 읽은 비율과 현재 블록을 정한다. DOM은 모른다.
 */

/** 읽은 비율(0~100, 반올림). 맨 위 0%, 맨 아래 100%. 스크롤할 것이 없으면 다 읽은 것으로 본다. */
export function readingPercent({
  scrollTop,
  scrollHeight,
  clientHeight,
}: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}): number {
  const scrollable = scrollHeight - clientHeight;
  if (scrollable <= 0) return 100;
  return Math.round(Math.min(1, Math.max(0, scrollTop / scrollable)) * 100);
}

/**
 * 현재 블록의 인덱스: 위치(`tops`, 문서 순서)가 읽는 선(`line`)을 지난 마지막 블록.
 * 아직 아무 블록도 지나지 않았으면 첫 블록, 블록이 없으면 -1.
 */
export function currentBlock(tops: number[], line: number): number {
  if (tops.length === 0) return -1;
  let index = 0;
  for (const [position, top] of tops.entries()) if (top <= line) index = position;
  return index;
}
