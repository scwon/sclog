/**
 * 패널이 숨는 폭(1100px 미만)의 홈에서 패널을 열어 프로필 화면을 본다. 좁은 화면(760px 미만)은 제목 표시줄의
 * 메뉴 버튼, 그 밖에는 활동 막대 버튼으로 연다.
 */

/** 좁은 폭의 홈에서 프로필 패널을 연다. */
export async function onPage({ page, until, audit, width }, path) {
  if (path !== '/' || width >= 1100) return;
  await page.evaluate((isNarrow) => {
    const button = isNarrow
      ? document.querySelector('header button[aria-controls="panel"]')
      : document.querySelector("nav[aria-label='활동 막대'] button[aria-pressed='false']");
    button?.click();
    return true;
  }, width < 760);
  await until('패널이 열림(프로필)', () => {
    const panel = document.getElementById('panel');
    return (
      panel !== null &&
      getComputedStyle(panel).display !== 'none' &&
      panel.getAttribute('aria-label') === '프로필'
    );
  });
  await audit('프로필');
}
