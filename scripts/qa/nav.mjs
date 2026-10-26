/**
 * 화면 이동 시나리오(1440px). 홈 → 글 → 개요의 마지막 장 → 뒤로 → 뒤로 → 글 탭 닫기 → 테마 전환 → 다시 글.
 * 매 단계 창 틀 아일랜드가 같은 요소로 남는지, 탭·상태줄·테마가 맞는지, 콘솔 오류가 없는지 본다.
 * `run.mjs`가 `globalThis.QA = { base }`를 넣고 ego-browser에서 import한다.
 */
/* global QA, taskSpace */
const task = await taskSpace('sclog qa nav');
const page = task.page('p1');
const failures = [];

function check(label, ok, detail = '') {
  console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(label);
}

const editor = () =>
  page.evaluate(() => {
    const root = document.getElementById('editor');
    return {
      url: root?.dataset.fileUrl,
      kind: root?.dataset.fileKind,
      title: root?.dataset.fileTitle,
    };
  });
const shellKept = () =>
  page.evaluate(
    () =>
      window.qaShell?.isConnected === true &&
      window.qaShell === document.getElementById('explorer')?.closest('astro-island'),
  );
const tabs = () =>
  page.evaluate(() =>
    [...document.querySelectorAll("nav[aria-label='열린 파일'] a")].map((a) => a.textContent),
  );
const statusLine = () => page.evaluate(() => document.querySelector('footer')?.textContent ?? '');

await page.cdp('Runtime.enable');
await page.cdp('Log.enable');
await page.cdp('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await page.goto(`${QA.base}/`);
await page.evaluate(() => {
  localStorage.removeItem('theme');
  sessionStorage.clear();
});
await page.reload();
await page.waitForTimeout(1500);
await page.events();
await page.evaluate(() => {
  window.qaShell = document.getElementById('explorer')?.closest('astro-island');
});
check('홈이 posts.log', (await editor()).url === '/');

await page.click('loc=css:.flow-link', { label: '첫 글 열기' });
await page.waitForTimeout(2000);
const post = await editor();
check('글로 이동', post.kind === 'post', post.url);
check('창 틀 유지(홈 → 글)', await shellKept());
check('글 탭이 열림', (await tabs()).length === 2, (await tabs()).join(', '));

const last = await page.evaluate(() => {
  const outline = JSON.parse(document.getElementById('editor-outline')?.textContent ?? '[]');
  return outline.length
    ? {
        id: outline.at(-1).id,
        text: outline.at(-1).text,
        no: String(outline.length).padStart(2, '0'),
      }
    : null;
});
check('개요가 있음', last !== null);
if (last) {
  await page.click(`loc=css:nav[aria-label='글 개요'] a[href='#${last.id}']`, {
    label: '마지막 장',
  });
  await page.waitForTimeout(1500);
  const status = await statusLine();
  check('상태줄이 마지막 장', status.includes(`${last.no} ${last.text}`), status);
}

await page.evaluate(() => history.back());
await page.waitForTimeout(800);
await page.evaluate(() => history.back());
await page.waitForTimeout(1500);
check('뒤로 두 번이면 홈', (await editor()).url === '/');
check('창 틀 유지(뒤로)', await shellKept());

await page.click(`loc=css:button[aria-label='${post.title} 닫기']`, { label: '글 탭 닫기' });
await page.waitForTimeout(800);
check('글 탭이 닫힘', (await tabs()).length === 1, (await tabs()).join(', '));

const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
await page.click('loc=css:button[aria-pressed]', { label: '테마 전환' });
await page.waitForTimeout(500);
const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
check('테마가 바뀜', themeBefore !== themeAfter, `${themeBefore} → ${themeAfter}`);

await page.click('loc=css:.flow-link', { label: '글 다시 열기' });
await page.waitForTimeout(2000);
check('다시 글', (await editor()).url === post.url);
check('창 틀 유지(다시 글)', await shellKept());
check(
  '테마가 이동 뒤에도 유지',
  (await page.evaluate(() => document.documentElement.dataset.theme)) === themeAfter,
);

const events = await page.events();
const errors = events
  .filter(
    (e) =>
      e.method === 'Runtime.exceptionThrown' ||
      (e.method === 'Runtime.consoleAPICalled' && e.params?.type === 'error') ||
      (e.method === 'Log.entryAdded' && e.params?.entry?.level === 'error'),
  )
  .map((e) =>
    (e.params?.entry?.text ?? e.params?.exceptionDetails?.text ?? JSON.stringify(e.params)).slice(
      0,
      160,
    ),
  );
check('콘솔 오류 없음', errors.length === 0, errors.join(' | '));

await page.evaluate(() => {
  localStorage.removeItem('theme');
  sessionStorage.clear();
});
await task.finish({ keep: [] });
if (failures.length) throw new Error(`이동 시나리오 실패: ${failures.join(', ')}`);
