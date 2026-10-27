/**
 * 이어 읽기(1440px). 글 가운데 장에서 홈으로 떠났다가 돌아오면 열기 요약 뒤 상태줄에 이어 읽기 버튼이 뜨고,
 * 누르면 그 장으로 가며 사라지는지 본다. 비운 읽기 기록에서 시작한다(`../scenario.mjs`).
 */
/* global QA */
import { scenario } from '../scenario.mjs';

const { page, check, until, navigate, homePostUrl, shellKept, statusLine, done } =
  await scenario('resume');

const postUrl = await homePostUrl();
await navigate('글 열기', () =>
  page.click(`loc=css:.flow-link[href="${postUrl}"]`, { label: '글 열기' }),
);
const middleChapter = await page.evaluate(() => {
  const outline = JSON.parse(document.getElementById('editor-outline')?.textContent ?? '[]');
  const index = Math.floor(outline.length / 2);
  const chapter = outline[index];
  if (!chapter || outline.length < 2) return null;
  document.getElementById(chapter.id)?.scrollIntoView();
  window.scrollBy(0, 40);
  return { id: chapter.id, label: `${String(index + 1).padStart(2, '0')} ${chapter.text}` };
});
const middle = middleChapter?.id ?? null;
if (middleChapter) {
  // 상태줄의 장과 읽기 기록은 같은 갱신에서 바뀌므로 상태줄이 가운데 장이면 위치도 기록됐다.
  await until(
    '이어 읽기: 상태줄이 가운데 장',
    (label) => document.querySelector('footer')?.textContent?.includes(label) === true,
    middleChapter.label,
  );
  await navigate('이어 읽기: 홈으로', () =>
    page.click("loc=css:header a[href='/']", { label: '홈으로' }),
  );
  // 글이 열린 때(`astro:page-load`)와 버튼이 뜬 때를 페이지 시계로 잰다. 자동화 탭은 화면 이동이 느릴 수 있어
  // 클릭부터 고정 시간을 기다리지 않고, 버튼을 기다린 뒤 열기 요약(약 2.2초)이 끝난 다음에 떴는지 본다.
  await page.evaluate(() => {
    const timing = {};
    window.qaResume = timing;
    document.addEventListener('astro:page-load', () => (timing.open ??= performance.now()), {
      once: true,
    });
    const footer = document.querySelector('footer');
    const observer = new MutationObserver(() => {
      if (!footer?.querySelector('button')) return;
      timing.offered = performance.now();
      observer.disconnect();
    });
    if (footer) observer.observe(footer, { childList: true, subtree: true });
    return true;
  });
  await navigate('이어 읽기: 글 다시 열기', () =>
    page.click(`loc=css:.flow-link[href="${postUrl}"]`, { label: '글 다시 열기' }),
  );
  // 글이 막 열린 때는 열기 요약 동안이다(약 2.2초). 버튼이 뜬 시각은 아래에서 페이지 시계로 따로 본다.
  check(
    '이어 읽기: 열기 요약 동안은 버튼이 없음',
    !(await page.evaluate(() => !!document.querySelector('footer button'))),
  );
  await until('이어 읽기 버튼이 뜸', () => document.querySelector('footer button') !== null);
  const offered = await statusLine();
  const timing = await page.evaluate(() => ({ ...window.qaResume }));
  const after = timing.open && timing.offered ? Math.round(timing.offered - timing.open) : null;
  check('이어 읽기: 버튼이 뜸', offered.includes('에서 이어 읽기 ·'), offered);
  check(
    '이어 읽기: 열기 요약이 끝난 뒤에 뜸',
    after !== null && after >= 2000,
    after === null ? '' : `글이 열리고 ${after}ms`,
  );
  await page.click('loc=css:footer button', { label: '이어 읽기 누르기' });
  await until(
    '이어 읽기: 그 장으로 가고 버튼이 사라짐',
    (id) =>
      decodeURIComponent(location.hash.slice(1)) === id &&
      document.querySelector('footer button') === null,
    middle,
  );
  const resumed = await page.evaluate(() => ({
    hash: decodeURIComponent(location.hash.slice(1)),
    button: !!document.querySelector('footer button'),
  }));
  check('이어 읽기: 누르면 그 장으로 감', resumed.hash === middle, resumed.hash);
  check('이어 읽기: 누르면 사라짐', !resumed.button);
  check('창 틀 유지(이어 읽기)', await shellKept());
} else {
  check('이어 읽기: 장이 둘 이상인 글', false);
}

await done();
