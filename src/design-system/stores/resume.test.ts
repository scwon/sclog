import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyHistory, type ReadingHistory } from './readingHistory.logic';
import { resumeLabel, resumeOffer, resumeReached } from './resume.logic';

const URL = '/blog/developer/';
const OTHER = '/blog/other/';

const outline = [
  { id: 'intro', text: '들어가며', children: [] },
  { id: 'why', text: '왜 개발자', children: [{ id: 'why-first', text: '처음' }] },
  { id: 'tools', text: '도구', children: [] },
  { id: 'developer', text: '개발자란?', children: [] },
  { id: 'end', text: '마치며', children: [] },
];

function readingAt(chapter: string, percent = 42): ReadingHistory {
  return { read: [], positions: [{ url: URL, chapter, percent }] };
}

describe('resumeOffer', () => {
  it('offers the saved chapter with its number, title and percent', () => {
    expect(resumeOffer(readingAt('developer'), { url: URL, outline, hash: '' })).toEqual({
      resume: { url: URL, chapter: { id: 'developer', no: '04', text: '개발자란?' }, percent: 42 },
      discard: false,
    });
  });

  it('offers nothing for a post with no position', () => {
    const history: ReadingHistory = {
      read: [],
      positions: [{ url: OTHER, chapter: 'developer', percent: 42 }],
    };
    expect(resumeOffer(history, { url: URL, outline, hash: '' })).toEqual({
      resume: null,
      discard: false,
    });
    expect(resumeOffer(emptyHistory(), { url: URL, outline, hash: '' }).resume).toBeNull();
  });

  it('offers nothing for a read post', () => {
    const history: ReadingHistory = {
      read: [URL],
      positions: [{ url: URL, chapter: 'developer', percent: 42 }],
    };
    expect(resumeOffer(history, { url: URL, outline, hash: '' })).toEqual({
      resume: null,
      discard: false,
    });
  });

  it('offers nothing when the address points at a chapter', () => {
    expect(resumeOffer(readingAt('developer'), { url: URL, outline, hash: '#why' })).toEqual({
      resume: null,
      discard: false,
    });
  });

  it('discards a position whose chapter is not in the outline', () => {
    expect(resumeOffer(readingAt('removed'), { url: URL, outline, hash: '' })).toEqual({
      resume: null,
      discard: true,
    });
    expect(resumeOffer(readingAt('removed'), { url: URL, outline, hash: '#why' })).toEqual({
      resume: null,
      discard: true,
    });
  });

  it('does not take a section id for a chapter', () => {
    expect(resumeOffer(readingAt('why-first'), { url: URL, outline, hash: '' }).discard).toBe(true);
  });

  it('treats a lone # as no hash', () => {
    expect(resumeOffer(readingAt('developer'), { url: URL, outline, hash: '#' }).resume).not.toBe(
      null,
    );
  });
});

describe('resumeReached', () => {
  it('is reached at the saved chapter or any chapter after it', () => {
    expect(resumeReached(outline, 'developer', 'developer')).toBe(true);
    expect(resumeReached(outline, 'developer', 'end')).toBe(true);
  });

  it('is not reached before the saved chapter or before the first chapter', () => {
    expect(resumeReached(outline, 'developer', 'tools')).toBe(false);
    expect(resumeReached(outline, 'developer', 'intro')).toBe(false);
    expect(resumeReached(outline, 'developer', null)).toBe(false);
  });

  it('is not reached from a chapter missing in the outline', () => {
    expect(resumeReached(outline, 'developer', 'removed')).toBe(false);
    expect(resumeReached(outline, 'removed', 'end')).toBe(false);
  });
});

describe('resumeLabel', () => {
  it('names the chapter number, title and percent', () => {
    expect(
      resumeLabel({
        url: URL,
        chapter: { id: 'developer', no: '04', text: '개발자란?' },
        percent: 42,
      }),
    ).toBe('04 개발자란?에서 이어 읽기 · 42%');
  });
});

/** 저장된 위치(`positions`)로 읽기 기록·이어 읽기 스토어를 새로 불러온다. */
async function loadStores(positions: { url: string; chapter: string; percent: number }[]) {
  vi.resetModules();
  const data = new Map([['position', JSON.stringify({ v: 1, entries: positions })]]);
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  });
  const history = await import('./readingHistory');
  const resume = await import('./resume');
  return { ...history, ...resume };
}

describe('$resume', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('offers the saved chapter when the post opens', async () => {
    const { $resume, openResume } = await loadStores([
      { url: URL, chapter: 'developer', percent: 42 },
    ]);
    openResume({ url: URL, outline, hash: '' });
    expect($resume.get()?.chapter.id).toBe('developer');
  });

  it('forgets a position whose chapter left the outline', async () => {
    const { $readingHistory, $resume, openResume } = await loadStores([
      { url: URL, chapter: 'removed', percent: 42 },
      { url: OTHER, chapter: 'why', percent: 10 },
    ]);
    openResume({ url: URL, outline, hash: '' });
    expect($resume.get()).toBeNull();
    expect($readingHistory.get().positions.map((entry) => entry.url)).toEqual([OTHER]);
  });

  it('goes away once the reader reaches the saved chapter', async () => {
    const { $resume, followResume, openResume } = await loadStores([
      { url: URL, chapter: 'developer', percent: 42 },
    ]);
    openResume({ url: URL, outline, hash: '' });
    followResume(outline, 'tools');
    expect($resume.get()).not.toBeNull();
    followResume(outline, 'end');
    expect($resume.get()).toBeNull();
  });

  it('goes away when pressed, when another file opens, or when the history is cleared', async () => {
    const { $resume, clearReadingHistory, dismissResume, openResume } = await loadStores([
      { url: URL, chapter: 'developer', percent: 42 },
    ]);
    openResume({ url: URL, outline, hash: '' });
    dismissResume();
    expect($resume.get()).toBeNull();

    openResume({ url: URL, outline, hash: '' });
    openResume({ url: OTHER, outline, hash: '' });
    expect($resume.get()).toBeNull();

    openResume({ url: URL, outline, hash: '' });
    clearReadingHistory();
    expect($resume.get()).toBeNull();
  });
});
