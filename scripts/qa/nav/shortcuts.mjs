/**
 * 단축키(1440px). 홈에서 ⌘P(Ctrl+P) 팔레트로 글을 열고, 다시 열어 Esc로 닫으며 포커스가 돌아오는지,
 * ⌘⇧F로 검색 화면이 열려 입력창에 포커스가 가는지, ⌘B로 패널이 여닫히는지 본다. 끝으로 팔레트로 연 글에서
 * 프로필을 다시 고를 수 있는지 본다. 시작 상태는 `../scenario.mjs`.
 */
import { scenario } from '../scenario.mjs';

const {
  page,
  check,
  until,
  navigate,
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
} = await scenario('shortcuts');

const palette = () =>
  page.evaluate(() => {
    const dialog = document.querySelector("[role='dialog'][aria-label='명령 팔레트']");
    return {
      open: dialog !== null,
      inputFocused: document.activeElement?.hasAttribute('data-palette-input') === true,
      options: dialog ? dialog.querySelectorAll("[role='option']").length : 0,
    };
  });
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

const postUrl = (await homePostUrl()) ?? '';
check('팔레트 전: 홈', (await editor()).url === '/');
await focusEditor();
await page.keyboard.press('ControlOrMeta+P');
await paletteFocused();
const opened = await palette();
check('⌘P로 팔레트가 열림', opened.open && opened.inputFocused, JSON.stringify(opened));
const fileName = postUrl.split('/').filter(Boolean).pop() ?? '';
await page.keyboard.type(fileName.slice(0, 6));
await until(
  '팔레트 입력창에 입력이 들어감',
  (text) => document.querySelector('[data-palette-input]')?.value === text,
  fileName.slice(0, 6),
);
check('입력으로 글이 걸러짐', (await palette()).options >= 1);
await navigate('팔레트에서 Enter', () => page.keyboard.press('Enter'));
await paletteClosed();
check('Enter로 글이 열림', (await editor()).url === postUrl);
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

check('⌘B 전: 패널이 보임', await panelShown());
await page.keyboard.press('ControlOrMeta+B');
await panelShownIs(false);
check('⌘B로 패널이 닫힘', !(await panelShown()));
await page.keyboard.press('ControlOrMeta+B');
await panelShownIs(true);
check('⌘B로 패널이 다시 열림', await panelShown());

// 팔레트로 연 글에서 패널은 검색 화면이다. 활동 막대에서 프로필을 다시 고를 수 있다.
await pickPanel('프로필', '프로필 다시 고르기');
await panelIs('프로필');
check('팔레트 뒤 프로필을 다시 고름', (await panelView()) === '프로필');

await done();
