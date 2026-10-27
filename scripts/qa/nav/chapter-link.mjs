/**
 * 장 주소(1440px). 글에서 장 주소 복사 버튼을 키보드로 눌러 상태줄 알림·해시·강조를 보고, 그 주소로 들어와
 * 강조를 본다. 시작 상태는 `../scenario.mjs`.
 */
/* global QA */
import { scenario } from '../scenario.mjs';

const { page, check, until, goto, homePostUrl, done } = await scenario('chapter-link');

const postUrl = await homePostUrl();
await goto(`${QA.base}${postUrl}`);
const chapters = await page.evaluate(() =>
  JSON.parse(document.getElementById('editor-outline')?.textContent ?? '[]').map(({ id }) => id),
);
const copyId = chapters[1] ?? chapters[0];
const arriveId = chapters[0];
if (copyId) {
  const button = `[data-chapter-link="${copyId}"]`;
  await page.focus(button);
  await page.press(button, 'Enter');
  await until(
    '장 주소 복사: 해시와 상태줄 알림',
    (id) =>
      decodeURIComponent(location.hash.slice(1)) === id &&
      document.querySelector('.is-linked') !== null &&
      (document.querySelector('footer [aria-live]')?.textContent ?? '') !== '',
    copyId,
  );
  const copied = await page.evaluate(() => ({
    hash: decodeURIComponent(location.hash.slice(1)),
    linked: [...document.querySelectorAll('.is-linked')].map((heading) => heading.id),
    notice: document.querySelector('footer [aria-live]')?.textContent ?? '',
    routerState: typeof history.state?.index === 'number',
  }));
  check('장 주소 복사: 해시가 그 장', copied.hash === copyId, copied.hash);
  check(
    '장 주소 복사: 상태줄 알림',
    copied.notice === `✓ 주소 복사됨 · #${copyId}` || copied.notice === '주소창에 넣었습니다',
    copied.notice,
  );
  check('장 주소 복사: 그 장이 강조됨', copied.linked.join() === copyId, copied.linked.join());
  check('장 주소 복사: 화면 이동 기록 유지', copied.routerState);

  await goto(`${QA.base}/`);
  await goto(`${QA.base}${postUrl}#${encodeURIComponent(arriveId)}`);
  await until('장 주소로 들어오면 강조', () => document.querySelector('.is-linked') !== null);
  const arrived = await page.evaluate(() =>
    [...document.querySelectorAll('.is-linked')].map((heading) => heading.id),
  );
  check('장 주소로 들어오면 그 장이 강조됨', arrived.join() === arriveId, arrived.join());
}

await done();
