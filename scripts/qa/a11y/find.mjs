/**
 * 검색어를 넣은 찾기 줄(⌘F). 칠하기는 axe가 보지 않으므로 찾기 줄 자체의 이름·명암비·겹침을 본다.
 */
/* global QA */

/** 첫 글에서 찾기 줄을 열어 검색어를 넣는다. */
export async function onPass({ page, until, goto, audit, postUrls }) {
  if (!postUrls[0]) return;
  await goto(QA.base + postUrls[0]);
  await page.evaluate(() => {
    document.getElementById('editor')?.focus();
    return true;
  });
  await page.keyboard.press('ControlOrMeta+F');
  await page.waitForSelector('loc=css:[data-find-input]', { state: 'visible' });
  await page.keyboard.type('개발');
  await until('찾기 위치 글자(n/m)', () =>
    /^\d+\/\d+$/.test(document.querySelector('search [aria-live="polite"]')?.textContent ?? ''),
  );
  await audit('찾기 줄');
  await page.keyboard.press('Escape');
  await until('찾기 줄이 닫힘', () => document.querySelector('[data-find-input]') === null);
}
