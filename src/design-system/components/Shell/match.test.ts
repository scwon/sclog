import { describe, expect, it } from 'vitest';
import { matchRanges, normalizeForMatch } from './match.logic';

/** 범위를 글자로 바꿔 읽기 쉽게 본다. */
const pieces = (text: string, query: string) =>
  matchRanges(text, query).map(([start, end]) => text.slice(start, end));

describe('normalizeForMatch', () => {
  it('decomposes Hangul syllables (NFD) and lowercases', () => {
    expect(normalizeForMatch('개발 API')).toBe('개발 api'.normalize('NFD'));
    expect(normalizeForMatch('개').length).toBe(2);
  });
});

describe('matchRanges', () => {
  it('finds a plain substring at its position in the original text', () => {
    expect(matchRanges('나는 개발자다', '개발')).toEqual([[3, 5]]);
  });

  it('ignores case', () => {
    expect(pieces('Astro와 astro', 'ASTRO')).toEqual(['Astro', 'astro']);
  });

  it('matches a syllable still being typed: "개바" finds "개발" and paints both syllables', () => {
    expect(pieces('프론트엔드 개발 이야기', '개바')).toEqual(['개발']);
  });

  it('matches part of a compound word: "발자" finds "개발자"', () => {
    expect(pieces('개발자란?', '발자')).toEqual(['발자']);
  });

  it('widens a match that starts mid-syllable to the whole syllable', () => {
    // "ㅐ발" 같은 검색어는 없지만, 자모 단위로 맞으면 시작 음절도 통째로 칠한다.
    expect(pieces('개발', 'ᅢ발'.normalize('NFD'))).toEqual(['개발']);
  });

  it('returns every match in the text, not just the first', () => {
    expect(matchRanges('개발 그리고 개발', '개발')).toEqual([
      [0, 2],
      [7, 9],
    ]);
  });

  it('merges matches that touch or overlap into one range', () => {
    expect(matchRanges('개발개발', '개발')).toEqual([[0, 4]]);
    // "바"는 "발"의 앞 자모와도 맞으므로 세 음절이 모두 칠해지고, 맞닿아 하나가 된다.
    expect(matchRanges('발바발', '바')).toEqual([[0, 3]]);
  });

  it("keeps touching matches apart with merge: 'overlap', but still merges overlapping ones", () => {
    expect(matchRanges('개발개발', '개발', { merge: 'overlap' })).toEqual([
      [0, 2],
      [2, 4],
    ]);
    expect(matchRanges('ㅋㅋㅋ', 'ㅋ', { merge: 'overlap' })).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
    // 넓힌 두 일치([0, 2]·[1, 3])가 가운데 음절을 함께 덮으면 하나로 합친다.
    expect(matchRanges('발발발', '\u11af\u1107', { merge: 'overlap' })).toEqual([[0, 3]]);
  });

  it('keeps positions in UTF-16 offsets of the original even after astral characters', () => {
    expect(pieces('🚀 개발', '개발')).toEqual(['개발']);
  });

  it('returns no ranges when nothing matches or the query is empty', () => {
    expect(matchRanges('개발', '디자인')).toEqual([]);
    expect(matchRanges('개발', '')).toEqual([]);
  });
});
