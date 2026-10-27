/**
 * 결과가 있는 검색 화면. 마지막 패널 화면을 검색으로 저장하고 새로고침한다(검색 화면은 홈에서도 남는다). 패널이
 * 숨는 폭에서는 연다.
 */
/* global QA */

/** 홈에서 검색 화면에 검색어를 넣어 결과 목록을 띄운다. */
export async function onPass({ page, reload, audit, width }) {
  await page.goto(`${QA.base}/`);
  await page.evaluate(() => sessionStorage.setItem('panel', '{"v":1,"view":"search"}'));
  await reload();
  if (width < 760) await page.click('loc=css:header button[aria-controls="panel"]');
  else if (width < 1100)
    await page.click("loc=css:nav[aria-label='활동 막대'] button[aria-label='검색']");
  await page.waitForSelector('loc=css:#panel input[type=search]', { state: 'visible' });
  await page.fill('loc=css:#panel input[type=search]', '개발');
  await page.waitForSelector("loc=css:#panel ul[aria-label='검색 결과']", { state: 'visible' });
  await audit('검색 화면');
  await page.evaluate(() => sessionStorage.clear());
}
