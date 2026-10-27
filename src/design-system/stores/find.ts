import { atom } from 'nanostores';

/**
 * 찾기 줄(⌘F)의 메모리 상태. 창 틀 번들에 함께 실리는 작은 스토어이고, 찾기 줄 코드(`FindWidget`)는 처음 열 때
 * 따로 불러온다. 검색어는 저장하지 않는다(ADR 0004의 "저장하지 않는 것"). 찾기 줄을 닫거나 화면을 옮겨도 남고
 * 새로고침하면 비워진다. 값은 아래 함수로만 바꾸고, 구독하는 쪽은 `useStore`로 읽는다.
 */

/** 찾기 줄 입력창의 글자. 다음에 찾기 줄을 열면 이 글자가 들어 있다. */
export const $findQuery = atom('');

/** 찾기 줄의 검색어를 바꾼다. */
export function setFindQuery(query: string): void {
  $findQuery.set(query);
}
