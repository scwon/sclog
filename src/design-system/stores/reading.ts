import { map } from 'nanostores';

/**
 * 에디터의 읽기 위치. 에디터 쪽 스크립트(흐름 로그의 현재 줄, 글의 IntersectionObserver)가 쓰고
 * 창 틀(`Shell`)이 구독해 상태줄·경로·개요에 보인다. 파일을 열 때마다 처음 상태로 돌아간다.
 */
export interface ReadingState {
  /** 현재 줄 번호(상태줄 `Ln N`). 없으면 보이지 않는다. */
  line: number | null;
  /** 현재 장의 id·번호·제목. */
  chapter: { id: string; no: string; text: string } | null;
  /** 현재 절의 id·제목. */
  section: { id: string; text: string } | null;
  /** 읽은 비율(0~100). 글에만 있다. */
  percent: number | null;
}

/** 아무것도 읽지 않은 상태. 서버 렌더링 스냅샷으로도 쓴다. */
export function emptyReading(): ReadingState {
  return { line: null, chapter: null, section: null, percent: null };
}

/** 현재 읽기 위치. */
export const $reading = map<ReadingState>(emptyReading());

/** 읽기 위치의 일부를 바꾼다. 값이 같으면 구독자를 깨우지 않는다. */
export function setReading(next: Partial<ReadingState>): void {
  const current = $reading.get();
  const changed = (Object.keys(next) as (keyof ReadingState)[]).some(
    (name) => JSON.stringify(current[name]) !== JSON.stringify(next[name]),
  );
  if (changed) $reading.set({ ...current, ...next });
}

/** 새 파일을 열면 읽기 위치를 비운다. */
export function resetReading(): void {
  $reading.set(emptyReading());
}
