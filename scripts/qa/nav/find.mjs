/**
 * 찾기 줄(1440px). 글에서 ⌘F(Ctrl+F)로 찾기 줄을 열어 위치 글자·칠하기·Enter·Esc를 보고, 닫힌 채 ⌘G로 마지막
 * 검색어로 열기, 찾기 줄 밖의 ⌘G·⇧⌘G, 고른 글자로 ⌘F, 화면을 옮기면 닫히고 다시 ⌘F에 마지막 검색어가 남는지
 * 본다. 시작 상태는 `../scenario.mjs`.
 */
/* global QA */
import { scenario } from '../scenario.mjs';

const { page, check, until, navigate, goto, editor, shellKept, focusEditor, homePostUrl, done } =
  await scenario('find');

// ⌘F 찾기 줄: 글에서 열어 입력창에 포커스 → 검색어 입력 → 위치 글자와 칠한 범위 수 → Enter로 다음 →
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
const postUrl = await homePostUrl();
await goto(QA.base + postUrl);
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

await done();
