import { describe, expect, it } from 'vitest';
import { currentBlock, locateInOutline, readingPercent, readingSymbol } from './reading.logic';

describe('readingPercent', () => {
  const page = { scrollHeight: 3000, clientHeight: 1000 };

  it('is 0% at the top and 100% at the bottom', () => {
    expect(readingPercent({ ...page, scrollTop: 0 })).toBe(0);
    expect(readingPercent({ ...page, scrollTop: 2000 })).toBe(100);
  });

  it('rounds the middle to a whole percent', () => {
    expect(readingPercent({ ...page, scrollTop: 1000 })).toBe(50);
    expect(readingPercent({ ...page, scrollTop: 333 })).toBe(17);
  });

  it('clamps overscroll and treats a page that does not scroll as fully read', () => {
    expect(readingPercent({ ...page, scrollTop: -40 })).toBe(0);
    expect(readingPercent({ ...page, scrollTop: 2100 })).toBe(100);
    expect(readingPercent({ scrollHeight: 800, clientHeight: 1000, scrollTop: 0 })).toBe(100);
  });
});

describe('currentBlock', () => {
  const tops = [120, 400, 900, 1500];

  it('is the last block whose top has passed the reading line', () => {
    expect(currentBlock(tops, 450)).toBe(1);
    expect(currentBlock(tops, 900)).toBe(2);
    expect(currentBlock(tops, 5000)).toBe(3);
  });

  it('is the first block before anything has passed', () => {
    expect(currentBlock(tops, 0)).toBe(0);
    expect(currentBlock([], 100)).toBe(-1);
  });
});

describe('readingSymbol', () => {
  const chapter = { id: 'developer', no: '04', text: '개발자란?' };

  it('shows the chapter, then the section after ›', () => {
    expect(readingSymbol({ chapter, section: null })).toBe('04 개발자란?');
    expect(readingSymbol({ chapter, section: { id: 'y34', text: '3~4년차' } })).toBe(
      '04 개발자란? › 3~4년차',
    );
  });

  it('is empty before the first chapter', () => {
    expect(readingSymbol({ chapter: null, section: null })).toBe('');
  });
});

describe('locateInOutline', () => {
  const outline = [
    { id: 'a', text: 'A', children: [] },
    {
      id: 'b',
      text: 'B',
      children: [
        { id: 'b1', text: 'B-1' },
        { id: 'b2', text: 'B-2' },
      ],
    },
  ];

  it('finds the chapter and section of the last heading passed', () => {
    expect(locateInOutline(outline, ['a'])).toEqual({
      chapter: { id: 'a', no: '01', text: 'A' },
      section: null,
    });
    expect(locateInOutline(outline, ['a', 'b', 'b1', 'b2'])).toEqual({
      chapter: { id: 'b', no: '02', text: 'B' },
      section: { id: 'b2', text: 'B-2' },
    });
  });

  it('drops the section when a new chapter starts and ignores unknown ids', () => {
    expect(locateInOutline(outline, ['b', 'b1', 'x'])).toEqual({
      chapter: { id: 'b', no: '02', text: 'B' },
      section: { id: 'b1', text: 'B-1' },
    });
    expect(locateInOutline(outline, [])).toEqual({ chapter: null, section: null });
  });
});
