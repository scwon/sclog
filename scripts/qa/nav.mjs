/**
 * 화면 이동 시나리오(1440px). 홈 → 글 → 개요의 마지막 장 → 뒤로 → 뒤로 → 글 탭 닫기 → 테마 전환 →
 * 다시 글. 패널은 홈에서 프로필, 글에서 탐색기를 보인다. 이어서 홈에서 ⌘P(Ctrl+P) 팔레트로 글을 열고,
 * 다시 열어 Esc로 닫으며 포커스가 돌아오는지, ⌘B로 패널이 여닫히는지 본다. 그다음 태그 화면에서 고른 패널
 * 화면이 새로고침 뒤에도 남는지 본다. 이어서 펼침이 탭이 새로 생겨 처음 보일 때만 일어나는지(처음 열기 → 다른 탭 → 돌아오기 → 닫기 → 다시 열기)
 * 에디터 루트의 펼침 표시로 본다.
 * 글에서 장 주소 복사(키보드)와 장 주소로 들어오기를 본다.
 * 끝으로 글 끝까지 읽으면 탐색기에 `✓`가 붙고 새로고침 뒤에도 남는지, 프로필의 `기록 지우기`로 사라지는지 본다.
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
  for (const key of ['theme', 'read', 'position']) localStorage.removeItem(key);
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
// 팔레트로 글을 열어 패널이 탐색기가 됐다. 아래 마지막 패널 화면 단계는 프로필을 고른 상태에서 시작한다.
await page.click("loc=css:nav[aria-label='활동 막대'] button[aria-label='프로필']", {
  label: '프로필 다시 고르기',
});
await page.waitForTimeout(300);
check('팔레트 뒤 프로필을 다시 고름', (await panelView()) === '프로필');
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

// 글이 한 편뿐일 수 있어 글에 달린 태그 화면 중 아직 열리지 않은 두 개를 새 파일로 쓴다.
// 패널 블록이 새로고침했으므로 여기서 관찰자를 단다.
await page.evaluate(() => {
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
await unfoldStep('없음(홈으로)', () => clickTab('/'));
await unfoldStep('없음(열린 글로)', () => clickTab(post.url));
const tagLinks = await page.evaluate(() =>
  [...document.querySelectorAll("#editor a[href^='/blog/tags/']")]
    .map((link) => link.getAttribute('href'))
    .filter((href) => href !== '/blog/tags/'),
);
const openUrls = await page.evaluate(() =>
  [...document.querySelectorAll("nav[aria-label='열린 파일'] li[data-url]")].map(
    (item) => item.dataset.url,
  ),
);
const [first, second] = [...new Set(tagLinks)].filter((href) => !openUrls.includes(href));
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

// 장 주소: 버튼을 키보드로 눌러 상태줄 알림·해시·강조를 보고, 그 주소로 들어와 강조를 본다.
await page.goto(`${QA.base}${post.url}`);
await page.waitForTimeout(1500);
const chapters = await page.evaluate(() =>
  JSON.parse(document.getElementById('editor-outline')?.textContent ?? '[]').map(({ id }) => id),
);
const copyId = chapters[1] ?? chapters[0];
const arriveId = chapters[0];
if (copyId) {
  const button = `[data-chapter-link="${copyId}"]`;
  await page.focus(button);
  await page.press(button, 'Enter');
  await page.waitForTimeout(300);
  const copied = await page.evaluate(() => ({
    hash: decodeURIComponent(location.hash.slice(1)),
    linked: [...document.querySelectorAll('.is-linked')].map((heading) => heading.id),
    notice: document.querySelector('footer [aria-live]')?.textContent ?? '',
    routerState: typeof history.state?.index === 'number',
  }));
  check('장 주소 복사: 해시가 그 장', copied.hash === copyId, copied.hash);
  check(
    '장 주소 복사: 상태줄 알림',
    copied.notice === `✓ 주소 복사됨 · #${copyId}` || copied.notice === '주소창에 넣었습니다',
    copied.notice,
  );
  check('장 주소 복사: 그 장이 강조됨', copied.linked.join() === copyId, copied.linked.join());
  check('장 주소 복사: 화면 이동 기록 유지', copied.routerState);

  await page.goto(`${QA.base}/`);
  await page.goto(`${QA.base}${post.url}#${encodeURIComponent(arriveId)}`);
  await page.waitForTimeout(1500);
  const arrived = await page.evaluate(() =>
    [...document.querySelectorAll('.is-linked')].map((heading) => heading.id),
  );
  check('장 주소로 들어오면 그 장이 강조됨', arrived.join() === arriveId, arrived.join());
}

// 읽기 기록: 글 끝까지 스크롤하면 읽은 글이 되어 탐색기에 `✓`가 붙고, 다음 방문(새로고침)에도 남으며,
// 프로필의 `기록 지우기`를 누르면 꼬리표와 저장값이 바로 사라진다.
/** 탐색기에서 그 글 줄의 꼬리표(스크린 리더 글자). 없으면 빈 문자열. */
const explorerMark = (url) =>
  page.evaluate(
    (href) =>
      document.querySelector(`#panel a[href="${href}"] .sr-only`)?.textContent?.trim() ?? '',
    url,
  );
/** 패널이 탐색기가 아니면 활동 막대에서 탐색기를 고른다. */
const showExplorer = async () => {
  if ((await panelView()) !== '탐색기')
    await page.click("loc=css:nav[aria-label='활동 막대'] button[aria-label='탐색기']", {
      label: '탐색기 고르기',
    });
  await page.waitForTimeout(300);
};
await page.goto(QA.base + post.url);
await page.waitForTimeout(1500);
await page.evaluate(() => {
  window.scrollTo(0, document.documentElement.scrollHeight);
  return true;
});
await page.waitForTimeout(800);
await showExplorer();
check('글 끝까지 읽으면 탐색기에 ✓', (await explorerMark(post.url)) === '읽음');
await page.reload();
await page.waitForTimeout(1500);
await showExplorer();
check('읽은 글 표시가 새로고침 뒤에도 남음', (await explorerMark(post.url)) === '읽음');
await page.click("loc=css:nav[aria-label='활동 막대'] button[aria-label='프로필']", {
  label: '프로필 열기',
});
await page.waitForTimeout(300);
await page.click("loc=css:section[aria-labelledby='profile-history'] button", {
  label: '기록 지우기',
});
await page.waitForTimeout(300);
const historyText = await page.evaluate(
  () => document.querySelector("section[aria-labelledby='profile-history'] p")?.textContent ?? '',
);
check('지우면 기록 없음 안내', historyText.includes('남은 읽기 기록이 없습니다'), historyText);
const stored = await page.evaluate(() => [
  localStorage.getItem('read'),
  localStorage.getItem('position'),
]);
check(
  '지우면 두 키가 모두 사라짐',
  stored.every((value) => value === null),
  stored.join(', '),
);
await showExplorer();
check('지우면 탐색기 꼬리표가 사라짐', (await explorerMark(post.url)) === '');

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
  for (const key of ['theme', 'read', 'position']) localStorage.removeItem(key);
  sessionStorage.clear();
});
await task.finish({ keep: [] });
if (failures.length) throw new Error(`이동 시나리오 실패: ${failures.join(', ')}`);
