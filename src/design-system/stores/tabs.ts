import { atom, map } from 'nanostores';
import {
  addOrActivate,
  close,
  restoreTabs,
  show,
  type TabEntry,
  type TabFile,
  type TabsState,
} from './tabs.logic';
import { visitorStorage } from './storage';

/**
 * 탭 스토어의 바인딩. 열린 탭은 nanostores `map`(키 = 글 URL, 넣은 순서 = 탭 순서)에, 활성 탭은
 * `atom`에 두고, 바뀔 때마다 `sessionStorage`에 거울처럼 저장해 같은 브라우저 세션 동안 남긴다(ADR 0001). 저장소를
 * 쓸 수 없으면 `storage.ts`가 메모리에 둔다.
 */

const STORAGE_KEY = 'tabs';

const storage = visitorStorage('session');

/** 탭 목록을 `$openTabs`의 모양(키 = 글 URL, 넣은 순서 = 탭 순서)으로 바꾼다. */
export function toTabRecord(files: TabEntry[]): Record<string, TabEntry> {
  return Object.fromEntries(files.map((file) => [file.url, file]));
}

const saved = restoreTabs(storage.read(STORAGE_KEY));

/** 열린 탭. 키는 글 URL이고 첫 키는 언제나 `posts.log`의 `/`다. */
export const $openTabs = map<Record<string, TabEntry>>(toTabRecord(saved.files));

/** 활성 탭의 URL. */
export const $activeTab = atom<string>(saved.active);

function current(): TabsState {
  return { files: Object.values($openTabs.get()), active: $activeTab.get() };
}

function commit(state: TabsState): void {
  $openTabs.set(toTabRecord(state.files));
  $activeTab.set(state.active);
  storage.write(STORAGE_KEY, state);
}

/** 파일을 탭으로 연다. 이미 열려 있으면 활성 탭으로만 바꾼다. */
export function openTab(file: TabFile): void {
  commit(addOrActivate(current(), file));
}

/**
 * 파일을 에디터에 보인다. 탭을 열고 "처음 보임" 표시를 붙여, 탭이 새로 생겨 처음 보이는 때면 `true`(펼침)를 돌려준다.
 * 창 틀이 같은 파일을 `openTab`으로 먼저 열었어도 표시는 여기서만 붙으므로 부르는 순서와 상관없다.
 */
export function showTab(file: TabFile): boolean {
  const { state, unfold } = show(current(), file);
  commit(state);
  return unfold;
}

/** 탭을 닫고, 닫은 뒤의 활성 탭 URL을 돌려준다. 활성 탭을 닫았다면 호출한 쪽이 그 URL로 이동한다. */
export function closeTab(url: string): string {
  const { state, next } = close(current(), url);
  commit(state);
  return next;
}
