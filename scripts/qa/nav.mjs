/**
 * 화면 이동 시나리오(1440px). 홈 → 글 → 개요의 마지막 장 → 뒤로 → 뒤로 → 글 탭 닫기 → 테마 전환 →
 * 다시 글. 패널은 홈에서 프로필, 글에서 탐색기를 보인다. 이어서 홈에서 ⌘P(Ctrl+P) 팔레트로 글을 열고,
 * 다시 열어 Esc로 닫으며 포커스가 돌아오는지, ⌘B로 패널이 여닫히는지 본다.
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

// 단축키: ⌘P(Ctrl+P) 팔레트로 글 열기, 다시 열어 Esc로 닫고 포커스 복귀, ⌘B로 패널 여닫기.
const palette = () =>
  page.evaluate(() => {
    const dialog = document.querySelector("[role='dialog'][aria-label='명령 팔레트']");
    return {
      open: dialog !== null,
      inputFocused: document.activeElement?.hasAttribute('data-palette-input') === true,
      options: dialog ? dialog.querySelectorAll("[role='option']").length : 0,
    };
  });
const focusEditor = () =>
  page.evaluate(() => {
    document.getElementById('editor')?.focus();
    return document.activeElement?.id === 'editor';
  });

await page.click("loc=css:header a[href='/']", { label: '홈으로' });
await page.waitForTimeout(1500);
check('팔레트 전: 홈', (await editor()).url === '/');
await focusEditor();
await page.keyboard.press('ControlOrMeta+P');
await page.waitForTimeout(800);
const opened = await palette();
check('⌘P로 팔레트가 열림', opened.open && opened.inputFocused, JSON.stringify(opened));
const fileName = post.url.split('/').filter(Boolean).pop() ?? '';
await page.keyboard.type(fileName.slice(0, 6));
await page.waitForTimeout(300);
check('입력으로 글이 걸러짐', (await palette()).options >= 1);
await page.keyboard.press('Enter');
await page.waitForTimeout(2000);
check('Enter로 글이 열림', (await editor()).url === post.url);
check('고르면 팔레트가 닫힘', !(await palette()).open);
check('창 틀 유지(팔레트)', await shellKept());

check('에디터에 포커스', await focusEditor());
await page.keyboard.press('ControlOrMeta+P');
await page.waitForTimeout(500);
check('다시 열림', (await palette()).open);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
check('Esc로 닫힘', !(await palette()).open);
check(
  '닫으면 연 자리로 포커스',
  await page.evaluate(() => document.activeElement?.id === 'editor'),
);

const panelShown = () =>
  page.evaluate(() => {
    const panel = document.getElementById('panel');
    return panel ? getComputedStyle(panel).display !== 'none' : false;
  });
check('⌘B 전: 패널이 보임', await panelShown());
await page.keyboard.press('ControlOrMeta+B');
await page.waitForTimeout(300);
check('⌘B로 패널이 닫힘', !(await panelShown()));
await page.keyboard.press('ControlOrMeta+B');
await page.waitForTimeout(300);
check('⌘B로 패널이 다시 열림', await panelShown());

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
