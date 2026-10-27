import { visitorStorage } from '../../stores/storage';
import { restorePanelView, savePanelView, type PanelView } from './panel.logic';

/**
 * 마지막 패널 화면의 저장 바인딩. `sessionStorage`의 `panel` 키에 `{ v: 1, view }`를 두어 같은 브라우저 세션
 * 동안 남긴다(ADR 0004). 저장소를 쓸 수 없으면 `storage.ts`가 안내 없이 메모리에 둔다.
 */

const STORAGE_KEY = 'panel';

const storage = visitorStorage('session');

/** 저장해 둔 마지막 패널 화면. 없거나 버릴 값이면 `null`. */
export function readPanelView(): PanelView | null {
  return restorePanelView(storage.read(STORAGE_KEY));
}

/** 지금 패널 화면을 저장한다. 열림·닫힘은 저장하지 않는다. */
export function writePanelView(view: PanelView): void {
  storage.write(STORAGE_KEY, savePanelView(view));
}
