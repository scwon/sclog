/**
 * 읽기 기록(1440px). 글 끝까지 스크롤하면 읽은 글이 되어 탐색기에 `✓`가 붙고, 다음 방문(새로고침)에도 남으며,
 * 프로필의 `기록 지우기`를 누르면 꼬리표와 저장값이 바로 사라지는지 본다. 비운 읽기 기록에서 시작한다
 * (`../scenario.mjs`).
 */
/* global QA */
import { scenario } from '../scenario.mjs';

const { page, check, until, goto, reload, homePostUrl, pickPanel, panelView, panelIs, done } =
  await scenario('read-history');

/** 탐색기에서 그 글 줄의 꼬리표(스크린 리더 글자). 없으면 빈 문자열. */
const explorerMark = (url) =>
  page.evaluate(
    (href) =>
      document.querySelector(`#panel a[href="${href}"] .sr-only`)?.textContent?.trim() ?? '',
    url,
  );
/** 패널이 탐색기가 아니면 활동 막대에서 탐색기를 고른다. */
const showExplorer = async () => {
  if ((await panelView()) !== '탐색기') await pickPanel('탐색기');
  await panelIs('탐색기');
};
/** 탐색기의 그 글 줄 꼬리표가 `mark`가 될 때까지 기다린다. */
const explorerMarkIs = (url, mark) =>
  until(
    `탐색기 꼬리표가 '${mark}'`,
    ({ href, want }) =>
      (document.querySelector(`#panel a[href="${href}"] .sr-only`)?.textContent?.trim() ?? '') ===
      want,
    { href: url, want: mark },
  );

const postUrl = await homePostUrl();
await goto(QA.base + postUrl);
await page.evaluate(() => {
  window.scrollTo(0, document.documentElement.scrollHeight);
  return true;
});
await showExplorer();
await explorerMarkIs(postUrl, '읽음');
check('글 끝까지 읽으면 탐색기에 ✓', (await explorerMark(postUrl)) === '읽음');
await reload();
await showExplorer();
await explorerMarkIs(postUrl, '읽음');
check('읽은 글 표시가 새로고침 뒤에도 남음', (await explorerMark(postUrl)) === '읽음');
await pickPanel('프로필', '프로필 열기');
await panelIs('프로필');
await page.click("loc=css:section[aria-labelledby='profile-history'] button", {
  label: '기록 지우기',
});
await until(
  '기록 지우기 뒤 안내',
  () =>
    document
      .querySelector("section[aria-labelledby='profile-history'] p")
      ?.textContent?.includes('남은 읽기 기록이 없습니다') === true,
);
const historyText = await page.evaluate(
  () => document.querySelector("section[aria-labelledby='profile-history'] p")?.textContent ?? '',
);
check('지우면 기록 없음 안내', historyText.includes('남은 읽기 기록이 없습니다'), historyText);
const stored = await page.evaluate(() => [
  localStorage.getItem('read'),
  localStorage.getItem('position'),
]);
check(
  '지우면 두 키가 모두 사라짐',
  stored.every((value) => value === null),
  stored.join(', '),
);
await showExplorer();
await explorerMarkIs(postUrl, '');
check('지우면 탐색기 꼬리표가 사라짐', (await explorerMark(postUrl)) === '');

await done();
