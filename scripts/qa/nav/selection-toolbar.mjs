/**
 * 선택 툴바와 복사 토스트(1440px, 좁은 폭은 390px). 글 본문을 드래그해 선택 툴바(상자와 복사 버튼)가 뜨고, 복사하면
 * 체크로 바뀌고 토스트가 떴다 저절로 닫히며, 선택이 접히거나 화면을 옮기면 걷히는지 본다. 이어서 막 연 글에서 툴바를
 * 그리는 중에 누른 Tab, Esc로 걷히기, Shift+→로 골라 뜨기와 Tab 순서(고른 자리 → 툴바 → 선택 뒤 첫 대상, Shift+Tab으로
 * 고른 자리), 팔레트·찾기 줄이 열리면 걷히기, 화면보다 긴 선택, 좁은 폭에서 상자 안쪽으로 들이기를 본다. 시작 상태는
 * `../scenario.mjs`.
 */
/* global QA */
import { scenario } from '../scenario.mjs';

const { page, check, until, navigate, goto, setWidth, shellKept, homePostUrl, done } =
  await scenario('selection-toolbar');

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
check('선택 툴바 전: 홈에 글 링크가 있음', postUrl !== '');
/**
 * 글을 새로 불러오고 펼침(에디터 루트의 `data-unfold`)이 끝나기를 기다린다. 처음 여는 글은 첫 화면의 블록이 펼쳐지며
 * 움직이므로, 끝나기 전에 잰 블록 위치는 상자를 띄운 뒤와 다르다.
 */
const openPost = async () => {
  await goto(QA.base + postUrl);
  await until(
    '글의 펼침이 끝남',
    () => !document.getElementById('editor')?.hasAttribute('data-unfold'),
  );
};

// 선택 툴바: 본문 문단을 마우스로 드래그하면 고른 줄들을 감싼 상자와 그 오른쪽(끝 줄 높이)의 복사 버튼이 뜬다.
// 상자가 생겨도 본문 블록 위치는 그대로이고 포커스는 버튼으로 가지 않는다. 누르면 고른 글자 그대로 복사되고
// `복사됨`(체크)으로 바뀌며 선택과 툴바가 남는다. 빈 곳을 누르면(선택이 접히면) 걷히고, 위로 드래그하면 버튼이 첫 줄
// 높이다. 화면을 옮기면 층이 사라지고, 돌아와 다시 골라도 툴바는 하나다(툴바는 처음 고를 때 불러오는 청크다).
/** 여러 줄인 본문 문단 하나를 화면 가운데로 옮기고, 드래그할 두 점(첫 글자, 끝 줄의 40% 지점)을 잰다. */
const dragPlan = () =>
  page.evaluate(() => {
    const paragraph = [...document.querySelectorAll('#content > p')].find(
      (p) => p.getClientRects().length > 0 && p.getBoundingClientRect().height > 80,
    );
    if (!paragraph) return null;
    paragraph.scrollIntoView({ block: 'center' });
    const lead = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT).nextNode();
    if (!lead) return null;
    const range = document.createRange();
    range.setStart(lead, 0);
    range.setEnd(lead, 1);
    const glyph = range.getBoundingClientRect();
    const box = paragraph.getBoundingClientRect();
    return {
      top: { x: glyph.left + 1, y: glyph.top + glyph.height / 2 },
      bottom: { x: box.left + box.width * 0.4, y: box.bottom - 10 },
      blocks: [...document.querySelectorAll('.doc-prose > *')].map((block) =>
        Math.round(block.getBoundingClientRect().top + window.scrollY),
      ),
    };
  });
/** 두 점 사이를 마우스로 드래그한다. */
const drag = async (start, to, label) => {
  await page.mouse.move(start.x, start.y, { label: `${label} 시작` });
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { label: `${label} 끝` });
  await page.mouse.up();
};
const toolbarShown = (label) =>
  until(
    label,
    () =>
      document.querySelector('[data-selection-box]') !== null &&
      document.querySelector('[data-selection-toolbar] button[data-action="copy"]') !== null,
  );
const toolbarState = () =>
  page.evaluate(() => {
    const copyButton = '[data-selection-toolbar] button[data-action="copy"]';
    const [box, prose, button] = ['[data-selection-box]', '.doc-prose', copyButton].map(
      (selector) => {
        const r = document.querySelector(selector)?.getBoundingClientRect();
        return r ? { top: r.top, bottom: r.bottom, left: r.left, right: r.right } : null;
      },
    );
    const selection = getSelection();
    const lines = selection?.rangeCount
      ? [...selection.getRangeAt(0).getClientRects()].filter((r) => r.height > 0)
      : [];
    return {
      text: selection?.toString() ?? '',
      box,
      prose,
      button,
      label: document.querySelector(copyButton)?.getAttribute('aria-label') ?? '',
      first: lines.length ? Math.min(...lines.map((r) => r.top)) : 0,
      last: lines.length ? Math.max(...lines.map((r) => r.bottom)) : 0,
      focusInToolbar: document.activeElement?.closest('[data-selection-toolbar]') != null,
      layers: document.querySelectorAll('[data-selection-layer]').length,
      toolbars: document.querySelectorAll('[data-selection-toolbar]').length,
      blocks: [...document.querySelectorAll('.doc-prose > *')].map((block) =>
        Math.round(block.getBoundingClientRect().top + window.scrollY),
      ),
    };
  });
const toolbarGone = (label) =>
  until(
    label,
    () =>
      document.querySelector('[data-selection-box]') === null &&
      document.querySelector('[data-selection-toolbar]') === null,
  );

await openPost();
const plan = await dragPlan();
check('선택 툴바: 드래그할 여러 줄 문단이 있음', plan !== null);
if (plan) {
  await drag(plan.top, plan.bottom, '문단 아래로 드래그');
  await toolbarShown('선택 툴바: 드래그하면 상자와 복사 버튼');
  const shown = await toolbarState();
  check(
    '선택 툴바: 상자가 고른 줄 전체와 본문 단 폭을 감쌈',
    shown.box !== null &&
      shown.prose !== null &&
      shown.box.top <= shown.first &&
      shown.box.bottom >= shown.last &&
      shown.box.left < shown.prose.left &&
      shown.box.right > shown.prose.right,
    JSON.stringify({ box: shown.box, first: shown.first, last: shown.last }),
  );
  check(
    '선택 툴바: 복사 버튼은 상자 오른쪽 바깥, 끝 줄 높이',
    shown.button !== null &&
      shown.box !== null &&
      shown.button.left >= shown.box.right &&
      shown.button.top < shown.last &&
      shown.button.bottom > shown.last - 20,
    JSON.stringify({ button: shown.button, last: shown.last }),
  );
  check('선택 툴바: 버튼 이름 `복사`', shown.label === '복사', shown.label);
  check('선택 툴바: 포커스를 가져가지 않음', !shown.focusInToolbar);
  check(
    '선택 툴바: 상자 전후로 본문 블록 위치가 같음',
    JSON.stringify(shown.blocks) === JSON.stringify(plan.blocks),
    JSON.stringify({ before: plan.blocks, after: shown.blocks }),
  );
  check('선택 툴바: 층과 툴바가 하나', shown.layers === 1 && shown.toolbars === 1);

  // 클립보드에 넣는 글자를 적어 둔다(그대로 쓰기도 한다).
  await page.evaluate(() => {
    const write = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = (text) => {
      window.qaCopied = text;
      return write(text);
    };
  });
  await page.click('[data-selection-toolbar] button[data-action="copy"]', {
    label: '복사 버튼 누르기',
  });
  await until(
    '선택 툴바: 복사하면 `복사됨`',
    () =>
      document
        .querySelector('[data-selection-toolbar] button[data-action="copy"]')
        ?.getAttribute('aria-label') === '복사됨',
  );
  const copied = await toolbarState();
  const copiedText = await page.evaluate(() => window.qaCopied ?? null);
  check('선택 툴바: 복사하면 체크·`복사됨`', copied.label === '복사됨', copied.label);
  check(
    '선택 툴바: 고른 글자가 출처 없이 그대로 복사됨',
    copiedText === shown.text && shown.text.length > 0,
    JSON.stringify({ copiedText: copiedText?.slice(0, 40), text: shown.text.slice(0, 40) }),
  );
  check(
    '선택 툴바: 복사한 뒤에도 선택과 툴바가 남음',
    copied.text === shown.text && copied.toolbars === 1,
  );
  // 토스트: 복사하면 화면 아래 가운데에 `복사했어요`(클립보드가 막히면 ⌘C 안내)가 뜨고 저절로 닫힌다.
  await until('토스트: 복사하면 뜸', () => document.querySelector('[data-slot="toast"]') !== null);
  const toast = await page.evaluate(() => {
    const element = document.querySelector('[data-slot="toast"]');
    const box = element?.getBoundingClientRect();
    return {
      text: element?.textContent ?? '',
      tone: element?.getAttribute('data-tone') ?? null,
      region: element?.closest('[role="region"]')?.getAttribute('aria-label') ?? null,
      centered: box ? Math.abs(box.left + box.width / 2 - innerWidth / 2) < 2 : false,
      aboveStatusBar: box
        ? box.bottom <= (document.querySelector('footer')?.getBoundingClientRect().top ?? 0)
        : false,
    };
  });
  check(
    '토스트: 복사 결과(`복사했어요` 또는 ⌘C 안내)',
    (toast.text === '복사했어요' && toast.tone === 'success') ||
      (/⌘C|Ctrl\+C/.test(toast.text) && toast.tone === 'error'),
    JSON.stringify(toast),
  );
  check(
    '토스트: 이름 있는 영역 안, 상태줄 위 가운데',
    toast.region === '알림' && toast.centered && toast.aboveStatusBar,
    JSON.stringify(toast),
  );
  check(
    '토스트: 저절로 닫힘',
    await until(
      '토스트: 저절로 닫힘',
      () => document.querySelector('[data-slot="toast"]') === null,
    ),
  );

  // 빈 곳(문단 왼쪽 여백 가운데)을 누르면 선택이 접혀 걷힌다.
  await page.mouse.click(plan.top.x + 200, plan.bottom.y + 140, { label: '본문 다른 곳 누르기' });
  check('선택 툴바: 선택이 접히면 걷힘', await toolbarGone('선택 툴바: 선택이 접히면 걷힘'));

  await drag(plan.bottom, plan.top, '문단 위로 드래그');
  await toolbarShown('선택 툴바: 위로 드래그해도 뜸');
  const upward = await toolbarState();
  check(
    '선택 툴바: 위로 드래그하면 버튼이 첫 줄 높이',
    upward.button !== null &&
      upward.button.top < upward.first + 24 &&
      upward.button.bottom > upward.first,
    JSON.stringify({ button: upward.button, first: upward.first }),
  );

  // 창 틀 표시는 `goto`가 글을 불러올 때 달아 두었다.
  await navigate('선택 툴바를 띄운 채 홈으로', () =>
    page.click("loc=css:header a[href='/']", { label: '선택 툴바를 띄운 채 홈으로' }),
  );
  const away = await page.evaluate(() => ({
    layers: document.querySelectorAll('[data-selection-layer]').length,
    toolbars: document.querySelectorAll('[data-selection-toolbar]').length,
  }));
  check(
    '선택 툴바: 화면을 옮기면 상자와 버튼이 사라짐',
    away.layers === 0 && away.toolbars === 0 && (await shellKept()),
    JSON.stringify(away),
  );
  await navigate('선택 툴바: 뒤로 다시 글', () => page.evaluate(() => history.back()));
  const again = await dragPlan();
  if (again) {
    await drag(again.top, again.bottom, '돌아와 다시 드래그');
    await toolbarShown('선택 툴바: 돌아와 다시 고르면 뜸');
    const back = await toolbarState();
    check(
      '선택 툴바: 돌아와 다시 골라도 층과 툴바가 하나',
      back.layers === 1 && back.toolbars === 1,
      JSON.stringify({ layers: back.layers, toolbars: back.toolbars }),
    );
  } else {
    check('선택 툴바: 돌아온 글에 드래그할 문단이 있음', false);
  }
  await page.mouse.click(plan.top.x + 200, plan.bottom.y + 140, { label: '선택 풀기' });
  await toolbarGone('선택 툴바: 끝내며 걷힘');
}

// 선택 툴바의 키보드·Esc·팔레트·찾기·좁은 폭: Esc로 걷히고 고른 글자는 남는다. Shift+→로 골라도 뜨고 포커스는 본문에
// 남으며, 고른 자리에서 Tab 한 번에 툴바로 들어간다. ⌘P로 팔레트를 열거나 ⌘F로 찾기 줄을 열면 걷힌다. 좁은 폭(390px)에서는 버튼이 상자 안쪽 오른쪽 위로 들어오고,
// 화면보다 긴 선택에서는 스크롤해도 버튼이 화면 안에 남는다.
/** 툴바가 화면 안에 있고 상자 안팎 어디에 붙었는지 잰다. */
const toolbarFit = () =>
  page.evaluate(() => {
    const [box, toolbar] = ['[data-selection-box]', '[data-selection-toolbar]'].map((selector) => {
      const r = document.querySelector(selector)?.getBoundingClientRect();
      return r ? { top: r.top, bottom: r.bottom, left: r.left, right: r.right } : null;
    });
    const top = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    return {
      box,
      toolbar,
      screen: { top, bottom: innerHeight, right: document.documentElement.clientWidth },
    };
  });
const onScreen = ({ toolbar, screen }) =>
  toolbar !== null &&
  toolbar.top >= screen.top - 1 &&
  toolbar.bottom <= screen.bottom + 1 &&
  toolbar.right <= screen.right + 1;

await openPost();
// 막 연 글에서는 툴바 청크가 아직 없다. 한 태스크 안에서 고르고(포인터를 누르고 떼고) 바로 Tab을 보내, 툴바를 그리는
// 중에 누른 Tab이 그리기를 마친 뒤 첫 버튼에 닿는지 본다. 판정은 `document`의 keydown 하나가 받으므로 만든 이벤트로 충분하다.
const race = await page.evaluate(() => {
  const paragraph = [...document.querySelectorAll('#content > p')].find(
    (p) => p.getBoundingClientRect().height > 80,
  );
  const lead = paragraph && document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT).nextNode();
  if (!lead) return null;
  paragraph.scrollIntoView({ block: 'center' });
  paragraph.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
  const range = document.createRange();
  range.setStart(lead, 0);
  range.setEnd(lead, Math.min(lead.length, 20));
  getSelection()?.removeAllRanges();
  getSelection()?.addRange(range);
  paragraph.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0 }));
  const drawnAtTab = document.querySelector('[data-selection-toolbar] button') !== null;
  const tab = new KeyboardEvent('keydown', {
    key: 'Tab',
    code: 'Tab',
    bubbles: true,
    cancelable: true,
  });
  document.body.dispatchEvent(tab);
  return { drawnAtTab, taken: tab.defaultPrevented, text: getSelection()?.toString() ?? '' };
});
check(
  '선택 툴바: 막 연 글에서 툴바를 그리는 중에 Tab을 누름',
  race !== null && !race.drawnAtTab && race.taken,
  JSON.stringify(race),
);
check(
  '선택 툴바: 그리는 중에 누른 Tab이 그린 뒤 첫 버튼에 닿음',
  await until(
    '선택 툴바: 그린 뒤 첫 버튼에 포커스',
    () => document.activeElement?.closest('[data-selection-toolbar]') != null,
  ),
);
await page.evaluate(() => {
  getSelection()?.removeAllRanges();
  return true;
});
await toolbarGone('선택 툴바: 그리는 중 Tab 확인 뒤 걷힘');

const keys = await dragPlan();
check('선택 툴바(키보드): 고를 여러 줄 문단이 있음', keys !== null);
if (keys) {
  await drag(keys.top, keys.bottom, 'Esc 앞 드래그');
  await toolbarShown('선택 툴바: Esc 앞에 뜸');
  await page.keyboard.press('Escape');
  check('선택 툴바: Esc로 걷힘', await toolbarGone('선택 툴바: Esc로 걷힘'));
  const keptText = await page.evaluate(() => getSelection()?.toString() ?? '');
  check('선택 툴바: Esc 뒤에도 고른 글자는 남음', keptText.length > 0);

  // 문단 첫 글자 하나만 고른 데서(세 자 미만이라 뜨지 않는다) Shift+→로 넓힌다. 캐럿 브라우징이 꺼진 Chrome은 접힌
  // 선택을 키보드로 넓히지 않으므로 한 글자 선택에서 시작한다. 선택이 잠시 멈춘 뒤 뜬다.
  await page.evaluate(() => {
    const paragraph = [...document.querySelectorAll('#content > p')].find(
      (p) => p.getBoundingClientRect().height > 80,
    );
    const lead = paragraph && document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT).nextNode();
    if (!lead) return false;
    const range = document.createRange();
    range.setStart(lead, 0);
    range.setEnd(lead, 1);
    getSelection()?.removeAllRanges();
    getSelection()?.addRange(range);
    return true;
  });
  await toolbarGone('선택 툴바: 한 글자 선택에서는 뜨지 않음');
  for (let i = 0; i < 8; i++) await page.keyboard.press('Shift+ArrowRight');
  await toolbarShown('선택 툴바: Shift+→로 고르면 뜸');
  const shifted = await toolbarState();
  check(
    '선택 툴바: 키보드로 고르면 뜨고 포커스는 본문에 남음',
    shifted.toolbars === 1 && !shifted.focusInToolbar && shifted.text.length >= 3,
    JSON.stringify({ text: shifted.text, focusInToolbar: shifted.focusInToolbar }),
  );
  // 툴바는 글 끝에 포털되지만, 고른 자리에서 누른 첫 Tab은 창 틀이 툴바 첫 버튼으로 보낸다.
  await page.keyboard.press('Tab');
  const entered = await page.evaluate(
    () => document.activeElement?.closest('[data-selection-toolbar]') != null,
  );
  check('선택 툴바: 고른 자리에서 Tab 한 번에 툴바 버튼에 들어감', entered);

  // 툴바 첫 버튼에서 Shift+Tab을 누르면 고른 글자를 품은 요소로 돌아가고 선택은 남는다. 다시 Tab을 누르면 툴바로 들어간다.
  await page.keyboard.press('Shift+Tab');
  const returned = await page.evaluate(() => {
    const active = document.activeElement;
    const selection = getSelection();
    return {
      active: active?.id || active?.localName || null,
      holds:
        active != null &&
        selection != null &&
        selection.rangeCount > 0 &&
        active.contains(selection.getRangeAt(0).commonAncestorContainer),
      text: selection?.toString() ?? '',
      toolbars: document.querySelectorAll('[data-selection-toolbar]').length,
    };
  });
  check(
    '선택 툴바: 첫 버튼에서 Shift+Tab을 누르면 고른 자리로 돌아가고 선택이 남음',
    returned.holds && returned.text === shifted.text && returned.toolbars === 1,
    JSON.stringify(returned),
  );
  await page.keyboard.press('Tab');
  check(
    '선택 툴바: 돌아온 자리에서 다시 Tab을 누르면 툴바로 들어감',
    await page.evaluate(() => document.activeElement?.closest('[data-selection-toolbar]') != null),
  );

  // 툴바 마지막 버튼에서 Tab을 누르면 문서 순서로 선택 끝 뒤에 오는 첫 Tab 대상(대개 본문 링크)으로 간다.
  const expected = await page.evaluate(() => {
    const selection = getSelection();
    if (!selection?.rangeCount) return null;
    const end = selection.getRangeAt(0).endContainer;
    const stop = [
      ...document.querySelectorAll(
        'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])',
      ),
    ].find(
      (element) =>
        end.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING &&
        !element.contains(end) &&
        !element.closest('[data-selection-toolbar]') &&
        element.checkVisibility({ visibilityProperty: true }),
    );
    if (!stop) return null;
    stop.setAttribute('data-qa-after-selection', '');
    return {
      tag: stop.localName,
      name: (stop.getAttribute('aria-label') ?? stop.textContent ?? '').trim().slice(0, 30),
    };
  });
  await page.keyboard.press('Tab');
  const left = await page.evaluate(() => ({
    reached: document.activeElement?.hasAttribute('data-qa-after-selection') === true,
    active: document.activeElement?.localName ?? null,
    text: getSelection()?.toString() ?? '',
    toolbars: document.querySelectorAll('[data-selection-toolbar]').length,
  }));
  check(
    '선택 툴바: 툴바에서 Tab을 누르면 선택 뒤 첫 대상으로 감',
    expected !== null && left.reached && left.text === shifted.text,
    JSON.stringify({ expected, ...left }),
  );

  // 고른 글자 위에서 누르면 글자 끌어 옮기기가 되므로 선택을 먼저 풀고, 드래그할 자리를 다시 잰다.
  await page.evaluate(() => {
    getSelection()?.removeAllRanges();
    return true;
  });
  await toolbarGone('선택 툴바: 팔레트 앞에 선택을 풀면 걷힘');
  const again = (await dragPlan()) ?? keys;
  await drag(again.top, again.bottom, '팔레트 앞 드래그');
  await toolbarShown('선택 툴바: 팔레트 앞에 뜸');
  await page.keyboard.press('ControlOrMeta+P');
  await paletteFocused();
  check('선택 툴바: 팔레트가 열리면 걷힘', await toolbarGone('선택 툴바: 팔레트가 열리면 걷힘'));
  await page.keyboard.press('Escape');
  check('선택 툴바: 팔레트를 연 뒤 Esc 한 번에 팔레트가 닫힘', await paletteClosed());
  await page.evaluate(() => {
    getSelection()?.removeAllRanges();
    return true;
  });
  await toolbarGone('선택 툴바: ⌘F 앞에 선택을 풀면 걷힘');
  const retake = (await dragPlan()) ?? keys;
  await drag(retake.top, retake.bottom, '⌘F 앞 드래그');
  await toolbarShown('선택 툴바: ⌘F 앞에 뜸');
  await page.keyboard.press('ControlOrMeta+F');
  await page.waitForSelector('loc=css:[data-find-input]', { state: 'visible' });
  check('선택 툴바: 찾기 줄이 열리면 걷힘', await toolbarGone('선택 툴바: 찾기 줄이 열리면 걷힘'));
  await page.keyboard.type('개발');
  await until('찾기 위치 글자(n/m)', () =>
    /^\d+\/\d+$/.test(document.querySelector('search [aria-live="polite"]')?.textContent ?? ''),
  );
  check('선택 툴바: 찾기 줄에 검색하는 동안 다시 뜨지 않음', (await toolbarState()).toolbars === 0);
  await page.keyboard.press('Escape');
  await until('찾기 줄이 닫힘', () => document.querySelector('[data-find-input]') === null);

  // 화면보다 긴 선택: 본문 첫 문단부터 마지막 문단까지 고르고 가운데로 스크롤한다.
  await page.evaluate(() => {
    const blocks = [...document.querySelectorAll('#content > p')];
    const range = document.createRange();
    range.setStart(blocks[0], 0);
    range.setEnd(blocks.at(-1), blocks.at(-1).childNodes.length);
    getSelection()?.removeAllRanges();
    getSelection()?.addRange(range);
    const box = range.getBoundingClientRect();
    scrollTo({ top: scrollY + box.top + box.height / 2 - innerHeight / 2, behavior: 'instant' });
    return true;
  });
  await toolbarShown('선택 툴바: 화면보다 긴 선택에서 뜸');
  const tall = await toolbarFit();
  check(
    '선택 툴바: 화면보다 긴 선택에서도 버튼이 화면 안',
    onScreen(tall) && tall.box !== null && tall.box.bottom - tall.box.top > tall.screen.bottom,
    JSON.stringify(tall),
  );
  await page.evaluate(() => {
    scrollBy({ top: 300, behavior: 'instant' });
    return true;
  });
  check(
    '선택 툴바: 긴 선택을 스크롤해도 버튼이 화면 안',
    await until('선택 툴바: 스크롤 뒤 화면 안', () => {
      const r = document.querySelector('[data-selection-toolbar]')?.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      return r !== undefined && r.top >= top - 1 && r.bottom <= innerHeight + 1;
    }),
  );
  await page.evaluate(() => {
    getSelection()?.removeAllRanges();
    return true;
  });
  await toolbarGone('선택 툴바: 긴 선택을 풀면 걷힘');

  // 좁은 폭: 오른쪽 여백이 툴바 폭보다 좁아 상자 안쪽 오른쪽 위로 들어온다.
  await page.cdp('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const narrow = await dragPlan();
  if (narrow) {
    await drag(narrow.top, narrow.bottom, '좁은 폭 드래그');
    await toolbarShown('선택 툴바: 좁은 폭에서 뜸');
    const fit = await toolbarFit();
    check(
      '선택 툴바: 좁은 폭에서는 버튼이 상자 안쪽 오른쪽 위',
      onScreen(fit) &&
        fit.box !== null &&
        fit.toolbar.right <= fit.box.right &&
        fit.toolbar.left >= fit.box.left &&
        fit.toolbar.top - fit.box.top < 12,
      JSON.stringify(fit),
    );
    await page.keyboard.press('Escape');
    await toolbarGone('선택 툴바: 좁은 폭에서 Esc로 걷힘');
  } else {
    check('선택 툴바: 좁은 폭에서 고를 문단이 있음', false);
  }
  await setWidth(1440);
}

await done();
