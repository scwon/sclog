import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * 쿠키를 막은 Chrome처럼 `localStorage`·`sessionStorage`를 읽기만 해도 SecurityError를 던지게 한다.
 * `typeof localStorage`도 getter를 부르므로 던진다.
 */
function blockStorage() {
  for (const name of ['localStorage', 'sessionStorage']) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      get() {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });
  }
}

function unblockStorage() {
  for (const name of ['localStorage', 'sessionStorage']) Reflect.deleteProperty(globalThis, name);
}

/** 키·값을 담는 가짜 저장소. */
function fakeStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

afterEach(() => {
  unblockStorage();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('visitorStorage', () => {
  it('reads and writes JSON values in the browser storage', async () => {
    const storage = fakeStorage();
    vi.stubGlobal('sessionStorage', storage);
    const { visitorStorage } = await import('./storage');
    const session = visitorStorage('session');
    session.write('panel', { v: 1, view: 'search' });
    expect(storage.data.get('panel')).toBe('{"v":1,"view":"search"}');
    expect(session.read('panel')).toEqual({ v: 1, view: 'search' });
    session.remove('panel');
    expect(session.read('panel')).toBeNull();
  });

  it('reads a value that is not JSON as missing', async () => {
    const storage = fakeStorage();
    storage.data.set('tabs', '{broken');
    vi.stubGlobal('sessionStorage', storage);
    const { visitorStorage } = await import('./storage');
    expect(visitorStorage('session').read('tabs')).toBeNull();
  });

  it('keeps values in memory when merely touching the storage throws', async () => {
    blockStorage();
    const { visitorStorage } = await import('./storage');
    const local = visitorStorage('local');
    expect(local.read('read')).toBeNull();
    local.write('read', { v: 1, urls: ['/blog/a/'] });
    expect(local.read('read')).toEqual({ v: 1, urls: ['/blog/a/'] });
    expect(visitorStorage('session').read('read')).toBeNull();
    local.remove('read');
    expect(local.read('read')).toBeNull();
  });

  it('keeps values in memory on the server, where there is no storage', async () => {
    const { visitorStorage } = await import('./storage');
    const session = visitorStorage('session');
    session.write('panel', { v: 1, view: 'profile' });
    expect(session.read('panel')).toEqual({ v: 1, view: 'profile' });
  });
});

describe('storage bindings when the storage is blocked', () => {
  it('start the reading history empty and keep it in memory', async () => {
    blockStorage();
    const { $readingHistory, recordReading, flushReadingHistory } =
      await import('./readingHistory');
    expect($readingHistory.get()).toEqual({ read: [], positions: [] });
    recordReading('/blog/a/', 'one', 30);
    flushReadingHistory();
    expect($readingHistory.get().positions).toHaveLength(1);
  });

  it('start the tabs with posts.log only', async () => {
    blockStorage();
    const { $activeTab, $openTabs, openTab } = await import('./tabs');
    expect(Object.keys($openTabs.get())).toEqual(['/']);
    openTab({ url: '/blog/a/', title: 'A', path: 'posts/2024/a.mdx' });
    expect($activeTab.get()).toBe('/blog/a/');
  });

  it('remember the panel view in memory', async () => {
    blockStorage();
    const { readPanelView, writePanelView } = await import('../components/Shell/panel');
    expect(readPanelView()).toBeNull();
    writePanelView('search');
    expect(readPanelView()).toBe('search');
  });
});
