/**
 * 상태줄의 이어 읽기 버튼. 읽는 중으로 기록한 폭·테마에서, 글의 위치를 개요의 첫 장으로 넣고 다시 열면 열기 요약
 * (약 2.2초) 뒤 버튼이 뜬다. 폭마다 한 테마씩, 세 폭 모두 거친다.
 */

/** 읽는 중인 글을 다시 열어 이어 읽기 버튼을 띄운다. */
export async function onPage({ page, reload, audit, postUrls, widthIndex, themeIndex }, path) {
  if (!postUrls.includes(path) || (widthIndex + themeIndex) % 2 !== 1) return;
  const seeded = await page.evaluate((url) => {
    const [first] = JSON.parse(document.getElementById('editor-outline')?.textContent ?? '[]');
    if (!first) return false;
    const entries = [{ url, chapter: first.id, percent: 42 }];
    localStorage.setItem('position', JSON.stringify({ v: 1, entries }));
    return true;
  }, decodeURI(path));
  if (!seeded) return;
  await reload();
  await page.waitForSelector('loc=css:footer button', { state: 'visible', timeout: 5000 });
  await audit('이어 읽기');
}
