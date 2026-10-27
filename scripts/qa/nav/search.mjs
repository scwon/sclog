/**
 * 검색 화면(1440px, 이어서 900px). 열기 전에는 색인을 받지 않고, 결과를 누르면 글이 열리며 패널은 검색 화면에
 * 남고 새로고침 뒤에도 검색 화면인지(검색어는 메모리에만 있어 비워진다) 본다. 이어서 좁은 화면에서 마지막 패널
 * 화면이 검색이어도 닫힌 패널은 색인을 받지 않는지, ⌘⇧F·Esc·활동 막대 버튼으로 겹침 패널과 입력창 포커스가
 * 맞는지 본다. 시작 상태는 `../scenario.mjs`.
 */
/* global QA */
import { scenario } from '../scenario.mjs';

const {
  page,
  check,
  until,
  navigate,
  goto,
  reload,
  setWidth,
  editor,
  shellKept,
  panelView,
  panelShown,
  focusEditor,
  homePostUrl,
  pickPanel,
  panelIs,
  searchFocused,
  panelShownIs,
  done,
} = await scenario('search');

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

const postUrl = await homePostUrl();
await goto(QA.base + postUrl);
check('검색 화면을 열기 전에는 색인 요청이 없음', !(await indexRequested()));
await pickPanel('검색', '검색 화면 열기');
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
await setWidth(900);
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
  await pickPanel('검색', `검색 버튼(${round})`);
  check(`좁은 화면: 검색 버튼으로 ${round} 열면 입력창에 포커스`, await searchFocused());
  await pickPanel('검색', `검색 버튼으로 닫기(${round})`);
  await panelShownIs(false);
}
check('좁은 화면: 검색 버튼으로 닫힘', !(await panelShown()));

await done();
