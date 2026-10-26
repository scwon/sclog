import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  emptyHistory,
  forgetPosition,
  keepPublished,
  markText,
  readingMark,
  record,
  restoreHistory,
  storedHistory,
  summarizeHistory,
} from './readingHistory.logic';

const A = '/blog/a/';
const B = '/blog/b/';

describe('record', () => {
  it('makes a post read at 90% and not before', () => {
    expect(record(emptyHistory(), { url: A, chapter: 'end', percent: 89 }).read).toEqual([]);
    expect(record(emptyHistory(), { url: A, chapter: 'end', percent: 90 }).read).toEqual([A]);
  });

  it('keeps the chapter and percent of a post read halfway', () => {
    const history = record(emptyHistory(), { url: A, chapter: 'developer', percent: 42 });
    expect(history).toEqual({
      read: [],
      positions: [{ url: A, chapter: 'developer', percent: 42 }],
    });
  });

  it('does not save a position before the first chapter', () => {
    const history = emptyHistory();
    expect(record(history, { url: A, chapter: null, percent: 3 })).toBe(history);
  });

  it('moves the updated post to the front', () => {
    const history = [
      { url: A, chapter: 'one', percent: 10 },
      { url: B, chapter: 'two', percent: 30 },
      { url: A, chapter: 'three', percent: 50 },
    ].reduce(record, emptyHistory());
    expect(history.positions).toEqual([
      { url: A, chapter: 'three', percent: 50 },
      { url: B, chapter: 'two', percent: 30 },
    ]);
  });

  it('drops the position when the post becomes read', () => {
    const halfway = record(emptyHistory(), { url: A, chapter: 'one', percent: 42 });
    expect(record(halfway, { url: A, chapter: 'end', percent: 95 })).toEqual({
      read: [A],
      positions: [],
    });
  });

  it('keeps no position for a post already read', () => {
    const read = record(emptyHistory(), { url: A, chapter: 'end', percent: 100 });
    expect(record(read, { url: A, chapter: 'one', percent: 20 })).toBe(read);
    expect(record(read, { url: A, chapter: 'end', percent: 99 })).toBe(read);
  });

  it('returns the same history when nothing changes', () => {
    const history = record(emptyHistory(), { url: A, chapter: 'one', percent: 42 });
    expect(record(history, { url: A, chapter: 'one', percent: 42 })).toBe(history);
  });

  it('keeps the 20 most recently updated posts', () => {
    const urls = Array.from({ length: 21 }, (_, index) => `/blog/p${index}/`);
    const history = urls.reduce(
      (state, url) => record(state, { url, chapter: 'one', percent: 10 }),
      emptyHistory(),
    );
    expect(history.positions).toHaveLength(20);
    expect(history.positions[0].url).toBe('/blog/p20/');
    expect(history.positions.map((position) => position.url)).not.toContain('/blog/p0/');
  });
});

describe('restoreHistory', () => {
  const read = { v: 1, urls: [A] };
  const position = { v: 1, entries: [{ url: B, chapter: 'two', percent: 30 }] };

  it('round-trips what it stores', () => {
    const history = { read: [A], positions: [{ url: B, chapter: 'two', percent: 30 }] };
    const stored = storedHistory(history);
    expect(stored).toEqual({ read, position });
    expect(restoreHistory(JSON.parse(JSON.stringify(stored)))).toEqual(history);
  });

  it('starts empty when nothing is stored', () => {
    expect(restoreHistory({ read: null, position: null })).toEqual(emptyHistory());
  });

  it('drops values of the wrong shape or version', () => {
    expect(restoreHistory({ read: { v: 2, urls: [A] }, position: [] })).toEqual(emptyHistory());
    expect(restoreHistory({ read: { v: 1, urls: A }, position: 'x' })).toEqual(emptyHistory());
    const restored = restoreHistory({
      read: { v: 1, urls: [A, 3, null, A] },
      position: {
        v: 1,
        entries: [
          { url: B, chapter: 'two', percent: 30 },
          { url: '/blog/c/', chapter: '', percent: 10 },
          { url: '/blog/d/', chapter: 'one', percent: '10' },
          { url: '/blog/e/', chapter: 'one', percent: 95 },
          { url: '/blog/f/', chapter: 'one', percent: -1 },
          { url: B, chapter: 'one', percent: 5 },
          'nope',
        ],
      },
    });
    expect(restored).toEqual({
      read: [A],
      positions: [{ url: B, chapter: 'two', percent: 30 }],
    });
  });

  it('drops the position of a read post', () => {
    const restored = restoreHistory({
      read,
      position: { v: 1, entries: [{ url: A, chapter: 'one', percent: 42 }] },
    });
    expect(restored).toEqual({ read: [A], positions: [] });
  });

  it('keeps at most 20 positions', () => {
    const entries = Array.from({ length: 25 }, (_, index) => ({
      url: `/blog/p${index}/`,
      chapter: 'one',
      percent: 10,
    }));
    expect(restoreHistory({ read: null, position: { v: 1, entries } }).positions).toHaveLength(20);
  });

  it('drops posts that are not published', () => {
    expect(restoreHistory({ read, position }, [B])).toEqual({
      read: [],
      positions: [{ url: B, chapter: 'two', percent: 30 }],
    });
  });
});

describe('readingMark', () => {
  const history = { read: [A], positions: [{ url: B, chapter: 'two', percent: 42 }] };

  it('marks read posts, posts being read, and nothing else', () => {
    expect(readingMark(history, A)).toEqual({ kind: 'read' });
    expect(readingMark(history, B)).toEqual({ kind: 'reading', percent: 42 });
    expect(readingMark(history, '/blog/c/')).toBeNull();
  });

  it('writes a short mark for the explorer and next file line', () => {
    expect(markText({ kind: 'read' }, 'short')).toEqual({ text: '✓', label: '읽음' });
    expect(markText({ kind: 'reading', percent: 42 }, 'short')).toEqual({
      text: '42%',
      label: '42% 읽는 중',
    });
  });

  it('writes a long mark for the flow log', () => {
    expect(markText({ kind: 'read' }, 'long')).toEqual({ text: '✓ 읽음', label: '읽음' });
    expect(markText({ kind: 'reading', percent: 71 }, 'long')).toEqual({
      text: '71% 읽는 중',
      label: '71% 읽는 중',
    });
  });
});

describe('summarizeHistory', () => {
  it('counts read posts and posts being read', () => {
    const history = {
      read: [A],
      positions: [
        { url: B, chapter: 'two', percent: 42 },
        { url: '/blog/c/', chapter: 'one', percent: 7 },
      ],
    };
    expect(summarizeHistory(history)).toBe('1편 읽음 · 2편 읽는 중');
    expect(summarizeHistory({ read: [A], positions: [] })).toBe('1편 읽음 · 0편 읽는 중');
  });

  it('has nothing to say when the history is empty', () => {
    expect(summarizeHistory(emptyHistory())).toBeNull();
  });
});

/** 쓰기를 세는 가짜 `localStorage`. `broken`이면 모든 호출이 던진다. */
function fakeStorage(initial: Record<string, string> = {}, broken = false) {
  const data = new Map(Object.entries(initial));
  const writes: string[] = [];
  const guard = () => {
    if (broken) throw new Error('SecurityError');
  };
  return {
    data,
    writes,
    getItem: (key: string) => (guard(), data.get(key) ?? null),
    setItem: (key: string, value: string) => (guard(), writes.push(key), data.set(key, value)),
    removeItem: (key: string) => (guard(), data.delete(key)),
  };
}

async function loadStore(storage: ReturnType<typeof fakeStorage>) {
  vi.resetModules();
  vi.stubGlobal('localStorage', storage);
  return import('./readingHistory');
}

describe('$readingHistory', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('loads the stored history once', async () => {
    const storage = fakeStorage({
      read: JSON.stringify({ v: 1, urls: [A] }),
      position: JSON.stringify({ v: 1, entries: [{ url: B, chapter: 'two', percent: 30 }] }),
    });
    const { $readingHistory } = await loadStore(storage);
    expect($readingHistory.get()).toEqual({
      read: [A],
      positions: [{ url: B, chapter: 'two', percent: 30 }],
    });
  });

  it('writes at most once a second, and the last value when leaving', async () => {
    const storage = fakeStorage();
    const { $readingHistory, flushReadingHistory, recordReading } = await loadStore(storage);
    recordReading(A, 'one', 10);
    recordReading(A, 'one', 20);
    expect($readingHistory.get().positions).toEqual([{ url: A, chapter: 'one', percent: 20 }]);
    expect(storage.writes).toEqual([]);
    vi.advanceTimersByTime(1000);
    expect(storage.writes).toEqual(['read', 'position']);
    recordReading(A, 'two', 30);
    flushReadingHistory();
    expect(JSON.parse(storage.data.get('position') ?? '')).toEqual({
      v: 1,
      entries: [{ url: A, chapter: 'two', percent: 30 }],
    });
    flushReadingHistory();
    vi.advanceTimersByTime(1000);
    expect(storage.writes).toHaveLength(4);
  });

  it('clears both keys at once', async () => {
    const storage = fakeStorage({ read: JSON.stringify({ v: 1, urls: [A] }) });
    const { $readingHistory, clearReadingHistory, recordReading } = await loadStore(storage);
    recordReading(B, 'one', 10);
    clearReadingHistory();
    vi.advanceTimersByTime(1000);
    expect($readingHistory.get()).toEqual(emptyHistory());
    expect([...storage.data.keys()]).toEqual([]);
  });

  it('keeps the history in memory when storage cannot be used', async () => {
    const { $readingHistory, clearReadingHistory, flushReadingHistory, recordReading } =
      await loadStore(fakeStorage({}, true));
    recordReading(A, 'end', 100);
    flushReadingHistory();
    expect($readingHistory.get().read).toEqual([A]);
    clearReadingHistory();
    expect($readingHistory.get()).toEqual(emptyHistory());
  });

  it('drops posts that are not published', async () => {
    const storage = fakeStorage({ read: JSON.stringify({ v: 1, urls: [A, B] }) });
    const { $readingHistory, keepPublishedHistory } = await loadStore(storage);
    keepPublishedHistory([B]);
    expect($readingHistory.get().read).toEqual([B]);
  });
});

describe('forgetPosition', () => {
  it('drops the position of one post and keeps the rest', () => {
    const history = {
      read: [A],
      positions: [
        { url: B, chapter: 'two', percent: 30 },
        { url: '/blog/c/', chapter: 'one', percent: 10 },
      ],
    };
    expect(forgetPosition(history, B)).toEqual({
      read: [A],
      positions: [{ url: '/blog/c/', chapter: 'one', percent: 10 }],
    });
  });

  it('returns the same history when the post has no position', () => {
    const history = { read: [A], positions: [] };
    expect(forgetPosition(history, B)).toBe(history);
  });
});

describe('keepPublished', () => {
  it('returns the same history when every post is published', () => {
    const history = restoreHistory({ read: { v: 1, urls: [A] }, position: null });
    expect(keepPublished(history, [A, B])).toBe(history);
    expect(keepPublished(history, [B])).toEqual(emptyHistory());
  });
});
