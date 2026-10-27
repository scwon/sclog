import { atom } from 'nanostores';
import type { OutlineItem } from './file.logic';
import { $readingHistory, forgetReadingPosition } from './readingHistory';
import { resumeOffer, resumeReached, type Resume } from './resume.logic';

/**
 * 이어 읽기 스토어. 글 화면 스크립트가 글을 열 때(`openResume`)와 읽어 내려갈 때(`followResume`) 쓰고, 창 틀(`Shell`)이
 * 구독해 열기 요약이 끝난 뒤 상태줄 오른쪽에 버튼을 그린다. 버튼을 누르면 창 틀이 `dismissResume`을 부른다.
 * 다른 파일로 옮기면(`astro:after-swap`) 비우고, 그 글의 위치가 기록에서 사라지면(읽은 글이 됐거나 기록을 지웠으면)
 * 따라 비운다.
 */

/** 지금 권하는 이어 읽기. 없으면 `null`. */
export const $resume = atom<Resume | null>(null);

/**
 * 글이 열리면 이어 읽기를 권할지 정한다. 이 글의 읽는 위치를 기록하기 전에 불러야 지난번 위치를 본다. 저장된 장이
 * 개요에 없으면 그 위치를 기록에서 버린다.
 */
export function openResume(file: {
  url: string;
  outline: readonly OutlineItem[];
  hash: string;
}): void {
  const { resume, discard } = resumeOffer($readingHistory.get(), file);
  if (discard) forgetReadingPosition(file.url);
  $resume.set(resume);
}

/** 읽는 장(`chapter`, 첫 장 전이면 `null`)이 저장된 장이거나 그보다 뒤면 이어 읽기를 거둔다. */
export function followResume(outline: readonly OutlineItem[], chapter: string | null): void {
  const resume = $resume.get();
  if (resume && resumeReached(outline, resume.chapter.id, chapter)) $resume.set(null);
}

/** 이어 읽기를 거둔다. 버튼을 눌렀을 때 부른다. */
export function dismissResume(): void {
  $resume.set(null);
}

$readingHistory.listen((history) => {
  const resume = $resume.get();
  if (resume && !history.positions.some((position) => position.url === resume.url))
    $resume.set(null);
});

if (typeof document !== 'undefined') document.addEventListener('astro:after-swap', dismissResume);
