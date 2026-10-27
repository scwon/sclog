import { atom } from 'nanostores';

/**
 * 본문 선택 툴바가 떠 있는가(그리기를 요청했고 아직 걷지 않았다. 툴바 청크를 불러오는 중에도 참이다). 선택 툴바의
 * 감시(`components/SelectionToolbar/selection.ts`)만 바꾸고, 창 틀의 단축키 바인딩이 키를 받을 때 읽어 Esc가 맨 먼저
 * 닫을 층인지, Tab을 툴바로 보낼지 정한다. 저장하지 않는다.
 */
export const $selectionToolbarOpen = atom(false);
