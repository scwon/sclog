import { atom } from 'nanostores';
import {
  emptyHistory,
  forgetPosition,
  keepPublished,
  record,
  restoreHistory,
  storedHistory,
  type ReadingHistory,
} from './readingHistory.logic';
import { visitorStorage } from './storage';

/**
 * 읽기 기록 스토어의 저장 바인딩. `localStorage`의 `read`·`position` 키에 두어 다음 방문까지 남긴다(ADR 0004).
 * 창 틀(탐색기·프로필)과 페이지 스크립트(흐름 로그·다음 파일 줄)가 같이 구독하고, 글 화면 스크립트가 읽는 위치를
 * 기록한다. 저장소에는 초당 한 번 이하로 묶어 쓰고, 화면을 떠날 때(`astro:before-swap`, `pagehide`) 마지막 값을
 * 쓴다. 저장소 접근은 `storage.ts`를 거치므로 저장소를 쓸 수 없으면 안내 없이 메모리에만 둔다. 불러오기는 처음 한 번이고 `storage` 이벤트는
 * 듣지 않는다.
 */

const READ_KEY = 'read';
const POSITION_KEY = 'position';
/** 저장소에 쓰는 최소 간격(ms). */
const WRITE_INTERVAL = 1000;

const storage = visitorStorage('local');

/** 이 브라우저의 읽기 기록. 컴포넌트는 `useStore($readingHistory)`로, 페이지 스크립트는 `subscribe`로 구독한다. */
export const $readingHistory = atom<ReadingHistory>(
  restoreHistory({ read: storage.read(READ_KEY), position: storage.read(POSITION_KEY) }),
);

let timer: ReturnType<typeof setTimeout> | null = null;
let dirty = false;

/** 기다리는 쓰기가 있으면 지금 쓴다. 화면을 떠날 때 부른다. */
export function flushReadingHistory(): void {
  if (timer !== null) clearTimeout(timer);
  timer = null;
  if (!dirty) return;
  dirty = false;
  const { read, position } = storedHistory($readingHistory.get());
  storage.write(READ_KEY, read);
  storage.write(POSITION_KEY, position);
}

function commit(next: ReadingHistory): void {
  if (next === $readingHistory.get()) return;
  $readingHistory.set(next);
  dirty = true;
  timer ??= setTimeout(flushReadingHistory, WRITE_INTERVAL);
}

/**
 * 글의 지금 읽는 위치를 기록한다. 90% 이상이면 읽은 글이 되고, 그 아래면 장(`chapter`, 첫 장 전이면 `null`)과
 * 비율을 마지막 읽은 위치로 남긴다.
 */
export function recordReading(url: string, chapter: string | null, percent: number): void {
  commit(record($readingHistory.get(), { url, chapter, percent }));
}

/** 발행된 글(탐색기 트리의 URL)에 없는 글의 기록을 버린다. 창 틀이 트리를 받았을 때 한 번 부른다. */
export function keepPublishedHistory(published: readonly string[]): void {
  commit(keepPublished($readingHistory.get(), published));
}

/** 글 하나의 마지막 읽은 위치를 버린다. 이어 읽기가 저장된 장을 지금 개요에서 찾지 못했을 때 부른다. */
export function forgetReadingPosition(url: string): void {
  commit(forgetPosition($readingHistory.get(), url));
}

/** 읽기 기록을 모두 지운다(`read`·`position` 두 키). 확인 창 없이 바로 지우고 모든 꼬리표가 사라진다. */
export function clearReadingHistory(): void {
  if (timer !== null) clearTimeout(timer);
  timer = null;
  dirty = false;
  $readingHistory.set(emptyHistory());
  storage.remove(READ_KEY);
  storage.remove(POSITION_KEY);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushReadingHistory);
  document.addEventListener('astro:before-swap', flushReadingHistory);
}
