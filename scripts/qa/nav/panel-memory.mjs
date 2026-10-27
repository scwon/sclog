/**
 * 마지막 패널 화면(1440px). 마지막으로 고른 패널 화면은 세션 동안 남는다. 글에서 고른 프로필이 새로 불러온
 * 태그 화면에 남고, 태그 화면에서 탐색기 → 프로필을 골라 새로고침할 때마다 고른 화면이 남는지 본다.
 * 시작 상태는 `../scenario.mjs`.
 */
/* global QA */
import { scenario } from '../scenario.mjs';

const { page, check, goto, reload, homePostUrl, pickPanel, panelView, panelIs, done } =
  await scenario('panel-memory');

/** 활동 막대에서 화면을 고르고 새로고침한다. */
const pickAndReload = async (label) => {
  await pickPanel(label);
  await panelIs(label);
  await reload();
  // 서버 HTML은 세션의 마지막 화면을 모르므로 하이드레이션 뒤 다시 그려질 때까지 기다린다.
  await panelIs(label);
};

// 준비: 글(패널 기본 화면이 탐색기)에서 프로필을 골라 마지막 화면을 프로필로 둔다.
const postUrl = await homePostUrl();
await goto(`${QA.base}${postUrl}`);
await panelIs('탐색기');
await pickPanel('프로필');
await panelIs('프로필');

await goto(`${QA.base}/blog/tags/`);
const tagUrl = await page.evaluate(
  () =>
    [...document.querySelectorAll('#editor a[href^="/blog/tags/"]')]
      .filter((a) => a.getAttribute('href') !== '/blog/tags/')
      .map((a) => a.href)[0] ?? null,
);
check('태그 화면 링크가 있음', tagUrl !== null);
if (tagUrl) {
  await goto(tagUrl);
  await panelIs('프로필');
  check('새로 불러온 태그 화면에 마지막 화면(프로필)', (await panelView()) === '프로필');
  await pickAndReload('탐색기');
  check('태그 화면에서 고른 탐색기가 새로고침 뒤 남음', (await panelView()) === '탐색기');
  await pickAndReload('프로필');
  check('태그 화면에서 고른 프로필이 새로고침 뒤 남음', (await panelView()) === '프로필');
}

await done();
