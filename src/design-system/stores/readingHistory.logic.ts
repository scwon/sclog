/**
 * 읽기 기록의 순수 로직. 읽은 글과 글마다 마지막으로 읽은 위치를 정하고, 저장값을 되살리고, 꼬리표 글자를 만든다.
 * DOM과 저장소는 모른다. 바인딩은 `readingHistory.ts`가 맡는다(ADR 0004).
 */

/** 읽은 글이 되는 읽은 비율(%). */
export const READ_PERCENT = 90;

/** 마지막 읽은 위치를 남기는 글 수. */
export const POSITION_LIMIT = 20;

/** 글 하나의 마지막 읽은 위치. 픽셀이 아니라 장 id와 읽은 비율이다. */
export interface ReadingPosition {
  /** 글 URL(`/blog/<slug>/`). */
  url: string;
  /** 지금 장의 id(개요의 장 id). */
  chapter: string;
  /** 읽은 비율(0~89). */
  percent: number;
}

/** 이 브라우저의 읽기 기록. */
export interface ReadingHistory {
  /** 읽은 글 URL. 읽은 순서. */
  read: string[];
  /** 읽는 중인 글의 마지막 위치. 최근에 갱신한 것이 먼저이고 최대 20편. */
  positions: ReadingPosition[];
}

/** 기록이 없는 상태. 서버 렌더링 스냅샷으로도 쓴다. */
export function emptyHistory(): ReadingHistory {
  return { read: [], positions: [] };
}

/**
 * 지금 읽는 위치를 기록에 반영한다. 90% 이상이면 읽은 글로 넣고 위치를 지운다. 90% 미만이면 장이 있을 때만
 * 위치를 갱신해 맨 앞으로 올리고, 20편을 넘으면 가장 오래 갱신하지 않은 것부터 버린다. 이미 읽은 글은 위치를 남기지
 * 않는다. 바뀐 것이 없으면 받은 객체를 그대로 돌려준다.
 */
export function record(
  history: ReadingHistory,
  { url, chapter, percent }: { url: string; chapter: string | null; percent: number },
): ReadingHistory {
  const isRead = history.read.includes(url);
  const others = history.positions.filter((position) => position.url !== url);
  if (percent >= READ_PERCENT) {
    if (isRead && others.length === history.positions.length) return history;
    return { read: isRead ? history.read : [...history.read, url], positions: others };
  }
  if (isRead || !chapter) return history;
  const [first] = history.positions;
  if (first?.url === url && first.chapter === chapter && first.percent === percent) return history;
  return {
    read: history.read,
    positions: [{ url, chapter, percent }, ...others].slice(0, POSITION_LIMIT),
  };
}

/** 글 하나의 마지막 읽은 위치를 버린다. 이어 읽기가 저장된 장이 개요에 없을 때 부른다. 없으면 받은 객체를 돌려준다. */
export function forgetPosition(history: ReadingHistory, url: string): ReadingHistory {
  const positions = history.positions.filter((position) => position.url !== url);
  return positions.length === history.positions.length
    ? history
    : { read: history.read, positions };
}

/** 글 하나의 꼬리표: 읽은 글이거나 읽는 중인 글(읽은 비율). */
export type ReadingMark = { kind: 'read' } | { kind: 'reading'; percent: number };

/** 글의 꼬리표. 기록이 없는 글이면 `null`. */
export function readingMark(history: ReadingHistory, url: string): ReadingMark | null {
  if (history.read.includes(url)) return { kind: 'read' };
  const position = history.positions.find((entry) => entry.url === url);
  return position ? { kind: 'reading', percent: position.percent } : null;
}

/**
 * 꼬리표 글자. `text`는 화면에 보이는 글자(스크린 리더에는 숨긴다), `label`은 스크린 리더가 읽는 글자다.
 * `short`는 탐색기·다음 파일 줄의 `✓`·`42%`, `long`은 흐름 로그의 `✓ 읽음`·`71% 읽는 중`이다.
 */
export function markText(
  mark: ReadingMark,
  form: 'short' | 'long',
): { text: string; label: string } {
  if (mark.kind === 'read') return { text: form === 'short' ? '✓' : '✓ 읽음', label: '읽음' };
  const label = `${mark.percent}% 읽는 중`;
  return { text: form === 'short' ? `${mark.percent}%` : label, label };
}

/** `N편 읽음 · M편 읽는 중`. 기록이 없으면 `null`. */
export function summarizeHistory(history: ReadingHistory): string | null {
  if (history.read.length === 0 && history.positions.length === 0) return null;
  return `${history.read.length}편 읽음 · ${history.positions.length}편 읽는 중`;
}

/** `localStorage`에 두는 모양. 키 `read`와 `position`의 값이다. */
export interface StoredHistory {
  read: { v: 1; urls: string[] };
  position: { v: 1; entries: ReadingPosition[] };
}

/** 기록을 저장할 모양으로 바꾼다. */
export function storedHistory(history: ReadingHistory): StoredHistory {
  return {
    read: { v: 1, urls: history.read },
    position: { v: 1, entries: history.positions },
  };
}

/** `{ v: 1, [field]: [...] }` 모양이면 그 배열, 아니면 빈 배열. */
function versionedList(value: unknown, field: string): unknown[] {
  if (typeof value !== 'object' || value === null) return [];
  const fields = value as Record<string, unknown>;
  const list = fields[field];
  return fields.v === 1 && Array.isArray(list) ? list : [];
}

function isPosition(value: unknown): value is ReadingPosition {
  if (typeof value !== 'object' || value === null) return false;
  const { url, chapter, percent } = value as Record<string, unknown>;
  return (
    typeof url === 'string' &&
    typeof chapter === 'string' &&
    chapter !== '' &&
    typeof percent === 'number' &&
    percent >= 0 &&
    percent < READ_PERCENT
  );
}

/** 발행된 글(`published`, 탐색기 트리의 URL)에 없는 글의 기록을 버린다. 버릴 것이 없으면 받은 객체를 돌려준다. */
export function keepPublished(
  history: ReadingHistory,
  published: readonly string[],
): ReadingHistory {
  const known = new Set(published);
  const read = history.read.filter((url) => known.has(url));
  const positions = history.positions.filter((position) => known.has(position.url));
  if (read.length === history.read.length && positions.length === history.positions.length)
    return history;
  return { read, positions };
}

/**
 * 저장값(`read`·`position` 키에서 꺼낸 JSON)에서 기록을 되살린다. 판 번호가 다르거나 모양이 틀린 값, 겹친 URL,
 * 읽은 글의 위치는 버리고 위치는 20편까지만 둔다. `published`를 주면 그 목록에 없는 글도 버린다.
 */
export function restoreHistory(
  saved: { read: unknown; position: unknown },
  published?: readonly string[],
): ReadingHistory {
  const read = [
    ...new Set(
      versionedList(saved.read, 'urls').filter((url): url is string => typeof url === 'string'),
    ),
  ];
  const seen = new Set(read);
  const positions: ReadingPosition[] = [];
  for (const entry of versionedList(saved.position, 'entries')) {
    if (!isPosition(entry) || seen.has(entry.url)) continue;
    seen.add(entry.url);
    positions.push({ url: entry.url, chapter: entry.chapter, percent: entry.percent });
  }
  const history = { read, positions: positions.slice(0, POSITION_LIMIT) };
  return published ? keepPublished(history, published) : history;
}
