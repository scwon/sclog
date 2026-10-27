/**
 * 화면 이동 시나리오(1440px). 홈 → 글 → 개요의 마지막 장 → 뒤로 → 뒤로 → 글 탭 닫기 → 테마 전환 →
 * 다시 글. 패널은 홈에서 프로필, 글에서 탐색기를 보인다. 이어서 홈에서 ⌘P(Ctrl+P) 팔레트로 글을 열고,
 * 다시 열어 Esc로 닫으며 포커스가 돌아오는지, ⌘⇧F로 검색 화면이 열려 입력창에 포커스가 가는지, ⌘B로 패널이
 * 여닫히는지 본다. 그다음 태그 화면에서 고른 패널
 * 화면이 새로고침 뒤에도 남는지 본다. 이어서 펼침이 탭이 새로 생겨 처음 보일 때만 일어나는지(처음 열기 → 다른 탭 → 돌아오기 → 닫기 → 다시 열기)
 * 에디터 루트의 펼침 표시로 본다.
 * 글에서 장 주소 복사(키보드)와 장 주소로 들어오기를 본다.
 * 글 가운데 장에서 홈으로 떠났다가 돌아오면 열기 요약 뒤 이어 읽기 버튼이 뜨고, 누르면 그 장으로 가며 사라지는지 본다.
 * 그다음 글 끝까지 읽으면 탐색기에 `✓`가 붙고 새로고침 뒤에도 남는지, 프로필의 `기록 지우기`로 사라지는지 본다.
 * 끝으로 검색 화면에서 결과를 열어도 패널이 검색 화면에 남고 새로고침 뒤에도 남는지 본다. 이어서 글에서 ⌘F로 찾기 줄을 열어
 * 위치 글자·칠하기·Enter·Esc를 보고, 닫힌 채 ⌘G로 마지막 검색어로 열기, 찾기 줄 밖의 ⌘G·⇧⌘G, 고른 글자로 ⌘F, 화면을 옮기면
 * 닫히고 다시 ⌘F에 마지막 검색어가 남는지 본다.
 * 매 단계 창 틀 아일랜드가 같은 요소로 남는지, 탭·상태줄·테마가 맞는지, 콘솔 오류가 없는지 본다.
 * `run.mjs`가 `globalThis.QA = { base }`를 넣고 ego-browser에서 import한다.
 */
/* global QA, taskSpace */
import { waits } from './wait.mjs';

const task = await taskSpace('sclog qa nav');
const page = task.page('p1');
const { until, navigate, goto, reload } = waits(page);
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
/** 패널이 그 화면(`aria-label`)이 될 때까지 기다린다. */
const panelIs = (label) =>
  until(
    `패널이 ${label}`,
    (view) => document.getElementById('panel')?.getAttribute('aria-label') === view,
    label,
  );
/** 열린 파일 탭이 그 수가 될 때까지 기다린다. */
const tabCount = (count) =>
  until(
    `열린 파일 탭 ${count}개`,
    (n) => document.querySelectorAll("nav[aria-label='열린 파일'] a").length === n,
    count,
  );
/** 검색 입력창에 포커스가 올 때까지 기다린다. */
const searchFocused = () =>
  until(
    '검색 입력창에 포커스',
    () => document.activeElement?.matches('#panel input[type=search]') === true,
  );
/** 팔레트가 열려 입력창에 포커스가 올 때까지 기다린다. */
const paletteFocused = () =>
  until(
    '팔레트 입력창에 포커스',
    () => document.activeElement?.hasAttribute('data-palette-input') === true,
  );
/** 명령 팔레트가 닫힐 때까지 기다린다. */
const paletteClosed = () =>
  until(
    '팔레트가 닫힘',
    () => document.querySelector("[role='dialog'][aria-label='명령 팔레트']") === null,
  );
/** 패널이 보이거나(`true`) 숨을(`false`) 때까지 기다린다. */
const panelShownIs = (shown) =>
  until(
    `패널이 ${shown ? '보임' : '숨음'}`,
    (want) => {
      const panel = document.getElementById('panel');
      return (panel ? getComputedStyle(panel).display !== 'none' : false) === want;
    },
    shown,
  );

await page.cdp('Runtime.enable');
await page.cdp('Log.enable');
await page.cdp('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await goto(`${QA.base}/`);
await page.evaluate(() => {
  for (const key of ['theme', 'read', 'position']) localStorage.removeItem(key);
  sessionStorage.clear();
});
await reload();
await panelIs('프로필');
await page.events();
await page.evaluate(() => {
  window.qaShell = document.getElementById('panel')?.closest('astro-island');
});
check('홈이 posts.log', (await editor()).url === '/');
check('홈은 패널이 프로필', (await panelView()) === '프로필');

await navigate('첫 글 열기', () => page.click('loc=css:.flow-link', { label: '첫 글 열기' }));
await panelIs('탐색기');
await tabCount(2);
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
  await until(
    '상태줄이 마지막 장',
    (label) => document.querySelector('footer')?.textContent?.includes(label) === true,
    `${last.no} ${last.text}`,
  );
  const status = await statusLine();
  check('상태줄이 마지막 장', status.includes(`${last.no} ${last.text}`), status);
}

await page.evaluate(() => history.back());
// 같은 글 안의 해시만 걷히는 뒤로 가기는 화면 이동(`astro:page-load`)이 없다.
await until('뒤로: 해시가 걷힘', () => location.hash === '');
await navigate('뒤로: 홈', () => page.evaluate(() => history.back()));
await panelIs('프로필');
check('뒤로 두 번이면 홈', (await editor()).url === '/');
check('창 틀 유지(뒤로)', await shellKept());
check('홈으로 오면 프로필', (await panelView()) === '프로필');

await page.click(`loc=css:button[aria-label='${post.title} 닫기']`, { label: '글 탭 닫기' });
await tabCount(1);
check('글 탭이 닫힘', (await tabs()).length === 1, (await tabs()).join(', '));

const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
await page.click('loc=css:header button[aria-pressed]', { label: '테마 전환' });
await until(
  '테마가 바뀜',
  (before) => document.documentElement.dataset.theme !== before,
  themeBefore,
);
const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
check('테마가 바뀜', themeBefore !== themeAfter, `${themeBefore} → ${themeAfter}`);

await navigate('글 다시 열기', () => page.click('loc=css:.flow-link', { label: '글 다시 열기' }));
check('다시 글', (await editor()).url === post.url);
check('창 틀 유지(다시 글)', await shellKept());

await page.click("loc=css:nav[aria-label='활동 막대'] button[aria-label='프로필']", {
  label: '프로필 열기',
});
await panelIs('프로필');
check('글에서도 프로필을 열 수 있음', (await panelView()) === '프로필');
check(
  '테마가 이동 뒤에도 유지',
  (await page.evaluate(() => document.documentElement.dataset.theme)) === themeAfter,
);

// 단축키: ⌘P(Ctrl+P) 팔레트로 글 열기, 다시 열어 Esc로 닫고 포커스 복귀, ⌘⇧F로 검색 화면, ⌘B로 패널 여닫기.
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

await navigate('홈으로', () => page.click("loc=css:header a[href='/']", { label: '홈으로' }));
check('팔레트 전: 홈', (await editor()).url === '/');
await focusEditor();
await page.keyboard.press('ControlOrMeta+P');
await paletteFocused();
const opened = await palette();
check('⌘P로 팔레트가 열림', opened.open && opened.inputFocused, JSON.stringify(opened));
const fileName = post.url.split('/').filter(Boolean).pop() ?? '';
await page.keyboard.type(fileName.slice(0, 6));
await until(
  '팔레트 입력창에 입력이 들어감',
  (text) => document.querySelector('[data-palette-input]')?.value === text,
  fileName.slice(0, 6),
);
check('입력으로 글이 걸러짐', (await palette()).options >= 1);
await navigate('팔레트에서 Enter', () => page.keyboard.press('Enter'));
await paletteClosed();
check('Enter로 글이 열림', (await editor()).url === post.url);
check('고르면 팔레트가 닫힘', !(await palette()).open);
check('창 틀 유지(팔레트)', await shellKept());

check('에디터에 포커스', await focusEditor());
await page.keyboard.press('ControlOrMeta+P');
await paletteFocused();
check('다시 열림', (await palette()).open);
await page.keyboard.press('Escape');
await paletteClosed();
check('Esc로 닫힘', !(await palette()).open);
check(
  '닫으면 연 자리로 포커스',
  await page.evaluate(() => document.activeElement?.id === 'editor'),
);

// ⌘⇧F(Ctrl+Shift+F): 검색 화면을 열고 입력창에 포커스(검색 화면은 처음 쓸 때 불러오는 청크라 포커스를 기다린다).
await page.keyboard.press('ControlOrMeta+Shift+F');
const searchFocusedByKey = await searchFocused();
check('⌘⇧F로 검색 화면이 열림', (await panelView()) === '검색');
check('⌘⇧F로 검색 입력창에 포커스', searchFocusedByKey);
// 입력창에 포커스가 있으면 단축키가 꺼지므로 ⌘B 전에 에디터로 옮긴다.
check('에디터에 포커스(⌘B 전)', await focusEditor());

const panelShown = () =>
  page.evaluate(() => {
    const panel = document.getElementById('panel');
    return panel ? getComputedStyle(panel).display !== 'none' : false;
  });
check('⌘B 전: 패널이 보임', await panelShown());
await page.keyboard.press('ControlOrMeta+B');
await panelShownIs(false);
check('⌘B로 패널이 닫힘', !(await panelShown()));
await page.keyboard.press('ControlOrMeta+B');
await panelShownIs(true);
check('⌘B로 패널이 다시 열림', await panelShown());
// 팔레트로 글을 열어 패널이 탐색기가 됐다. 아래 마지막 패널 화면 단계는 프로필을 고른 상태에서 시작한다.
await page.click("loc=css:nav[aria-label='활동 막대'] button[aria-label='프로필']", {
  label: '프로필 다시 고르기',
});
await panelIs('프로필');
check('팔레트 뒤 프로필을 다시 고름', (await panelView()) === '프로필');
// 마지막 패널 화면은 세션 동안 남는다. 글에서 고른 프로필이 새로 불러온 태그 화면에 남고, 태그 화면에서
// 탐색기 → 프로필을 골라 새로고침할 때마다 고른 화면이 남는다.
/** 활동 막대에서 화면을 고르고 새로고침한다. */
const pickAndReload = async (label) => {
  await page.click(`loc=css:nav[aria-label='활동 막대'] button[aria-label='${label}']`, {
    label: `${label} 고르기`,
  });
  await panelIs(label);
  await reload();
  // 서버 HTML은 세션의 마지막 화면을 모르므로 하이드레이션 뒤 다시 그려질 때까지 기다린다.
  await panelIs(label);
};
await goto(`${QA.base}/blog/tags/`);
const tagUrl = await page.evaluate(
  () =>
    [...document.querySelectorAll('#editor a[href^="/blog/tags/"]')]
      .filter((a) => a.getAttribute('href') !== '/blog/tags/')
      .map((a) => a.href)[0] ?? null,
);
check('태그 화면 링크가 있음', tagUrl !== null);
if (tagUrl) {
  await goto(tagUrl);
  await panelIs('프로필');
  check('새로 불러온 태그 화면에 마지막 화면(프로필)', (await panelView()) === '프로필');
  await pickAndReload('탐색기');
  check('태그 화면에서 고른 탐색기가 새로고침 뒤 남음', (await panelView()) === '탐색기');
  await pickAndReload('프로필');
  check('태그 화면에서 고른 프로필이 새로고침 뒤 남음', (await panelView()) === '프로필');
}

// 펼침은 탭이 새로 생겨 처음 보일 때만 일어난다. 처음 열기 → 다른 탭 → 돌아오기 → 닫기 → 다시 열기가
// 펼침/펼침/없음/없음/펼침이고, 홈(`posts.log`)과 뒤로 가기는 펼치지 않는다.
// 펼침 표시는 `astro:page-load`에서 바로 붙으므로 그 화면 이동이 끝나기를 기다린다. `prepare`는 같은 기록 안에서
// 먼저 하는 화면 이동이다.
async function unfoldStep(label, action, expected = null, prepare = null) {
  await page.evaluate(() => {
    window.qaUnfolds = [];
  });
  if (prepare) await prepare();
  await navigate(`펼침 ${label}`, action);
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
  const backToPost = () => navigate('글 탭으로', () => clickTab(post.url));
  const openFromPost = (url) =>
    page.click(`loc=css:#editor a[href='${url}']`, { label: `${url} 열기` });
  await unfoldStep('처음 열기', () => openFromPost(first), first, backToPost);
  const firstTitle = (await editor()).title;
  await unfoldStep('다른 탭', () => openFromPost(second), second, backToPost);
  await unfoldStep('돌아오기(탭)', () => clickTab(first));
  await unfoldStep('없음(뒤로)', () => page.evaluate(() => history.back()));
  await unfoldStep('없음(앞으로)', () => page.evaluate(() => history.forward()));
  await unfoldStep('닫기', () =>
    page.click(`loc=css:button[aria-label='${firstTitle} 닫기']`, { label: '탭 닫기' }),
  );
  await unfoldStep('다시 열기', () => openFromPost(first), first, backToPost);
}

// 장 주소: 버튼을 키보드로 눌러 상태줄 알림·해시·강조를 보고, 그 주소로 들어와 강조를 본다.
await goto(`${QA.base}${post.url}`);
const chapters = await page.evaluate(() =>
  JSON.parse(document.getElementById('editor-outline')?.textContent ?? '[]').map(({ id }) => id),
);
const copyId = chapters[1] ?? chapters[0];
const arriveId = chapters[0];
if (copyId) {
  const button = `[data-chapter-link="${copyId}"]`;
  await page.focus(button);
  await page.press(button, 'Enter');
  await until(
    '장 주소 복사: 해시와 상태줄 알림',
    (id) =>
      decodeURIComponent(location.hash.slice(1)) === id &&
      document.querySelector('.is-linked') !== null &&
      (document.querySelector('footer [aria-live]')?.textContent ?? '') !== '',
    copyId,
  );
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

  await goto(`${QA.base}/`);
  await goto(`${QA.base}${post.url}#${encodeURIComponent(arriveId)}`);
  await until('장 주소로 들어오면 강조', () => document.querySelector('.is-linked') !== null);
  const arrived = await page.evaluate(() =>
    [...document.querySelectorAll('.is-linked')].map((heading) => heading.id),
  );
  check('장 주소로 들어오면 그 장이 강조됨', arrived.join() === arriveId, arrived.join());
}

// 이어 읽기: 글 중간(가운데 장)에서 떠났다가 돌아오면 열기 요약 뒤 상태줄에 버튼이 뜨고, 누르면 그 장으로 가며 사라진다.
await goto(`${QA.base}/`);
await page.evaluate(() => {
  for (const key of ['read', 'position']) localStorage.removeItem(key);
  return true;
});
// 기록 스토어는 처음 한 번만 저장소를 읽으므로 새로고침해 빈 기록에서 시작한다.
await reload();
await page.evaluate(() => {
  window.qaShell = document.getElementById('panel')?.closest('astro-island');
  return true;
});
await navigate('글 열기', () =>
  page.click(`loc=css:.flow-link[href="${post.url}"]`, { label: '글 열기' }),
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
    page.click(`loc=css:.flow-link[href="${post.url}"]`, { label: '글 다시 열기' }),
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
  await panelIs('탐색기');
};
/** 탐색기의 그 글 줄 꼬리표가 `mark`가 될 때까지 기다린다. */
const explorerMarkIs = (url, mark) =>
  until(
    `탐색기 꼬리표가 '${mark}'`,
    ({ href, want }) =>
      (document.querySelector(`#panel a[href="${href}"] .sr-only`)?.textContent?.trim() ?? '') ===
      want,
    { href: url, want: mark },
  );
await goto(QA.base + post.url);
await page.evaluate(() => {
  window.scrollTo(0, document.documentElement.scrollHeight);
  return true;
});
await showExplorer();
await explorerMarkIs(post.url, '읽음');
check('글 끝까지 읽으면 탐색기에 ✓', (await explorerMark(post.url)) === '읽음');
await reload();
await showExplorer();
await explorerMarkIs(post.url, '읽음');
check('읽은 글 표시가 새로고침 뒤에도 남음', (await explorerMark(post.url)) === '읽음');
await page.click("loc=css:nav[aria-label='활동 막대'] button[aria-label='프로필']", {
  label: '프로필 열기',
});
await panelIs('프로필');
await page.click("loc=css:section[aria-labelledby='profile-history'] button", {
  label: '기록 지우기',
});
await until(
  '기록 지우기 뒤 안내',
  () =>
    document
      .querySelector("section[aria-labelledby='profile-history'] p")
      ?.textContent?.includes('남은 읽기 기록이 없습니다') === true,
);
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
await explorerMarkIs(post.url, '');
check('지우면 탐색기 꼬리표가 사라짐', (await explorerMark(post.url)) === '');

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
await panelIs('검색');
check('패널이 검색 화면', (await panelView()) === '검색');
check('검색 입력창에 포커스', await searchFocused());
await page.fill('loc=css:#panel input[type=search]', '개발');
await until('검색 요약(n개 파일, n줄)', () =>
  /\d+개 파일, \d+줄/.test(document.getElementById('search-summary')?.textContent ?? ''),
);
check('검색 화면을 열면 색인을 받음', await indexRequested());
const hit = await page.evaluate(
  () => document.querySelector("#panel ul[aria-label='검색 결과'] a")?.getAttribute('href') ?? null,
);
check('검색 결과 링크가 있음', hit !== null, hit ?? '');
if (hit) {
  await navigate('첫 검색 결과 열기', () =>
    page.click("css=#panel ul[aria-label='검색 결과'] a >> nth=0", { label: '첫 결과 열기' }),
  );
  check('결과를 누르면 그 글이 열림', (await editor()).url === hit.split('#')[0], hit);
  check('창 틀 유지(검색 결과)', await shellKept());
  check('결과를 연 뒤에도 패널이 검색 화면', (await panelView()) === '검색');
  check('결과를 연 뒤에도 검색어가 남음', (await searchInput())?.value === '개발');
  await reload();
  await panelIs('검색');
  // 검색 화면은 처음 쓸 때 불러오는 청크라 입력창이 늦게 그려진다.
  await until(
    '새로고침 뒤 검색 입력창',
    () => document.querySelector('#panel input[type=search]') !== null,
  );
  check('새로고침 뒤에도 검색 화면', (await panelView()) === '검색');
  check('새로고침하면 검색어가 비워짐', (await searchInput())?.value === '');
}

// 좁은 화면(900px, 패널이 겹쳐 열린다): 마지막 패널 화면이 검색이어도 패널이 닫혀 있으면 색인을 받지 않는다.
// ⌘⇧F로 겹침 패널과 함께 입력창에 포커스가 가고, 거기서 Esc로 겹침 패널을 닫는다. 활동 막대의 검색 버튼으로
// 두 번째 열 때도 입력창에 포커스가 간다.
await page.cdp('Emulation.setDeviceMetricsOverride', {
  width: 900,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await reload();
check('좁은 화면: 패널이 닫혀 있음', !(await panelShown()));
check('좁은 화면: 닫힌 검색 화면은 색인을 받지 않음', !(await indexRequested()));
check('에디터에 포커스(좁은 화면 ⌘⇧F 전)', await focusEditor());
await page.keyboard.press('ControlOrMeta+Shift+F');
check('좁은 화면: ⌘⇧F로 검색 입력창에 포커스', await searchFocused());
await page.keyboard.press('Escape');
await panelShownIs(false);
check('좁은 화면: 검색 입력창에서 Esc로 겹침 패널이 닫힘', !(await panelShown()));
for (const round of ['처음', '두 번째']) {
  await page.click("loc=css:nav[aria-label='활동 막대'] button[aria-label='검색']", {
    label: `검색 버튼(${round})`,
  });
  check(`좁은 화면: 검색 버튼으로 ${round} 열면 입력창에 포커스`, await searchFocused());
  await page.click("loc=css:nav[aria-label='활동 막대'] button[aria-label='검색']", {
    label: `검색 버튼으로 닫기(${round})`,
  });
  await panelShownIs(false);
}
check('좁은 화면: 검색 버튼으로 닫힘', !(await panelShown()));
await page.cdp('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

// ⌘F(Ctrl+F) 찾기 줄: 글에서 열어 입력창에 포커스 → 검색어 입력 → 위치 글자와 칠한 범위 수 → Enter로 다음 →
// Esc로 닫히고 칠한 것이 사라지며 포커스가 에디터로 돌아온다(찾기 줄은 처음 쓸 때 불러오는 청크라 조금 기다린다).
const findState = () =>
  page.evaluate(() => {
    const input = document.querySelector('[data-find-input]');
    return {
      open: input !== null,
      focused: document.activeElement === input && input !== null,
      role: input
        ? (input.getAttribute('role') ?? (input.type === 'search' ? 'searchbox' : ''))
        : '',
      position: document.querySelector('search [aria-live="polite"]')?.textContent ?? '',
      matches: CSS.highlights.get('find-match')?.size ?? 0,
      current: CSS.highlights.get('find-current')?.size ?? 0,
    };
  });
await goto(QA.base + post.url);
check('찾기 전: 에디터에 포커스', await focusEditor());
await page.keyboard.press('ControlOrMeta+F');
await page.waitForSelector('loc=css:[data-find-input]', { state: 'visible' });
await until(
  '찾기 입력창에 포커스',
  () => document.activeElement?.matches('[data-find-input]') === true,
);
const findOpened = await findState();
check(
  '⌘F로 찾기 줄이 열리고 입력창에 포커스',
  findOpened.open && findOpened.focused && findOpened.role === 'searchbox',
  JSON.stringify(findOpened),
);
await page.keyboard.type('개발');
await until('찾기 위치 글자(n/m)', () =>
  /^\d+\/\d+$/.test(document.querySelector('search [aria-live="polite"]')?.textContent ?? ''),
);
const typed = await findState();
const [at, total] = typed.position.split('/').map(Number);
check(
  '찾기: 위치 글자와 칠한 범위 수가 맞음',
  total > 0 && typed.matches === total && typed.current === 1 && at >= 1,
  JSON.stringify(typed),
);
/** 찾기 위치 글자가 `position`이 될 때까지 기다린다. */
const findPositionIs = (label, position) =>
  until(
    `${label}: 위치 글자 ${position}`,
    (want) => document.querySelector('search [aria-live="polite"]')?.textContent === want,
    position,
  );
/** 찾기 줄이 닫힐 때까지 기다린다. */
const findClosedWait = () =>
  until('찾기 줄이 닫힘', () => document.querySelector('[data-find-input]') === null);
await page.keyboard.press('Enter');
await findPositionIs('찾기 Enter', `${(at % total) + 1}/${total}`);
const stepped = await findState();
check(
  '찾기: Enter로 다음 일치',
  stepped.position === `${(at % total) + 1}/${total}` && stepped.focused,
  `${typed.position} → ${stepped.position}`,
);
await page.keyboard.press('Escape');
await findClosedWait();
const findClosed = await findState();
check(
  '찾기: Esc로 닫히고 칠한 것이 사라짐',
  !findClosed.open && findClosed.matches === 0 && findClosed.current === 0,
  JSON.stringify(findClosed),
);
check(
  '찾기: 닫으면 에디터로 포커스',
  await page.evaluate(() => document.activeElement?.id === 'editor'),
);

// ⌘G·⇧⌘G: 닫힌 찾기 줄은 마지막 검색어로 열리고, 열린 찾기 줄은 입력창 밖(에디터)에서도 다음·이전 일치로 간다.
const findValue = () =>
  page.evaluate(() => {
    const input = document.querySelector('[data-find-input]');
    return input instanceof HTMLInputElement
      ? {
          value: input.value,
          all: input.selectionStart === 0 && input.selectionEnd === input.value.length,
        }
      : null;
  });
await page.keyboard.press('ControlOrMeta+G');
await until('닫힌 채 ⌘G: 찾기 위치 글자(n/m)', () =>
  /^\d+\/\d+$/.test(document.querySelector('search [aria-live="polite"]')?.textContent ?? ''),
);
const reopened = await findState();
check(
  '찾기: 닫힌 채 ⌘G로 마지막 검색어로 열림',
  reopened.open &&
    (await findValue())?.value === '개발' &&
    reopened.matches === total &&
    reopened.current === 1,
  JSON.stringify(reopened),
);
check('찾기 줄 밖에서 ⌘G 전: 에디터에 포커스', await focusEditor());
const [from] = reopened.position.split('/').map(Number);
await page.keyboard.press('ControlOrMeta+G');
await findPositionIs('찾기 줄 밖 ⌘G', `${(from % total) + 1}/${total}`);
const nextByG = await findState();
check(
  '찾기: 찾기 줄 밖에서 ⌘G로 다음 일치',
  nextByG.position === `${(from % total) + 1}/${total}` && !nextByG.focused,
  `${reopened.position} → ${nextByG.position}`,
);
await page.keyboard.press('ControlOrMeta+Shift+G');
await findPositionIs('⇧⌘G', reopened.position);
check('찾기: ⇧⌘G로 이전 일치', (await findState()).position === reopened.position);

// 에디터에서 고른 한 줄 글자가 ⌘F로 검색어가 된다(찾기 줄이 열려 있어도).
const picked = await page.evaluate(() => {
  const walker = document.createTreeWalker(
    document.querySelector('#editor #content') ?? document.getElementById('editor'),
    NodeFilter.SHOW_TEXT,
  );
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const word = /[가-힣A-Za-z]{2,}/.exec(node.textContent ?? '');
    if (!word) continue;
    const range = document.createRange();
    range.setStart(node, word.index);
    range.setEnd(node, word.index + word[0].length);
    getSelection()?.removeAllRanges();
    getSelection()?.addRange(range);
    return word[0];
  }
  return '';
});
await page.keyboard.press('ControlOrMeta+F');
// 열린 찾기 줄은 다음 프레임에 포커스를 준다(ego 탭은 프레임이 느리다).
await until(
  '고른 글자로 ⌘F: 검색어가 들어가고 포커스',
  (word) => {
    const input = document.querySelector('[data-find-input]');
    return (
      input instanceof HTMLInputElement &&
      document.activeElement === input &&
      input.value === word &&
      input.selectionEnd === word.length
    );
  },
  picked,
);
const seeded = await findValue();
check(
  '찾기: 에디터에서 고른 글자가 ⌘F로 검색어가 되고 모두 선택됨',
  picked !== '' && seeded?.value === picked && seeded.all && (await findState()).focused,
  `${picked} → ${JSON.stringify(seeded)}`,
);

// 다른 화면으로 옮기면 찾기 줄이 닫히고 칠한 것이 사라진다. 다시 ⌘F를 누르면 마지막 검색어가 들어 있다.
// 위에서 글을 새로 불러왔으므로 창 틀 아일랜드를 다시 적어 둔다.
await page.evaluate(() => {
  window.qaShell = document.getElementById('panel')?.closest('astro-island');
});
await navigate('찾기 줄을 연 채 홈으로', () =>
  page.click("loc=css:header a[href='/']", { label: '찾기 줄을 연 채 홈으로' }),
);
const afterSwap = await findState();
check(
  '찾기: 화면을 옮기면 찾기 줄이 닫히고 칠한 것이 사라짐',
  (await editor()).url === '/' &&
    !afterSwap.open &&
    afterSwap.matches === 0 &&
    afterSwap.current === 0 &&
    (await shellKept()),
  JSON.stringify(afterSwap),
);
await focusEditor();
await page.keyboard.press('ControlOrMeta+F');
await until('옮긴 뒤 ⌘F: 마지막 검색어가 들어가고 포커스', () => {
  const input = document.querySelector('[data-find-input]');
  return (
    input instanceof HTMLInputElement &&
    document.activeElement === input &&
    input.value !== '' &&
    input.selectionEnd === input.value.length
  );
});
const remembered = await findValue();
check(
  '찾기: 옮긴 뒤 ⌘F에 마지막 검색어가 들어 있음',
  remembered?.value === picked && remembered.all,
  JSON.stringify(remembered),
);
await page.keyboard.press('Escape');
await findClosedWait();

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
