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

/** 현재 장(번호·제목)과 절. */
export interface ReadingPlace {
  chapter: { id: string; no: string; text: string } | null;
  section: { id: string; text: string } | null;
}

/** 장 번호. 01부터 두 자리. */
export function chapterNo(index: number): string {
  return String(index + 1).padStart(2, '0');
}

/** 현재 위치를 `04 개발자란? › 3~4년차`처럼 적는다. 첫 장 전이면 빈 문자열. */
export function readingSymbol({ chapter, section }: ReadingPlace): string {
  if (!chapter) return '';
  const head = `${chapter.no} ${chapter.text}`;
  return section ? `${head} › ${section.text}` : head;
}

/**
 * 지나온 제목들(`passed`, 문서 순서의 id)로 현재 장·절을 정한다. 장·절의 구분은 개요(`outline`)를 따르므로
 * 글의 최상위 제목 단계가 무엇이든 같게 동작한다. 개요에 없는 id는 건너뛴다.
 */
export function locateInOutline(
  outline: { id: string; text: string; children: { id: string; text: string }[] }[],
  passed: string[],
): ReadingPlace {
  const place: ReadingPlace = { chapter: null, section: null };
  for (const id of passed) {
    const index = outline.findIndex((chapter) => chapter.id === id);
    if (index !== -1) {
      place.chapter = { id, no: chapterNo(index), text: outline[index].text };
      place.section = null;
      continue;
    }
    const owner = outline.findIndex((chapter) => chapter.children.some((child) => child.id === id));
    const section = outline[owner]?.children.find((child) => child.id === id);
    if (section) {
      place.chapter = { id: outline[owner].id, no: chapterNo(owner), text: outline[owner].text };
      place.section = { id, text: section.text };
    }
  }
  return place;
}
