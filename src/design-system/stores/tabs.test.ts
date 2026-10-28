import { describe, expect, it } from 'vitest';
import {
  ROOT_TAB,
  addOrActivate,
  close,
  initialTabs,
  restoreTabs,
  show,
  type TabFile,
  type TabsState,
} from './tabs.logic';

const a: TabFile = { url: '/blog/a/', title: 'A', path: 'posts/2023/a.mdx' };
const b: TabFile = { url: '/blog/b/', title: 'B', path: 'posts/2024/b.mdx' };
const urls = (state: { files: TabFile[] }) => state.files.map((file) => file.url);

describe('addOrActivate', () => {
  it('starts with the root tab open and active', () => {
    expect(urls(initialTabs())).toEqual(['/']);
    expect(initialTabs().active).toBe('/');
  });

  it('appends a new file and makes it active', () => {
    const state = addOrActivate(addOrActivate(initialTabs(), a), b);
    expect(urls(state)).toEqual(['/', '/blog/a/', '/blog/b/']);
    expect(state.active).toBe('/blog/b/');
  });

  it('activates an open file without adding it again or moving it', () => {
    const state = addOrActivate(addOrActivate(addOrActivate(initialTabs(), a), b), a);
    expect(urls(state)).toEqual(['/', '/blog/a/', '/blog/b/']);
    expect(state.active).toBe('/blog/a/');
  });

  it('activates the root tab instead of adding it', () => {
    const state = addOrActivate(addOrActivate(initialTabs(), a), ROOT_TAB);
    expect(urls(state)).toEqual(['/', '/blog/a/']);
    expect(state.active).toBe('/');
  });
});

describe('close', () => {
  const open = addOrActivate(addOrActivate(initialTabs(), a), b);

  it('moves to the left tab when the active tab closes', () => {
    const { state, next } = close(open, '/blog/b/');
    expect(urls(state)).toEqual(['/', '/blog/a/']);
    expect(next).toBe('/blog/a/');
    expect(state.active).toBe('/blog/a/');
  });

  it('moves to the root tab when the last opened file closes', () => {
    const { state, next } = close(close(open, '/blog/b/').state, '/blog/a/');
    expect(urls(state)).toEqual(['/']);
    expect(next).toBe('/');
  });

  it('keeps the active tab when another tab closes', () => {
    const { state, next } = close(open, '/blog/a/');
    expect(urls(state)).toEqual(['/', '/blog/b/']);
    expect(next).toBe('/blog/b/');
  });

  it('refuses to close the root tab', () => {
    expect(close(open, '/')).toEqual({ state: open, next: '/blog/b/' });
  });

  it('ignores a tab that is not open', () => {
    expect(close(open, '/blog/z/')).toEqual({ state: open, next: '/blog/b/' });
  });
});

/** 차례로 보인 각 단계의 펼침 여부. `close:<url>`은 그 탭을 닫고 닫은 뒤의 활성 탭을 보인다. */
function unfolds(start: TabsState, steps: (TabFile | `close:${string}`)[]): boolean[] {
  let state = start;
  return steps.map((step) => {
    let file = step;
    if (typeof file === 'string') {
      const closed = close(state, file.slice('close:'.length));
      state = closed.state;
      file = state.files.find((tab) => tab.url === closed.next) ?? ROOT_TAB;
    }
    const result = show(state, file);
    state = result.state;
    return result.unfold;
  });
}

describe('show', () => {
  const home = show(initialTabs(), ROOT_TAB).state;

  it('unfolds only when a new tab is first shown', () => {
    // 처음 열기 → 다른 탭 → 돌아오기 → 닫기 → 다시 열기
    expect(unfolds(home, [a, b, a, 'close:/blog/a/', a])).toEqual([true, true, false, false, true]);
  });

  it('unfolds the root tab once', () => {
    expect(unfolds(initialTabs(), [ROOT_TAB, a, ROOT_TAB, 'close:/blog/a/'])).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });

  it('unfolds a tab that was opened but not yet shown', () => {
    expect(unfolds(addOrActivate(home, a), [a, a])).toEqual([true, false]);
  });

  it('opens and activates the file like addOrActivate', () => {
    const { state } = show(show(home, a).state, b);
    expect(urls(state)).toEqual(['/', '/blog/a/', '/blog/b/']);
    expect(state.active).toBe('/blog/b/');
  });
});

describe('restoreTabs', () => {
  it('rebuilds a saved session behind the root tab', () => {
    const state = restoreTabs({ files: [a, b], active: '/blog/a/' });
    expect(urls(state)).toEqual(['/', '/blog/a/', '/blog/b/']);
    expect(state.active).toBe('/blog/a/');
  });

  it('drops malformed entries, duplicates and root tab copies', () => {
    const state = restoreTabs({ files: [a, { url: 3 }, a, ROOT_TAB, null, b], active: '/nope/' });
    expect(urls(state)).toEqual(['/', '/blog/a/', '/blog/b/']);
    expect(state.active).toBe('/');
  });

  it('does not unfold restored tabs after a reload', () => {
    const before = show(show(show(initialTabs(), ROOT_TAB).state, a).state, b).state;
    const reloaded = restoreTabs(JSON.parse(JSON.stringify(before)));
    expect(unfolds(reloaded, [b, a, ROOT_TAB])).toEqual([false, false, false]);
  });

  it('keeps an opened but unshown tab unshown across a reload', () => {
    const before = addOrActivate(show(initialTabs(), ROOT_TAB).state, a);
    expect(unfolds(restoreTabs(JSON.parse(JSON.stringify(before))), [a])).toEqual([true]);
  });

  it('treats entries saved without the shown mark as already shown', () => {
    const legacy = { files: [ROOT_TAB, a], active: '/blog/a/' };
    expect(unfolds(restoreTabs(legacy), [a, ROOT_TAB, b])).toEqual([false, false, true]);
  });

  it('starts fresh from anything else', () => {
    expect(restoreTabs(null)).toEqual(initialTabs());
    expect(restoreTabs('{"files":')).toEqual(initialTabs());
  });
});
