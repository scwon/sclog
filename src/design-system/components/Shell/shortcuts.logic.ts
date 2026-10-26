/**
 * 단축키 판정. DOM을 모르고, 키 이벤트의 모양과 지금 맥락만 받아 창 틀이 할 동작 하나(또는 `null`)를 정한다.
 * 바인딩(`document` 리스너 하나와 동작 실행)은 `Shell.tsx`가 맡는다. 기준은 `docs/agents/shortcuts.md`.
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

/** 창 틀이 붙인 조합 키. `search`가 `null`이면 그 키가 없다. */
export interface ShortcutKeys {
  /** 명령 팔레트 열기. */
  palette: KeyCombo;
  /** 패널 열고 닫기. */
  panel: KeyCombo;
  /** 패널 검색 화면을 열고 입력창에 포커스. */
  search: KeyCombo | null;
}

/**
 * 지금 붙은 조합 키. 판정(`shortcutFor`)·명령 목록·팔레트 안내·활동 막대 툴팁이 모두 이 값을 읽는다.
 * ⌘⇧F를 브라우저가 페이지에 넘기지 않는다고 확인되면 `search`를 `null`로 바꾸는 것으로 키와 표기가 모두 빠진다.
 */
export const SHORTCUT_KEYS: ShortcutKeys = {
  palette: { letter: 'p' },
  panel: { letter: 'b' },
  search: { letter: 'f', shift: true },
};

/** 키를 받은 포커스 대상의 종류. `text`는 입력창·textarea·contenteditable, `palette-input`은 팔레트 입력창이다. */
export type FocusTarget = 'palette-input' | 'text' | 'other';

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
  platform: Platform;
}

/**
 * 창 틀이 할 동작. `swallow`는 브라우저 기본 동작만 막고 아무 일도 하지 않는다(열린 팔레트의 ⌘P, Tab).
 * `null`이 아닌 동작은 모두 기본 동작을 막는다.
 */
export type ShortcutAction =
  | 'open-palette'
  | 'toggle-panel'
  | 'open-search'
  | 'close-palette'
  | 'close-overlay'
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

  // 열린 팔레트는 대화상자라 그 창의 키만 받는다. 나머지 글자는 입력창이 받는다.
  if (context.paletteOpen) {
    if (event.key === 'Escape' && bare(event)) return 'close-palette';
    if (event.key === 'Tab' && !event.metaKey && !event.ctrlKey && !event.altKey) return 'swallow';
    if (command(keys.palette)) return 'swallow';
    if (event.target !== 'palette-input' || !bare(event)) return null;
    if (event.key === 'ArrowUp') return 'palette-prev';
    if (event.key === 'ArrowDown') return 'palette-next';
    if (event.key === 'Enter') return 'palette-pick';
    return null;
  }

  if (event.target !== 'other') return null;
  if (event.key === 'Escape' && bare(event)) return context.overlayOpen ? 'close-overlay' : null;
  if (command(keys.palette)) return 'open-palette';
  if (command(keys.panel)) return 'toggle-panel';
  if (command(keys.search)) return 'open-search';
  return null;
}
