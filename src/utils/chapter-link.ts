/**
 * 장 주소(GLOSSARY)의 규칙. DOM을 모르는 순수 함수라 글 화면 스크립트와 테스트가 함께 쓴다.
 * 서버 전용 모듈(`ide.ts`의 `node:fs` 등)을 import하지 않는다. 브라우저 번들에 들어간다.
 */

/** 장 주소를 만들 때 쓰는 지금 주소의 두 부분. `window.location`을 그대로 넘겨도 된다. */
export interface PageLocation {
  origin: string;
  pathname: string;
}

/**
 * 복사할 장 주소 `{origin}{pathname}#{id}`. 해시는 제목 id(MDX가 만든 slug)를 퍼센트 인코딩하지 않은
 * 사람이 읽는 글자 그대로 붙인다.
 */
export function chapterLinkUrl(location: PageLocation, id: string): string {
  return `${location.origin}${location.pathname}#${id}`;
}

/** 복사한 뒤 상태줄 알림 문구. 클립보드에 넣지 못했으면 주소창의 해시만 바뀐 것을 알린다. */
export function chapterLinkNotice(id: string, copied: boolean): string {
  return copied ? `✓ 주소 복사됨 · #${id}` : '주소창에 넣었습니다';
}
