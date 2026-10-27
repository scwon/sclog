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

const closed: ShortcutContext = {
  toolbarOpen: false,
  paletteOpen: false,
  overlayOpen: false,
  findOpen: false,
  findSupported: true,
  platform: 'mac',
};

/** 아무 수정 키도 없고 포커스가 입력창 밖에 있는 키. */
function key(shape: Partial<KeyShape> & Pick<KeyShape, 'key'>): KeyShape {
  return {
    code: '',
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    isComposing: false,
    keyCode: 0,
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

  it('leaves ⌘⌥F to the browser', () => {
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
  it.each(['w', 't', 'n', 'q', 'l', 'r', 'd', '+', '-', '=', '0'])(
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

  it('closes the selection toolbar before every other layer', () => {
    const all: ShortcutContext = {
      ...closed,
      toolbarOpen: true,
      paletteOpen: true,
      overlayOpen: true,
      findOpen: true,
    };
    expect(shortcutFor(key({ key: 'Escape' }), all)).toBe('close-selection-toolbar');
    expect(shortcutFor(key({ key: 'Escape', target: 'palette-input' }), all)).toBe(
      'close-selection-toolbar',
    );
    expect(shortcutFor(key({ key: 'Escape' }), { ...closed, toolbarOpen: true })).toBe(
      'close-selection-toolbar',
    );
  });

  it('leaves Esc to other text fields even with the selection toolbar open', () => {
    const toolbar: ShortcutContext = { ...closed, toolbarOpen: true };
    expect(shortcutFor(key({ key: 'Escape', target: 'text' }), toolbar)).toBeNull();
    expect(shortcutFor(key({ key: 'Escape', shiftKey: true }), toolbar)).toBeNull();
  });

  it('closes the overlay panel when no palette is open', () => {
    expect(shortcutFor(key({ key: 'Escape' }), { ...closed, overlayOpen: true })).toBe(
      'close-overlay',
    );
  });

  it('does nothing when nothing is layered', () => {
    expect(shortcutFor(key({ key: 'Escape' }), closed)).toBeNull();
  });

  it('closes the overlay panel from the search input that ⌘⇧F focused', () => {
    const overlay: ShortcutContext = { ...closed, overlayOpen: true };
    expect(shortcutFor(key({ key: 'Escape', target: 'search-input' }), overlay)).toBe(
      'close-overlay',
    );
  });

  it('leaves Esc to the search input when no overlay is open (clearing the field)', () => {
    expect(shortcutFor(key({ key: 'Escape', target: 'search-input' }), closed)).toBeNull();
  });

  it('takes no other shortcut from the search input', () => {
    const overlay: ShortcutContext = { ...closed, overlayOpen: true };
    for (const letter of ['p', 'b']) {
      expect(
        shortcutFor(key({ key: letter, metaKey: true, target: 'search-input' }), overlay),
      ).toBeNull();
    }
    expect(
      shortcutFor(key({ key: 'Escape', isComposing: true, target: 'search-input' }), overlay),
    ).toBeNull();
  });
});

describe('shortcutFor: ⌘F 찾기 줄', () => {
  const find = { key: 'f', metaKey: true } as const;
  const opened: ShortcutContext = { ...closed, findOpen: true };
  const inFind = { target: 'find-input' } as const;

  it('opens the find widget with ⌘F on a Mac and Ctrl+F elsewhere', () => {
    expect(shortcutFor(key(find), closed)).toBe('find-in-file');
    const other: ShortcutContext = { ...closed, platform: 'other' };
    expect(shortcutFor(key({ key: 'f', ctrlKey: true }), other)).toBe('find-in-file');
    expect(shortcutFor(key(find), other)).toBeNull();
  });

  it('reads the physical key when the layout is not Latin (한글 자판)', () => {
    expect(shortcutFor(key({ key: 'ㄹ', code: 'KeyF', metaKey: true }), closed)).toBe(
      'find-in-file',
    );
  });

  it('keeps ⌘⇧F for the search view', () => {
    expect(shortcutFor(key({ key: 'F', metaKey: true, shiftKey: true }), closed)).toBe(
      'open-search',
    );
  });

  it('leaves ⌘F to the browser when the Custom Highlight API is missing', () => {
    const unsupported: ShortcutContext = { ...closed, findSupported: false };
    expect(shortcutFor(key(find), unsupported)).toBeNull();
    expect(shortcutFor(key({ ...find, target: 'search-input' }), unsupported)).toBeNull();
    expect(
      shortcutFor(key({ ...find, target: 'palette-input' }), { ...unsupported, paletteOpen: true }),
    ).toBeNull();
  });

  it('opens the find widget from the search input and focuses it again from the find input', () => {
    expect(shortcutFor(key({ ...find, target: 'search-input' }), closed)).toBe('find-in-file');
    expect(shortcutFor(key({ ...find, ...inFind }), opened)).toBe('find-in-file');
  });

  it('stays off in other text fields and while composing', () => {
    expect(shortcutFor(key({ ...find, target: 'text' }), closed)).toBeNull();
    expect(shortcutFor(key({ ...find, isComposing: true }), closed)).toBeNull();
  });

  it('only blocks the browser find on ⌘F while the palette is open', () => {
    const palette: ShortcutContext = { ...closed, paletteOpen: true };
    expect(shortcutFor(key({ ...find, target: 'palette-input' }), palette)).toBe('swallow');
  });

  it('goes to the next match on Enter and the previous one on Shift+Enter in the find input', () => {
    expect(shortcutFor(key({ key: 'Enter', ...inFind }), opened)).toBe('find-next');
    expect(shortcutFor(key({ key: 'Enter', shiftKey: true, ...inFind }), opened)).toBe('find-prev');
  });

  it('leaves Enter to the Hangul composition', () => {
    expect(shortcutFor(key({ key: 'Enter', isComposing: true, ...inFind }), opened)).toBeNull();
  });

  it('leaves the Enter that ends a Hangul composition in Safari (keyCode 229) to the input', () => {
    // Safari는 조합을 끝낸 뒤 isComposing=false, keyCode=229인 keydown을 보낸다.
    const ending = { key: 'Enter', isComposing: false, keyCode: 229 };
    expect(shortcutFor(key({ ...ending, ...inFind }), opened)).toBeNull();
    expect(shortcutFor(key({ ...ending, shiftKey: true, ...inFind }), opened)).toBeNull();
    expect(
      shortcutFor(key({ ...ending, target: 'palette-input' }), { ...closed, paletteOpen: true }),
    ).toBeNull();
  });

  it('leaves typed letters and other shortcuts to the find input', () => {
    for (const name of ['a', 'f', ' ', 'Backspace', 'ArrowDown', 'ArrowUp', 'Home']) {
      expect(shortcutFor(key({ key: name, ...inFind }), opened)).toBeNull();
    }
    for (const letter of ['p', 'b']) {
      expect(shortcutFor(key({ key: letter, metaKey: true, ...inFind }), opened)).toBeNull();
    }
    expect(shortcutFor(key({ key: 'Enter', metaKey: true, ...inFind }), opened)).toBeNull();
  });

  it('takes no Enter outside the find input', () => {
    expect(shortcutFor(key({ key: 'Enter' }), opened)).toBeNull();
  });
});

describe('shortcutFor: ⌘G·⇧⌘G 다음·이전 일치', () => {
  const next = { key: 'g', metaKey: true } as const;
  const prev = { key: 'G', metaKey: true, shiftKey: true } as const;
  const opened: ShortcutContext = { ...closed, findOpen: true };

  it('goes to the next match with ⌘G and the previous one with ⇧⌘G on a Mac', () => {
    expect(shortcutFor(key(next), opened)).toBe('find-next');
    expect(shortcutFor(key(prev), opened)).toBe('find-prev');
  });

  it('takes Ctrl+G and Ctrl+Shift+G outside a Mac', () => {
    const other: ShortcutContext = { ...opened, platform: 'other' };
    expect(shortcutFor(key({ key: 'g', ctrlKey: true }), other)).toBe('find-next');
    expect(shortcutFor(key({ key: 'G', ctrlKey: true, shiftKey: true }), other)).toBe('find-prev');
    expect(shortcutFor(key(next), other)).toBeNull();
  });

  it('works while the find widget is closed too (the shell opens it with the last query)', () => {
    expect(shortcutFor(key(next), closed)).toBe('find-next');
    expect(shortcutFor(key(prev), closed)).toBe('find-prev');
  });

  it('takes the keys from the find input', () => {
    expect(shortcutFor(key({ ...next, target: 'find-input' }), opened)).toBe('find-next');
    expect(shortcutFor(key({ ...prev, target: 'find-input' }), opened)).toBe('find-prev');
  });

  it('reads the physical key when the layout is not Latin (한글 자판)', () => {
    expect(shortcutFor(key({ key: 'ㅎ', code: 'KeyG', metaKey: true }), opened)).toBe('find-next');
  });

  it('leaves ⌘G to the browser when the Custom Highlight API is missing', () => {
    const unsupported: ShortcutContext = { ...opened, findSupported: false };
    expect(shortcutFor(key(next), unsupported)).toBeNull();
    expect(shortcutFor(key(prev), unsupported)).toBeNull();
    expect(
      shortcutFor(key({ ...next, target: 'palette-input' }), { ...unsupported, paletteOpen: true }),
    ).toBeNull();
  });

  it('only blocks the browser find on ⌘G while the palette is open', () => {
    const palette: ShortcutContext = { ...closed, paletteOpen: true };
    expect(shortcutFor(key({ ...next, target: 'palette-input' }), palette)).toBe('swallow');
    expect(shortcutFor(key({ ...prev, target: 'palette-input' }), palette)).toBe('swallow');
  });

  it('stays off in the search input, other text fields and while composing', () => {
    expect(shortcutFor(key({ ...next, target: 'search-input' }), opened)).toBeNull();
    expect(shortcutFor(key({ ...next, target: 'text' }), opened)).toBeNull();
    expect(shortcutFor(key({ ...next, isComposing: true }), opened)).toBeNull();
  });

  it('takes nothing once the keys are dropped from the key table', () => {
    const keys = { ...SHORTCUT_KEYS, findNext: null, findPrev: null };
    expect(shortcutFor(key(next), opened, keys)).toBeNull();
    expect(shortcutFor(key(prev), opened, keys)).toBeNull();
  });
});

describe('shortcutFor: Esc와 찾기 줄', () => {
  const opened: ShortcutContext = { ...closed, findOpen: true };

  it('closes the find widget from its input and from the editor', () => {
    expect(shortcutFor(key({ key: 'Escape', target: 'find-input' }), opened)).toBe('close-find');
    expect(shortcutFor(key({ key: 'Escape' }), opened)).toBe('close-find');
  });

  it('closes the palette, then the overlay panel, then the find widget', () => {
    const all: ShortcutContext = { ...opened, paletteOpen: true, overlayOpen: true };
    expect(shortcutFor(key({ key: 'Escape', target: 'palette-input' }), all)).toBe('close-palette');
    const overlay: ShortcutContext = { ...opened, overlayOpen: true };
    expect(shortcutFor(key({ key: 'Escape', target: 'find-input' }), overlay)).toBe(
      'close-overlay',
    );
    expect(shortcutFor(key({ key: 'Escape' }), overlay)).toBe('close-overlay');
  });

  it('leaves Esc to the search input and other text fields', () => {
    expect(shortcutFor(key({ key: 'Escape', target: 'search-input' }), opened)).toBeNull();
    expect(shortcutFor(key({ key: 'Escape', target: 'text' }), opened)).toBeNull();
  });
});
