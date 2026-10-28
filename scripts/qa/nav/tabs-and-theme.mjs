/**
 * 탭과 테마(1440px). 루트 → `posts/` → 글 → 개요의 마지막 장 → 뒤로 세 번 → 글 탭 닫기 → 테마 전환 → 다시 글 → 프로필.
 * 패널은 루트에서 프로필, 디렉터리 뷰에서는 그대로, 글에서 탐색기를 보이고, 매 단계 창 틀 아일랜드가 같은 요소로 남는지, 탭·상태줄·테마가
 * 맞는지 본다. 시작 상태는 `../scenario.mjs`.
 */
import { scenario } from '../scenario.mjs';

const {
  page,
  check,
  until,
  navigate,
  editor,
  shellKept,
  tabs,
  panelView,
  statusLine,
  pickPanel,
  panelIs,
  tabCount,
  openPostsDir,
  done,
} = await scenario('tabs-and-theme');

check('홈이 루트 /', (await editor()).url === '/');
check('홈은 패널이 프로필', (await panelView()) === '프로필');

await openPostsDir();
await tabCount(2);
const dir = await editor();
check('posts/ 디렉터리 뷰로 이동', dir.kind === 'dir' && dir.url === '/blog/', dir.url);
check('창 틀 유지(루트 → posts/)', await shellKept());
check('디렉터리 뷰는 패널을 그대로(프로필)', (await panelView()) === '프로필');

await navigate('첫 글 열기', () => page.click('loc=css:.flow-file-link', { label: '첫 글 열기' }));
await panelIs('탐색기');
await tabCount(3);
const post = await editor();
check('글로 이동', post.kind === 'post', post.url);
check('창 틀 유지(posts/ → 글)', await shellKept());
check('글은 패널이 탐색기', (await panelView()) === '탐색기');
check('글 탭이 열림', (await tabs()).length === 3, (await tabs()).join(', '));

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
await navigate('뒤로: posts/', () => page.evaluate(() => history.back()));
check('뒤로 두 번이면 posts/', (await editor()).url === '/blog/');
await navigate('뒤로: 홈', () => page.evaluate(() => history.back()));
await panelIs('프로필');
check('뒤로 세 번이면 홈', (await editor()).url === '/');
check('창 틀 유지(뒤로)', await shellKept());
check('홈으로 오면 프로필', (await panelView()) === '프로필');

await page.click(`loc=css:button[aria-label='${post.title} 닫기']`, { label: '글 탭 닫기' });
await tabCount(2);
check('글 탭이 닫힘', (await tabs()).length === 2, (await tabs()).join(', '));

const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
await page.click('loc=css:header button[aria-pressed]', { label: '테마 전환' });
await until(
  '테마가 바뀜',
  (before) => document.documentElement.dataset.theme !== before,
  themeBefore,
);
const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
check('테마가 바뀜', themeBefore !== themeAfter, `${themeBefore} → ${themeAfter}`);

await navigate('posts/ 탭으로', () =>
  page.click("loc=css:nav[aria-label='열린 파일'] a[href='/blog/']", { label: 'posts/ 탭' }),
);
await navigate('글 다시 열기', () =>
  page.click('loc=css:.flow-file-link', { label: '글 다시 열기' }),
);
check('다시 글', (await editor()).url === post.url);
check('창 틀 유지(다시 글)', await shellKept());

await pickPanel('프로필', '프로필 열기');
await panelIs('프로필');
check('글에서도 프로필을 열 수 있음', (await panelView()) === '프로필');
check(
  '테마가 이동 뒤에도 유지',
  (await page.evaluate(() => document.documentElement.dataset.theme)) === themeAfter,
);

await done();
