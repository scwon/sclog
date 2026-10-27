/**
 * 홈에서 ⌘P(Ctrl+P)로 연 명령 팔레트: 파일 모드와 `>` 명령 모드. 팔레트는 처음 쓸 때 불러오는 청크라 조금 기다린다.
 */

/** 홈에서 팔레트 두 모드를 본다. */
export async function onPage({ page, until, audit }, path) {
  if (path !== '/') return;
  await page.keyboard.press('ControlOrMeta+P');
  await page.waitForSelector("loc=css:[role='dialog'][aria-label='명령 팔레트']", {
    state: 'visible',
  });
  await audit('팔레트');
  await page.keyboard.type('>');
  await page.waitForSelector("loc=css:[role='listbox'][aria-label='명령']", { state: 'visible' });
  await audit('명령 목록');
  await page.keyboard.press('Escape');
  await until(
    '팔레트가 닫힘',
    () => document.querySelector("[role='dialog'][aria-label='명령 팔레트']") === null,
  );
}
