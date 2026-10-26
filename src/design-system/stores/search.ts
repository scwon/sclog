import { atom } from 'nanostores';

/**
 * 검색 화면의 메모리 상태. 창 틀 번들에 함께 실리는 작은 스토어이고, 검색 화면 코드(`SearchView`)는 처음 열 때
 * 따로 불러온다. 검색어는 저장하지 않는다. 화면 이동 사이에는 남고 새로고침하면 비워진다.
 */

/** 검색 화면 입력창의 글자. */
export const $searchQuery = atom('');

/** 검색 화면 입력창에 포커스를 달라는 요청. 검색 화면이 그려지면(처음 불러온 뒤 포함) 포커스를 주고 내린다. */
export const $searchFocus = atom(false);

/** 검색어를 바꾼다. */
export function setSearchQuery(query: string): void {
  $searchQuery.set(query);
}

/** 검색 화면 입력창에 포커스를 요청한다. 패널을 검색 화면으로 여는 일은 창 틀(`Shell`)이 맡는다. */
export function requestSearchFocus(): void {
  $searchFocus.set(true);
}
