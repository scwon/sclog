import { markText, type ReadingMark } from '@/design-system';

/**
 * 정적 HTML의 꼬리표 자리(흐름 로그 글 로그 줄 머리, 다음 파일 줄)에 읽음 꼬리표를 채운다. 페이지 스크립트가 HTML이
 * 그려진 뒤 부른다. 보이는 글자(`✓`·`42%`)는 스크린 리더에 숨기고 "읽음"·"42% 읽는 중"을 따로 둔다. 색은 2층
 * ide.css가 `data-mark`(`read`·`reading`)로 입힌다. 기록이 없으면(`null`) 자리를 비운다.
 */
export function fillReadingMark(
  slot: HTMLElement,
  mark: ReadingMark | null,
  form: 'short' | 'long',
): void {
  if (!mark) {
    delete slot.dataset.mark;
    slot.replaceChildren();
    return;
  }
  const { text, label } = markText(mark, form);
  const shown = document.createElement('span');
  shown.setAttribute('aria-hidden', 'true');
  shown.textContent = text;
  const spoken = document.createElement('span');
  spoken.className = 'sr-only';
  spoken.textContent = label;
  slot.dataset.mark = mark.kind;
  slot.replaceChildren(shown, spoken);
}
