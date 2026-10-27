/**
 * 단축키 판정. DOM을 모르고, 키 이벤트의 모양과 지금 맥락만 받아 창 틀이 할 동작 하나(또는 `null`)를 정한다.
 * 바인딩(`document` 리스너 하나)은 `shortcuts.ts`, 동작 실행은 `Shell.tsx`가 맡는다. 기준은 `docs/agents/shortcuts.md`.
 */

/** 수정 키를 고르는 플랫폼. 맥(iPad 포함)은 ⌘, 그 밖은 Ctrl이다. */
export type Platform = 'mac' | 'other';

/**
 * 브라우저가 알려 주는 플랫폼 이름(`navigator.userAgentData.platform` 또는 `navigator.platform`)으로 수정 키를 고른다.
 * iPad·iPhone은 맥처럼 ⌘를 쓴다. 서버 HTML에는 넣지 않고 브라우저에서 처음 쓸 때 부른다.
 */
export function platformOf(name: string): Platform {
  return /mac|iphone|ipad|ipod/i.test(name) ? 'mac' : 'other';
}

/** 조합 키 하나. 수정 키(⌘ 또는 Ctrl)는 늘 들어간다. */
export interface KeyCombo {
  /** 라틴 글자 하나(소문자). */
  letter: string;
  shift?: boolean;
}

/** 플랫폼에 맞는 키 표기. 맥은 `⌘⇧F`, 그 밖은 `Ctrl+Shift+F`다. */
export function keyLabel({ letter, shift = false }: KeyCombo, platform: Platform): string {
  const name = letter.toUpperCase();
  if (platform === 'mac') return `⌘${shift ? '⇧' : ''}${name}`;
  return `Ctrl+${shift ? 'Shift+' : ''}${name}`;
}

/** 창 틀이 붙인 조합 키. `search`·`find`·`findNext`·`findPrev`가 `null`이면 그 키가 없다. */
export interface ShortcutKeys {
  /** 명령 팔레트 열기. */
  palette: KeyCombo;
  /** 패널 열고 닫기. */
  panel: KeyCombo;
  /** 패널 검색 화면을 열고 입력창에 포커스. */
  search: KeyCombo | null;
  /** 찾기 줄을 열고 입력창에 포커스. CSS Custom Highlight API가 없으면 판정이 브라우저에 맡긴다. */
  find: KeyCombo | null;
  /** 찾기 줄의 다음 일치. 찾기 줄이 닫혀 있으면 창 틀이 마지막 검색어로 연다. `find`처럼 Highlight API가 있어야 받는다. */
  findNext: KeyCombo | null;
  /** 찾기 줄의 이전 일치. `findNext`와 같다. */
  findPrev: KeyCombo | null;
}

/**
 * 지금 붙은 조합 키. 판정(`shortcutFor`)·명령 목록·팔레트 안내·활동 막대 툴팁이 모두 이 값을 읽는다.
 * ⌘⇧F를 브라우저가 페이지에 넘기지 않는다고 확인되면 `search`를 `null`로 바꾸는 것으로 키와 표기가 모두 빠진다.
 */
export const SHORTCUT_KEYS: ShortcutKeys = {
  palette: { letter: 'p' },
  panel: { letter: 'b' },
  search: { letter: 'f', shift: true },
  find: { letter: 'f' },
  findNext: { letter: 'g' },
  findPrev: { letter: 'g', shift: true },
};

/**
 * 키를 받은 포커스 대상의 종류. `text`는 입력창·textarea·contenteditable, `palette-input`은 팔레트 입력창,
 * `search-input`은 패널 검색 화면의 입력창, `find-input`은 찾기 줄의 입력창이다.
 */
export type FocusTarget = 'palette-input' | 'search-input' | 'find-input' | 'text' | 'other';

/** 판정에 쓰는 키 이벤트의 모양. `KeyboardEvent`에서 그대로 옮긴다. */
export interface KeyShape {
  key: string;
  /** 물리 키(`KeyP`). 한글 자판처럼 `key`가 라틴 글자가 아닐 때 쓴다. */
  code: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  isComposing: boolean;
  target: FocusTarget;
}

/** 지금 창 틀의 맥락. */
export interface ShortcutContext {
  paletteOpen: boolean;
  /** 좁은 화면에서 패널이 에디터 위에 겹쳐 열려 있는가. */
  overlayOpen: boolean;
  /** 찾기 줄이 열려 있는가. */
  findOpen: boolean;
  /** 브라우저에 CSS Custom Highlight API(`CSS.highlights`)가 있는가. 없으면 ⌘F는 브라우저 찾기다. */
  findSupported: boolean;
  platform: Platform;
}

/**
 * 창 틀 명령. 단축키와 팔레트 명령 목록이 같은 이름으로 부르고, 창 틀의 실행 함수 하나가 실행한다.
 * `open-search`는 패널을 검색 화면으로 열고 입력창에 포커스를 준다. `find-in-file`은 찾기 줄을 열고(열려 있으면 그대로)
 * 입력창에 포커스를 주며 글자를 모두 고른다.
 */
export type ShellCommand =
  | 'open-search'
  | 'find-in-file'
  | 'toggle-panel'
  | 'show-explorer'
  | 'show-profile'
  | 'toggle-theme'
  | 'open-next-file'
  | 'clear-history';

/**
 * 창 틀이 할 동작. 붙은 키의 창 틀 명령(`toggle-panel`·`open-search`·`find-in-file`)과 팔레트·겹침 패널·찾기 줄을
 * 다루는 동작이다. `find-next`·`find-prev`는 찾기 줄의 다음·이전 일치로 간다(찾기 입력창의 Enter·Shift+Enter, 어디서나
 * ⌘G·⇧⌘G). 찾기 줄이 닫혀 있으면 창 틀이 마지막 검색어로 열고, 마지막 검색어가 없으면 찾기 줄만 연다.
 * `swallow`는 브라우저 기본 동작만 막고 아무 일도 하지 않는다(열린 팔레트의 ⌘P·⌘F·⌘G·⇧⌘G, Tab).
 * `null`이 아닌 동작은 모두 기본 동작을 막는다.
 */
export type ShortcutAction =
  | Extract<ShellCommand, 'toggle-panel' | 'open-search' | 'find-in-file'>
  | 'open-palette'
  | 'close-palette'
  | 'close-overlay'
  | 'close-find'
  | 'find-next'
  | 'find-prev'
  | 'palette-prev'
  | 'palette-next'
  | 'palette-pick'
  | 'swallow';

/** 키가 가리키는 라틴 글자(소문자). 한글 자판 등에서 `key`가 라틴 글자가 아니면 물리 키로 본다. */
function letterOf({ key, code }: KeyShape): string | null {
  if (/^[a-z]$/i.test(key)) return key.toLowerCase();
  const physical = /^Key([A-Z])$/.exec(code);
  return physical ? physical[1].toLowerCase() : null;
}

/** 플랫폼의 수정 키 하나만 눌렸는가. 맥은 ⌘만, 그 밖은 Ctrl만 받고 Alt가 함께면 받지 않는다. */
function modOnly(event: KeyShape, platform: Platform, shift: boolean): boolean {
  const mod =
    platform === 'mac' ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  return mod && !event.altKey && event.shiftKey === shift;
}

/** 수정 키가 하나도 없는가. */
function bare(event: KeyShape): boolean {
  return !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey;
}

/**
 * 키 하나를 창 틀 동작으로 바꾼다. 받지 않는 키(브라우저 키 포함)는 `null`이다.
 * `keys`는 붙은 조합 키이고 기본값은 `SHORTCUT_KEYS`다.
 */
export function shortcutFor(
  event: KeyShape,
  context: ShortcutContext,
  keys: ShortcutKeys = SHORTCUT_KEYS,
): ShortcutAction | null {
  if (event.isComposing) return null;
  const letter = letterOf(event);
  const command = (combo: KeyCombo | null) =>
    combo !== null &&
    letter === combo.letter &&
    modOnly(event, context.platform, combo.shift ?? false);

  // 찾기 줄은 CSS Custom Highlight API로 칠하므로, 없는 브라우저에서는 ⌘F·⌘G·⇧⌘G를 브라우저 찾기에 맡긴다.
  const find = context.findSupported ? keys.find : null;
  const findNext = context.findSupported ? keys.findNext : null;
  const findPrev = context.findSupported ? keys.findPrev : null;

  // 열린 팔레트는 대화상자라 그 창의 키만 받는다. 나머지 글자는 입력창이 받는다.
  if (context.paletteOpen) {
    if (event.key === 'Escape' && bare(event)) return 'close-palette';
    if (event.key === 'Tab' && !event.metaKey && !event.ctrlKey && !event.altKey) return 'swallow';
    if (command(keys.palette) || command(find) || command(findNext) || command(findPrev))
      return 'swallow';
    if (event.target !== 'palette-input' || !bare(event)) return null;
    if (event.key === 'ArrowUp') return 'palette-prev';
    if (event.key === 'ArrowDown') return 'palette-next';
    if (event.key === 'Enter') return 'palette-pick';
    return null;
  }

  // Esc는 맨 위 층 하나만 닫는다: 겹침 패널, 그다음 찾기 줄. 검색 입력창은 ⌘⇧F가 겹침 패널과 함께 포커스를 주는
  // 곳이라 Esc를 받지만 찾기 줄은 닫지 않는다(겹침 패널이 없으면 입력창이 받아 글자를 지운다). 다른 입력창은 모든
  // 키를 입력창에 맡긴다.
  if (event.key === 'Escape' && bare(event) && event.target !== 'text') {
    if (context.overlayOpen) return 'close-overlay';
    return context.findOpen && event.target !== 'search-input' ? 'close-find' : null;
  }
  // ⌘F는 검색 입력창·찾기 입력창에서도 찾기 줄을 연다(찾기 입력창이면 글자를 모두 고른다).
  if (event.target !== 'text' && command(find)) return 'find-in-file';
  // ⌘G·⇧⌘G는 찾기 입력창과 입력창 밖에서 받는다. 검색 입력창에서는 브라우저에 맡긴다.
  if (event.target === 'find-input' || event.target === 'other') {
    if (command(findNext)) return 'find-next';
    if (command(findPrev)) return 'find-prev';
  }
  if (
    event.target === 'find-input' &&
    event.key === 'Enter' &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey
  )
    return event.shiftKey ? 'find-prev' : 'find-next';
  if (event.target !== 'other') return null;
  if (command(keys.palette)) return 'open-palette';
  if (command(keys.panel)) return 'toggle-panel';
  if (command(keys.search)) return 'open-search';
  return null;
}
