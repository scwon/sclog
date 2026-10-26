import { describe, expect, it } from 'vitest';
import { currentBlock, readingPercent } from './reading.logic';

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
