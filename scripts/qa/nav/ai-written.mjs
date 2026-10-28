/**
 * AI 글 쪽 이동(1440px). 루트의 `ai-written/` 줄 → 폴더 화면(흐름 로그) → AI 글(고정 문구, 경로 표시줄
 * `ai-written`) → 다음 파일(있으면 AI 글) → 글 끝 `ai-written/` 줄로 돌아오기를 화면 이동(`ClientRouter`)으로
 * 거치며 내내 창 틀이 같은 요소로 남는지 본다. 이어서 AI 글을 끝까지 읽은 기록이 새로고침 뒤에도 남고(발행 글
 * 정리 `keepPublishedHistory`가 지우지 않고) 프로필의 `N편 읽음`에 세어지는지 본다. 시작 상태는 `../scenario.mjs`.
 */
/* global QA */
import { scenario } from '../scenario.mjs';

const {
  page,
  check,
  until,
  navigate,
  reload,
  editor,
  shellKept,
  pickPanel,
  panelView,
  panelIs,
  done,
} = await scenario('ai-written');

const AI_POST = /^\/ai-written\/(?!tags\/)[^/]+\/$/;
const AI_DIR = '/ai-written/';
const NOTICE = 'AI가 작성한 글입니다.';

/** 에디터 안의 그 선택자 링크들의 `href`. */
const hrefs = (selector) =>
  page.evaluate(
    (css) => [...document.querySelectorAll(css)].map((link) => link.getAttribute('href')),
    selector,
  );
/** 에디터 안 링크를 화면 가운데로 올린 뒤 누른다. 홈 아래 칸·글 끝 줄은 첫 화면 밖이라 그대로는 다른 요소에 가린다. */
const clickLink = async (css, label) => {
  await page.evaluate((selector) => {
    document.querySelector(selector)?.scrollIntoView({ block: 'center' });
    return true;
  }, css);
  await page.click(`loc=css:${css}`, { label });
};
/** 경로 표시줄 조각 글자들. */
const crumbs = () =>
  page.evaluate(() =>
    [...document.querySelectorAll("ol[aria-label='위치'] li")].map((li) => li.textContent?.trim()),
  );
/** 글 화면의 고정 문구 블록 글자. 없으면 빈 문자열. */
const notice = () =>
  page.evaluate(() => document.querySelector('#editor .doc-notice')?.textContent?.trim() ?? '');
/** 지금 연 AI 글을 확인한다: 고정 문구와 경로 표시줄 첫 조각 `ai-written`. */
const checkAiPost = async (label) => {
  const file = await editor();
  check(`${label}: AI 글 주소`, AI_POST.test(file.url ?? ''), file.url);
  check(`${label}: 고정 문구 보임`, (await notice()) === NOTICE);
  const path = await crumbs();
  check(`${label}: 경로 표시줄 ai-written`, path[0] === 'ai-written', path.join(' › '));
  return file.url;
};

// 1. 루트의 `ai-written/` 줄 → 폴더 화면(흐름 로그).
const folderLine = `#editor a.flow-entry-link[href='${AI_DIR}']`;
check('루트에 ai-written/ 줄', (await hrefs(folderLine)).length === 1);
await navigate('루트 → ai-written/', () => clickLink(folderLine, 'ai-written/ 줄'));
const dir = await editor();
check('ai-written/ 폴더 화면 열림', dir.url === AI_DIR && dir.kind === 'dir', dir.url);
check('창 틀 유지(루트 → ai-written/)', await shellKept());

// 2. 폴더 화면에서 AI 글 열기.
const firstPost = (await hrefs('#editor a.flow-link')).find((href) => AI_POST.test(href ?? ''));
check('ai-written/에 AI 글 줄', Boolean(firstPost), firstPost);
await navigate('ai-written/ → AI 글', () =>
  clickLink(`#editor a.flow-link[href='${firstPost}']`, 'AI 글 열기'),
);
let current = await checkAiPost('첫 AI 글');
check('창 틀 유지(ai-written/ → AI 글)', await shellKept());

// 3. 다음 파일. 같은 폴더 안에서만 이어지므로 AI 글이 한 편뿐이면 다음 파일 줄이 없다. 줄이 있으면 AI 글이다.
const next = await hrefs('#editor li.doc-end-next a.doc-end-link');
check(
  '다음 파일은 없거나 AI 글',
  next.every((href) => AI_POST.test(href ?? '')),
  next.join(', ') || '다음 파일 없음',
);
if (next[0]) {
  await navigate('AI 글 → 다음 파일', () =>
    clickLink('#editor li.doc-end-next a.doc-end-link', '다음 파일'),
  );
  current = await checkAiPost('다음 AI 글');
  check('창 틀 유지(다음 파일)', await shellKept());
}

// 4. 글 끝 이동 줄의 폴더는 `ai-written/`다.
const backLink = `#editor nav[aria-label='글 끝 이동'] a.doc-end-link[href='${AI_DIR}']`;
const backLabel = await page.evaluate(
  (css) => document.querySelector(css)?.textContent?.trim() ?? '',
  backLink,
);
check('글 끝에 ai-written/ 줄', backLabel === 'ai-written/', backLabel);
const postsDir = await hrefs("#editor nav[aria-label='글 끝 이동'] a.doc-end-link[href='/blog/']");
check('글 끝에 posts/ 줄 없음', postsDir.length === 0);
await navigate('AI 글 끝 → ai-written/', () => clickLink(backLink, '글 끝 ai-written/'));
check('ai-written/로 돌아옴', (await editor()).url === AI_DIR);
check('창 틀 유지(글 끝 → ai-written/)', await shellKept());

// 5. 읽기 기록: AI 글을 끝까지 읽은 기록이 새로고침 뒤에도 남고 프로필에서 세어진다.
await navigate('ai-written/ → AI 글(읽기)', () =>
  clickLink(`#editor a.flow-link[href='${current}']`, 'AI 글 다시 열기'),
);
await page.evaluate(() => {
  window.scrollTo(0, document.documentElement.scrollHeight);
  return true;
});
const explorerMarkIs = (url, mark) =>
  until(
    `탐색기 꼬리표가 '${mark}'`,
    ({ href, want }) =>
      (document.querySelector(`#panel a[href="${href}"] .sr-only`)?.textContent?.trim() ?? '') ===
      want,
    { href: url, want: mark },
  );
const showExplorer = async () => {
  if ((await panelView()) !== '탐색기') await pickPanel('탐색기');
  await panelIs('탐색기');
};
await showExplorer();
check('AI 글 끝까지 읽으면 탐색기에 ✓', await explorerMarkIs(current, '읽음'));
await reload();
await showExplorer();
check('AI 글 읽은 표시가 새로고침 뒤에도 남음', await explorerMarkIs(current, '읽음'));
const stored = await page.evaluate(() => localStorage.getItem('read') ?? '');
check('저장값에 AI 글 URL이 남음', stored.includes(current), stored);
await pickPanel('프로필', '프로필 열기');
await panelIs('프로필');
const history = await page.evaluate(
  () => document.querySelector("section[aria-labelledby='profile-history'] p")?.textContent ?? '',
);
check('프로필이 AI 글을 읽은 글로 셈', history.includes('1편 읽음'), history);

await done();
