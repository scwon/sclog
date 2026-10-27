import { atom } from 'nanostores';

/**
 * 본문 선택 툴바가 떠 있는가. 선택 툴바의 감시(`components/SelectionToolbar/selection.ts`)만 바꾸고, 창 틀은 Esc가
 * 맨 먼저 닫을 층인지 정하려고 읽는다. 저장하지 않는다.
 */
export const $selectionToolbarOpen = atom(false);
