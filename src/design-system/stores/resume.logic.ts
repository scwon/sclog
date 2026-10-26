/**
 * 이어 읽기의 순수 로직. 글을 열 때 상태줄에 이어 읽기 버튼을 띄울지, 읽어 내려가다 버튼을 거둘지 정한다.
 * DOM과 저장소는 모른다. 바인딩은 `resume.ts`가 맡는다.
 */
import type { OutlineItem } from './file.logic';
import { chapterNo } from './reading.logic';
import type { ReadingHistory } from './readingHistory.logic';

/** 상태줄에 권하는 이어 읽기. 글의 마지막 읽은 장과 그때의 읽은 비율이다. */
export interface Resume {
  /** 글 URL(`/blog/<slug>/`). */
  url: string;
  /** 저장된 장의 id·번호(`04`)·제목. 번호와 제목은 지금 개요에서 찾는다. */
  chapter: { id: string; no: string; text: string };
  /** 떠날 때 읽은 비율(0~89). */
  percent: number;
}

/** 글을 열 때의 판정. `discard`면 저장된 장이 개요에 없으므로 그 글의 위치를 기록에서 버린다. */
export interface ResumeDecision {
  resume: Resume | null;
  discard: boolean;
}

/**
 * 글을 열 때 이어 읽기를 권할지 정한다. 그 글의 위치가 있고, 읽은 글이 아니고, 저장된 장이 지금 개요의 장이고,
 * 주소에 해시가 없을 때만 권한다. 저장된 장이 개요에 없으면(글이 고쳐져 장이 사라졌으면) 해시와 상관없이 위치를
 * 버리라고 알린다. `hash`는 `location.hash` 그대로이며 `#`만 있으면 해시가 없는 것으로 본다.
 */
export function resumeOffer(
  history: ReadingHistory,
  { url, outline, hash }: { url: string; outline: readonly OutlineItem[]; hash: string },
): ResumeDecision {
  const position = history.positions.find((entry) => entry.url === url);
  if (!position || history.read.includes(url)) return { resume: null, discard: false };
  const index = outline.findIndex((chapter) => chapter.id === position.chapter);
  if (index === -1) return { resume: null, discard: true };
  if (hash.replace(/^#/, '') !== '') return { resume: null, discard: false };
  return {
    resume: {
      url,
      chapter: { id: position.chapter, no: chapterNo(index), text: outline[index].text },
      percent: position.percent,
    },
    discard: false,
  };
}

/**
 * 독자가 저장된 장(`saved`)까지 읽어 내려왔는가. 지금 장(`current`)이 저장된 장이거나 개요에서 그보다 뒤면 그렇다.
 * 첫 장 전(`null`)이거나 어느 쪽이든 개요에 없으면 아니다.
 */
export function resumeReached(
  outline: readonly OutlineItem[],
  saved: string,
  current: string | null,
): boolean {
  if (current === null) return false;
  const savedIndex = outline.findIndex((chapter) => chapter.id === saved);
  const currentIndex = outline.findIndex((chapter) => chapter.id === current);
  return savedIndex !== -1 && currentIndex !== -1 && currentIndex >= savedIndex;
}

/** 버튼 글자 `04 개발자란?에서 이어 읽기 · 42%`. 앞의 `↳`는 장식이라 화면이 따로 붙인다. */
export function resumeLabel({ chapter, percent }: Resume): string {
  return `${chapter.no} ${chapter.text}에서 이어 읽기 · ${percent}%`;
}
