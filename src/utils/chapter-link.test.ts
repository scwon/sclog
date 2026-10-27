import { describe, expect, it } from 'vitest';
import { chapterLinkNotice, chapterLinkUrl } from './chapter-link';

describe('chapterLinkUrl', () => {
  it('joins origin, pathname and the heading id', () => {
    expect(
      chapterLinkUrl(
        { origin: 'https://www.scwon.me', pathname: '/blog/pro-developer-2023-days/' },
        'why',
      ),
    ).toBe('https://www.scwon.me/blog/pro-developer-2023-days/#why');
  });

  it('keeps the hash human-readable instead of percent-encoding it', () => {
    expect(
      chapterLinkUrl({ origin: 'https://www.scwon.me', pathname: '/blog/a/' }, '왜-개발자'),
    ).toBe('https://www.scwon.me/blog/a/#왜-개발자');
  });
});

describe('chapterLinkNotice', () => {
  it('names the copied hash when the clipboard took it', () => {
    expect(chapterLinkNotice('왜-개발자', true)).toBe('✓ 주소 복사됨 · #왜-개발자');
  });

  it('points to the address bar when the clipboard is unavailable', () => {
    expect(chapterLinkNotice('왜-개발자', false)).toBe('주소창에 넣었습니다');
  });
});
