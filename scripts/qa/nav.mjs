/**
 * 화면 이동 시나리오(1440px). 홈 → 글 → 개요의 마지막 장 → 뒤로 → 뒤로 → 글 탭 닫기 → 테마 전환 →
 * 다시 글. 패널은 홈에서 프로필, 글에서 탐색기를 보인다. 이어서 펼침이 탭이 새로 생겨 처음 보일 때만
 * 일어나는지(처음 열기 → 다른 탭 → 돌아오기 → 닫기 → 다시 열기) 에디터 루트의 펼침 표시로 본다.
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
  // 펼침 표시(에디터 루트의 `data-unfold`)가 붙은 파일 URL을 모은다. 표시는 애니메이션이 끝나면 걷히므로
  // 단계가 끝난 뒤 속성을 읽지 않고 붙는 순간을 기록한다. <body>는 화면마다 바뀌니 <html>을 본다.
  window.qaUnfolds = [];
  new MutationObserver((records) => {
    for (const { target } of records) {
      if (target.id === 'editor' && target.hasAttribute('data-unfold'))
        window.qaUnfolds.push(target.dataset.fileUrl);
    }
  }).observe(document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: ['data-unfold'],
  });
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

// 펼침은 탭이 새로 생겨 처음 보일 때만 일어난다. 처음 열기 → 다른 탭 → 돌아오기 → 닫기 → 다시 열기가
// 펼침/펼침/없음/없음/펼침이고, 홈(`posts.log`)과 뒤로 가기는 펼치지 않는다.
async function unfoldStep(label, action, expected = null) {
  await page.evaluate(() => {
    window.qaUnfolds = [];
  });
  await action();
  await page.waitForTimeout(2000);
  const got = await page.evaluate(() => window.qaUnfolds.slice());
  const ok = expected ? got.length === 1 && got[0] === expected : got.length === 0;
  check(`펼침 ${label}`, ok, got.length ? got.join(', ') : '없음');
}
const clickTab = (url) =>
  page.click(`loc=css:nav[aria-label='열린 파일'] a[href='${url}']`, { label: `${url} 탭` });

// 글이 한 편뿐일 수 있어 글에 달린 태그 화면 두 개를 새 파일로 쓴다.
await unfoldStep('없음(홈으로)', () => clickTab('/'));
await unfoldStep('없음(열린 글로)', () => clickTab(post.url));
const tagLinks = await page.evaluate(() =>
  [...document.querySelectorAll("#editor a[href^='/blog/tags/']")]
    .map((link) => link.getAttribute('href'))
    .filter((href) => href !== '/blog/tags/'),
);
const [first, second] = [...new Set(tagLinks)];
check('펼침 확인용 태그 화면 두 개', Boolean(first && second), `${first}, ${second}`);
if (first && second) {
  const openFromPost = async (url) => {
    await clickTab(post.url);
    await page.waitForTimeout(1500);
    await page.click(`loc=css:#editor a[href='${url}']`, { label: `${url} 열기` });
  };
  await unfoldStep('처음 열기', () => openFromPost(first), first);
  const firstTitle = (await editor()).title;
  await unfoldStep('다른 탭', () => openFromPost(second), second);
  await unfoldStep('돌아오기(탭)', () => clickTab(first));
  await unfoldStep('없음(뒤로)', () => page.evaluate(() => history.back()));
  await unfoldStep('없음(앞으로)', () => page.evaluate(() => history.forward()));
  await unfoldStep('닫기', () =>
    page.click(`loc=css:button[aria-label='${firstTitle} 닫기']`, { label: '탭 닫기' }),
  );
  await unfoldStep('다시 열기', () => openFromPost(first), first);
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
