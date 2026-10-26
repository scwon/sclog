import { describe, expect, it } from 'vitest';
import {
  SHORTCUT_KEYS,
  keyLabel,
  platformOf,
  shortcutFor,
  type KeyShape,
  type ShortcutContext,
} from './shortcuts.logic';

describe('platformOf', () => {
  it.each(['MacIntel', 'macOS', 'iPad', 'iPhone'])('reads %s as a Mac (⌘)', (name) => {
    expect(platformOf(name)).toBe('mac');
  });

  it.each(['Win32', 'Windows', 'Linux x86_64', 'Android', ''])('reads "%s" as Ctrl', (name) => {
    expect(platformOf(name)).toBe('other');
  });
});

describe('keyLabel', () => {
  it('writes Mac keys as symbols', () => {
    expect(keyLabel({ letter: 'p' }, 'mac')).toBe('⌘P');
    expect(keyLabel({ letter: 'f', shift: true }, 'mac')).toBe('⌘⇧F');
  });

  it('writes other keys with Ctrl and plus signs', () => {
    expect(keyLabel({ letter: 'b' }, 'other')).toBe('Ctrl+B');
    expect(keyLabel({ letter: 'f', shift: true }, 'other')).toBe('Ctrl+Shift+F');
  });
});

const closed: ShortcutContext = { paletteOpen: false, overlayOpen: false, platform: 'mac' };

/** 아무 수정 키도 없고 포커스가 입력창 밖에 있는 키. */
function key(shape: Partial<KeyShape> & Pick<KeyShape, 'key'>): KeyShape {
  return {
    code: '',
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    isComposing: false,
    target: 'other',
    ...shape,
  };
}

describe('shortcutFor: 붙이는 키', () => {
  it('opens the palette with ⌘P on a Mac', () => {
    expect(shortcutFor(key({ key: 'p', metaKey: true }), closed)).toBe('open-palette');
  });

  it('toggles the panel with ⌘B on a Mac', () => {
    expect(shortcutFor(key({ key: 'b', metaKey: true }), closed)).toBe('toggle-panel');
  });

  it('takes Ctrl, not ⌘, outside a Mac', () => {
    const other: ShortcutContext = { ...closed, platform: 'other' };
    expect(shortcutFor(key({ key: 'p', ctrlKey: true }), other)).toBe('open-palette');
    expect(shortcutFor(key({ key: 'b', ctrlKey: true }), other)).toBe('toggle-panel');
    expect(shortcutFor(key({ key: 'p', metaKey: true }), other)).toBeNull();
  });

  it('takes ⌘, not Ctrl, on a Mac', () => {
    expect(shortcutFor(key({ key: 'p', ctrlKey: true }), closed)).toBeNull();
    expect(shortcutFor(key({ key: 'p', ctrlKey: true, metaKey: true }), closed)).toBeNull();
  });

  it('ignores the key when Shift or Alt is held too', () => {
    expect(shortcutFor(key({ key: 'P', metaKey: true, shiftKey: true }), closed)).toBeNull();
    expect(
      shortcutFor(key({ key: 'π', code: 'KeyP', metaKey: true, altKey: true }), closed),
    ).toBeNull();
  });

  it('reads the physical key when the layout is not Latin (한글 자판)', () => {
    expect(shortcutFor(key({ key: 'ㅔ', code: 'KeyP', metaKey: true }), closed)).toBe(
      'open-palette',
    );
    expect(shortcutFor(key({ key: 'ㅠ', code: 'KeyB', metaKey: true }), closed)).toBe(
      'toggle-panel',
    );
  });
});

describe('shortcutFor: ⌘⇧F 본문에서 찾기', () => {
  it('opens the search view with ⌘⇧F on a Mac and Ctrl+Shift+F elsewhere', () => {
    expect(shortcutFor(key({ key: 'F', metaKey: true, shiftKey: true }), closed)).toBe(
      'open-search',
    );
    const other: ShortcutContext = { ...closed, platform: 'other' };
    expect(shortcutFor(key({ key: 'F', ctrlKey: true, shiftKey: true }), other)).toBe(
      'open-search',
    );
    expect(shortcutFor(key({ key: 'F', metaKey: true, shiftKey: true }), other)).toBeNull();
  });

  it('reads the physical key when the layout is not Latin (한글 자판)', () => {
    expect(
      shortcutFor(key({ key: 'ㄹ', code: 'KeyF', metaKey: true, shiftKey: true }), closed),
    ).toBe('open-search');
  });

  it('leaves ⌘F (find in page) and ⌘⌥F to the browser', () => {
    expect(shortcutFor(key({ key: 'f', metaKey: true }), closed)).toBeNull();
    expect(
      shortcutFor(
        key({ key: 'ƒ', code: 'KeyF', metaKey: true, altKey: true, shiftKey: true }),
        closed,
      ),
    ).toBeNull();
  });

  it('stays off in a text field, while composing and while the palette is open', () => {
    const find = { key: 'F', metaKey: true, shiftKey: true } as const;
    expect(shortcutFor(key({ ...find, target: 'text' }), closed)).toBeNull();
    expect(shortcutFor(key({ ...find, isComposing: true }), closed)).toBeNull();
    expect(
      shortcutFor(key({ ...find, target: 'palette-input' }), { ...closed, paletteOpen: true }),
    ).toBeNull();
  });

  it('takes nothing once the key is dropped from the key table', () => {
    const withoutSearch = { ...SHORTCUT_KEYS, search: null };
    expect(
      shortcutFor(key({ key: 'F', metaKey: true, shiftKey: true }), closed, withoutSearch),
    ).toBeNull();
    expect(shortcutFor(key({ key: 'p', metaKey: true }), closed, withoutSearch)).toBe(
      'open-palette',
    );
  });
});

describe('shortcutFor: 브라우저 키는 브라우저에게', () => {
  it.each(['w', 't', 'n', 'q', 'f', 'l', 'r', 'd', '+', '-', '=', '0'])(
    'leaves ⌘%s to the browser',
    (letter) => {
      expect(shortcutFor(key({ key: letter, metaKey: true }), closed)).toBeNull();
    },
  );

  it('leaves Ctrl+Tab and the developer tools keys to the browser', () => {
    const other: ShortcutContext = { ...closed, platform: 'other' };
    expect(shortcutFor(key({ key: 'Tab', ctrlKey: true }), other)).toBeNull();
    expect(shortcutFor(key({ key: 'I', ctrlKey: true, shiftKey: true }), other)).toBeNull();
    expect(shortcutFor(key({ key: 'F12' }), other)).toBeNull();
    expect(
      shortcutFor(key({ key: 'i', code: 'KeyI', metaKey: true, altKey: true }), closed),
    ).toBeNull();
  });

  it('takes no single-letter keys', () => {
    for (const letter of ['j', 'k', '[', ']', '?', 'p', 'b']) {
      expect(shortcutFor(key({ key: letter }), closed)).toBeNull();
    }
  });
});

describe('shortcutFor: 끄는 때', () => {
  it('stays off while focus is in a text field', () => {
    const typing = { metaKey: true, target: 'text' } as const;
    expect(shortcutFor(key({ key: 'p', ...typing }), closed)).toBeNull();
    expect(shortcutFor(key({ key: 'b', ...typing }), closed)).toBeNull();
    expect(
      shortcutFor(key({ key: 'Escape', target: 'text' }), { ...closed, overlayOpen: true }),
    ).toBeNull();
  });

  it('stays off while a Hangul syllable is being composed', () => {
    expect(shortcutFor(key({ key: 'p', metaKey: true, isComposing: true }), closed)).toBeNull();
    const open: ShortcutContext = { ...closed, paletteOpen: true };
    for (const name of ['Escape', 'ArrowDown', 'ArrowUp', 'Enter']) {
      expect(
        shortcutFor(key({ key: name, isComposing: true, target: 'palette-input' }), open),
      ).toBeNull();
    }
  });
});

describe('shortcutFor: 열린 팔레트', () => {
  const open: ShortcutContext = { ...closed, paletteOpen: true };
  const inPalette = { target: 'palette-input' } as const;

  it('takes Esc, ↑↓ and Enter from the palette input', () => {
    expect(shortcutFor(key({ key: 'Escape', ...inPalette }), open)).toBe('close-palette');
    expect(shortcutFor(key({ key: 'ArrowUp', ...inPalette }), open)).toBe('palette-prev');
    expect(shortcutFor(key({ key: 'ArrowDown', ...inPalette }), open)).toBe('palette-next');
    expect(shortcutFor(key({ key: 'Enter', ...inPalette }), open)).toBe('palette-pick');
  });

  it('leaves typed letters to the palette input', () => {
    for (const letter of ['a', 'p', '>', ' ', 'Backspace', 'ArrowLeft', 'Home']) {
      expect(shortcutFor(key({ key: letter, ...inPalette }), open)).toBeNull();
    }
  });

  it('only blocks printing on ⌘P, without reopening', () => {
    expect(shortcutFor(key({ key: 'p', metaKey: true, ...inPalette }), open)).toBe('swallow');
  });

  it('takes no other shortcut while open', () => {
    expect(shortcutFor(key({ key: 'b', metaKey: true, ...inPalette }), open)).toBeNull();
    expect(shortcutFor(key({ key: 'f', metaKey: true, ...inPalette }), open)).toBeNull();
  });

  it('keeps focus inside the dialog on Tab', () => {
    expect(shortcutFor(key({ key: 'Tab', ...inPalette }), open)).toBe('swallow');
    expect(shortcutFor(key({ key: 'Tab', shiftKey: true, ...inPalette }), open)).toBe('swallow');
  });
});

describe('shortcutFor: Esc는 맨 위 층 하나만 닫는다', () => {
  it('closes the palette before the overlay panel', () => {
    const both: ShortcutContext = { ...closed, paletteOpen: true, overlayOpen: true };
    expect(shortcutFor(key({ key: 'Escape', target: 'palette-input' }), both)).toBe(
      'close-palette',
    );
  });

  it('closes the overlay panel when no palette is open', () => {
    expect(shortcutFor(key({ key: 'Escape' }), { ...closed, overlayOpen: true })).toBe(
      'close-overlay',
    );
  });

  it('does nothing when nothing is layered', () => {
    expect(shortcutFor(key({ key: 'Escape' }), closed)).toBeNull();
  });
});
