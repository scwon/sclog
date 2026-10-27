/**
 * 펼침(1440px). 펼침은 탭이 새로 생겨 처음 보일 때만 일어난다. 처음 열기 → 다른 탭 → 돌아오기 → 닫기 → 다시 열기가
 * 펼침/펼침/없음/없음/펼침이고, 홈(`posts.log`)과 이미 열린 탭, 뒤로·앞으로 가기는 펼치지 않는지 에디터 루트의
 * 펼침 표시로 본다. 시작 상태는 `../scenario.mjs`.
 */
import { scenario } from '../scenario.mjs';

const { page, check, navigate, editor, done } = await scenario('unfold');

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

// 준비: 홈에서 첫 글을 열어 글 탭을 만든다(이 펼침은 관찰 전이라 세지 않는다).
await navigate('첫 글 열기', () => page.click('loc=css:.flow-link', { label: '첫 글 열기' }));
const post = await editor();

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
// 글이 한 편뿐일 수 있어 글에 달린 태그 화면 중 아직 열리지 않은 두 개를 새 파일로 쓴다. 홈의 `.flow-link`는 AI 글
// 칸에도 있어 연 글이 어느 폴더든 그 폴더의 태그별 글(`/blog/tags/…`·`/ai-written/tags/…`)을 쓴다.
const tagLinks = await page.evaluate(() =>
  [...document.querySelectorAll("#editor a[href*='/tags/']")]
    .map((link) => link.getAttribute('href'))
    .filter((href) => /^\/(blog|ai-written)\/tags\/[^/]+\/$/.test(href)),
);
const openUrls = await page.evaluate(() =>
  [...document.querySelectorAll("nav[aria-label='열린 파일'] li[data-url]")].map(
    (item) => item.dataset.url,
  ),
);
const [first, second] = [...new Set(tagLinks)].filter((href) => !openUrls.includes(href));
check('펼침 확인용 태그 화면 두 개', Boolean(first && second), `${post.url}: ${first}, ${second}`);
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

await done();
