/**
 * 화면 이동 시나리오(1440px). 홈 → 글 → 개요의 마지막 장 → 뒤로 → 뒤로 → 글 탭 닫기 → 테마 전환 →
 * 다시 글 → 태그 화면에서 고른 패널 화면이 새로고침 뒤에도 남는지 → 검색 화면에서 결과 열기. 패널은 홈에서 프로필,
 * 글에서 탐색기를 보이고, 검색 화면은 파일을 열어도 남는다.
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
      window.qaShell === document.getElementById('panel')?.closest('astro-island'),
  );
const tabs = () =>
  page.evaluate(() =>
    [...document.querySelectorAll("nav[aria-label='열린 파일'] a")].map((a) => a.textContent),
  );
const panelView = () =>
  page.evaluate(() => document.getElementById('panel')?.getAttribute('aria-label'));
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
  window.qaShell = document.getElementById('panel')?.closest('astro-island');
});
check('홈이 posts.log', (await editor()).url === '/');
check('홈은 패널이 프로필', (await panelView()) === '프로필');

await page.click('loc=css:.flow-link', { label: '첫 글 열기' });
await page.waitForTimeout(2000);
const post = await editor();
check('글로 이동', post.kind === 'post', post.url);
check('창 틀 유지(홈 → 글)', await shellKept());
check('글은 패널이 탐색기', (await panelView()) === '탐색기');
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
check('홈으로 오면 프로필', (await panelView()) === '프로필');

await page.click(`loc=css:button[aria-label='${post.title} 닫기']`, { label: '글 탭 닫기' });
await page.waitForTimeout(800);
check('글 탭이 닫힘', (await tabs()).length === 1, (await tabs()).join(', '));

const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
await page.click('loc=css:header button[aria-pressed]', { label: '테마 전환' });
await page.waitForTimeout(500);
const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
check('테마가 바뀜', themeBefore !== themeAfter, `${themeBefore} → ${themeAfter}`);

await page.click('loc=css:.flow-link', { label: '글 다시 열기' });
await page.waitForTimeout(2000);
check('다시 글', (await editor()).url === post.url);
check('창 틀 유지(다시 글)', await shellKept());

await page.click("loc=css:nav[aria-label='활동 막대'] button[aria-label='프로필']", {
  label: '프로필 열기',
});
await page.waitForTimeout(300);
check('글에서도 프로필을 열 수 있음', (await panelView()) === '프로필');
check(
  '테마가 이동 뒤에도 유지',
  (await page.evaluate(() => document.documentElement.dataset.theme)) === themeAfter,
);

// 마지막 패널 화면은 세션 동안 남는다. 글에서 고른 프로필이 새로 불러온 태그 화면에 남고, 태그 화면에서
// 탐색기 → 프로필을 골라 새로고침할 때마다 고른 화면이 남는다.
/** 활동 막대에서 화면을 고르고 새로고침한다. */
const pickAndReload = async (label) => {
  await page.click(`loc=css:nav[aria-label='활동 막대'] button[aria-label='${label}']`, {
    label: `${label} 고르기`,
  });
  await page.waitForTimeout(300);
  await page.reload();
  await page.waitForTimeout(1500);
};
await page.goto(`${QA.base}/blog/tags/`);
await page.waitForTimeout(1500);
const tagUrl = await page.evaluate(
  () =>
    [...document.querySelectorAll('#editor a[href^="/blog/tags/"]')]
      .filter((a) => a.getAttribute('href') !== '/blog/tags/')
      .map((a) => a.href)[0] ?? null,
);
check('태그 화면 링크가 있음', tagUrl !== null);
if (tagUrl) {
  await page.goto(tagUrl);
  await page.waitForTimeout(1500);
  check('새로 불러온 태그 화면에 마지막 화면(프로필)', (await panelView()) === '프로필');
  await pickAndReload('탐색기');
  check('태그 화면에서 고른 탐색기가 새로고침 뒤 남음', (await panelView()) === '탐색기');
  await pickAndReload('프로필');
  check('태그 화면에서 고른 프로필이 새로고침 뒤 남음', (await panelView()) === '프로필');
}

// 검색 화면: 열기 전에는 색인을 받지 않는다. 결과를 누르면 글이 열리고 패널은 검색 화면에 남으며, 새로고침 뒤에도
// 검색 화면이다(검색어는 메모리에만 있어 비워진다).
const indexRequested = () =>
  page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .some((entry) => entry.name.includes('/search-index.json')),
  );
const searchInput = () =>
  page.evaluate(() => {
    const input = document.querySelector('#panel input[type=search]');
    return input ? { value: input.value, focused: document.activeElement === input } : null;
  });
check('검색 화면을 열기 전에는 색인 요청이 없음', !(await indexRequested()));
// 앞 단계에서 새로고침했으므로 창 틀 요소를 다시 잡는다.
await page.evaluate(() => {
  window.qaShell = document.getElementById('panel')?.closest('astro-island');
});
await page.click("loc=css:nav[aria-label='활동 막대'] button[aria-label='검색']", {
  label: '검색 화면 열기',
});
await page.waitForSelector('loc=css:#panel input[type=search]', { state: 'visible' });
check('패널이 검색 화면', (await panelView()) === '검색');
check('검색 입력창에 포커스', (await searchInput())?.focused === true);
await page.fill('loc=css:#panel input[type=search]', '개발');
await page.waitForFunction(
  () => /\d+개 파일, \d+줄/.test(document.getElementById('search-summary')?.textContent ?? ''),
  undefined,
  { timeout: 5000 },
);
check('검색 화면을 열면 색인을 받음', await indexRequested());
const hit = await page.evaluate(
  () => document.querySelector("#panel ul[aria-label='검색 결과'] a")?.getAttribute('href') ?? null,
);
check('검색 결과 링크가 있음', hit !== null, hit ?? '');
if (hit) {
  await page.click("css=#panel ul[aria-label='검색 결과'] a >> nth=0", { label: '첫 결과 열기' });
  await page.waitForTimeout(2000);
  check('결과를 누르면 그 글이 열림', (await editor()).url === hit.split('#')[0], hit);
  check('창 틀 유지(검색 결과)', await shellKept());
  check('결과를 연 뒤에도 패널이 검색 화면', (await panelView()) === '검색');
  check('결과를 연 뒤에도 검색어가 남음', (await searchInput())?.value === '개발');
  await page.reload();
  await page.waitForTimeout(1500);
  check('새로고침 뒤에도 검색 화면', (await panelView()) === '검색');
  check('새로고침하면 검색어가 비워짐', (await searchInput())?.value === '');
}

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
