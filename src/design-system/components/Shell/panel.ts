import { restorePanelView, savePanelView, type PanelView } from './panel.logic';

/**
 * 마지막 패널 화면의 저장 바인딩. `sessionStorage`의 `panel` 키에 `{ v: 1, view }`를 두어 같은 브라우저 세션
 * 동안 남긴다(ADR 0004). 저장소를 쓸 수 없으면 안내 없이 이 모듈의 메모리에만 둔다.
 */

const STORAGE_KEY = 'panel';

let memory: PanelView | null = null;

/** 저장해 둔 마지막 패널 화면. 없거나 버릴 값이면 `null`. 서버에서는 늘 `null`이다. */
export function readPanelView(): PanelView | null {
  if (typeof sessionStorage === 'undefined') return memory;
  try {
    return restorePanelView(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')) ?? memory;
  } catch {
    return memory;
  }
}

/** 지금 패널 화면을 저장한다. 열림·닫힘은 저장하지 않는다. */
export function writePanelView(view: PanelView): void {
  memory = view;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(savePanelView(view)));
  } catch {
    // 저장소를 쓸 수 없으면 메모리에만 둔다.
  }
}
