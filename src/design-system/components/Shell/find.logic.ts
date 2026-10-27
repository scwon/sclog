/**
 * 찾기 줄(⌘F)의 규칙. DOM을 모르고, 에디터 글자를 블록(문단)마다 텍스트 노드 목록으로 받아 일치를 노드·오프셋 쌍으로
 * 돌려준다. 일치 규칙은 검색 화면과 같은 `match.logic.ts`의 `matchRanges`다(NFD 부분 일치, 대소문자 무시, 음절 넓히기).
 * 글자 모으기·칠하기·스크롤은 `FindWidget.tsx`가 맡는다.
 */
import { matchRanges } from './match.logic';

/** 블록 안의 텍스트 노드 하나와 그 글자. `T`는 DOM에서는 `Text`, 테스트에서는 대역이다. */
export interface FindNode<T> {
  node: T;
  text: string;
}

/** 블록 하나(문단·제목·목록 줄 등): 문서 순서의 텍스트 노드. 일치는 블록 경계를 넘지 않는다. */
export type FindBlock<T> = FindNode<T>[];

/** 일치의 한쪽 끝: 텍스트 노드와 그 안의 UTF-16 오프셋(`Range.setStart`에 그대로 넘긴다). */
export interface FindPoint<T> {
  node: T;
  offset: number;
}

/** 일치 하나. `end`는 그 글자 바로 뒤다. */
export interface FindMatch<T> {
  start: FindPoint<T>;
  end: FindPoint<T>;
}

/**
 * 블록마다 노드 글자를 이어 붙여 `query`를 찾고, 일치 범위를 노드·오프셋으로 되돌린다. 검색어는 앞뒤 공백만 지우고
 * 한 글자부터 찾는다. 시작은 그 글자가 든 노드에, 끝은 마지막 글자가 든 노드에 둔다(노드 경계에서 앞 노드의 끝이나
 * 다음 노드의 시작으로 밀리지 않는다).
 */
export function findInBlocks<T>(blocks: readonly FindBlock<T>[], query: string): FindMatch<T>[] {
  const needle = query.trim();
  if (!needle) return [];
  const matches: FindMatch<T>[] = [];
  for (const block of blocks) {
    const starts: number[] = [];
    let text = '';
    for (const { text: piece } of block) {
      starts.push(text.length);
      text += piece;
    }
    /** 블록 글자의 `at`번째 글자가 든 노드(`after`면 `at` 바로 앞 글자가 든 노드)의 점. */
    const point = (at: number, after: boolean): FindPoint<T> => {
      const index = block.findIndex(({ text: piece }, i) =>
        after
          ? starts[i] < at && at <= starts[i] + piece.length
          : starts[i] <= at && at < starts[i] + piece.length,
      );
      return { node: block[index].node, offset: at - starts[index] };
    };
    for (const [start, end] of matchRanges(text, needle)) {
      matches.push({ start: point(start, false), end: point(end, true) });
    }
  }
  return matches;
}

/**
 * 다음(`1`)·이전(`-1`) 일치의 번호. 끝에서 처음으로, 처음에서 끝으로 돈다. 일치가 없으면 `-1`이다.
 */
export function stepMatch(current: number, total: number, delta: -1 | 1): number {
  if (total <= 0) return -1;
  return (current + delta + total) % total;
}

/** 화면 위의 세로 자리(뷰포트 좌표). `DOMRect`를 그대로 넘긴다. */
export interface VerticalSpan {
  top: number;
  bottom: number;
}

/**
 * 검색어가 바뀌었을 때 지금 일치로 고를 번호: 보이는 영역의 위 끝(`viewTop`)에 걸치거나 그 아래에 있는 첫 일치다.
 * 모두 위에 있으면 처음 일치, 일치가 없으면 `-1`이다. `rects`는 문서 순서다.
 */
export function firstVisibleMatch(rects: readonly VerticalSpan[], viewTop: number): number {
  if (rects.length === 0) return -1;
  const index = rects.findIndex(({ bottom }) => bottom > viewTop);
  return index === -1 ? 0 : index;
}

/** 찾기 줄의 위치 글자. `3/12`, 일치가 없으면 `결과 없음`, 검색어가 비면 빈 글자다. `current`는 0부터 센다. */
export function findPosition(query: string, current: number, total: number): string {
  if (!query.trim()) return '';
  if (total === 0) return '결과 없음';
  return `${current + 1}/${total}`;
}

/**
 * 지금 일치를 보이려고 스크롤할 거리(px, 아래로 양수). 일치가 보이는 영역(`view`: 위쪽 막대 아래 ~ 아래 막대 위)
 * 안에 다 들어 있으면 0이고, 아니면 그 줄의 가운데가 보이는 영역 가운데에 오는 거리다.
 */
export function scrollToCenter(match: VerticalSpan, view: VerticalSpan): number {
  if (match.top >= view.top && match.bottom <= view.bottom) return 0;
  return (match.top + match.bottom) / 2 - (view.top + view.bottom) / 2;
}
