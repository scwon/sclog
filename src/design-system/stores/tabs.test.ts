import { describe, expect, it } from 'vitest';
import {
  POSTS_LOG,
  addOrActivate,
  close,
  initialTabs,
  restoreTabs,
  type TabFile,
} from './tabs.logic';

const a: TabFile = { url: '/blog/a/', title: 'A', path: 'posts/2023/a.mdx' };
const b: TabFile = { url: '/blog/b/', title: 'B', path: 'posts/2024/b.mdx' };
const urls = (state: { files: TabFile[] }) => state.files.map((file) => file.url);

describe('addOrActivate', () => {
  it('starts with posts.log open and active', () => {
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

  it('activates posts.log instead of adding it', () => {
    const state = addOrActivate(addOrActivate(initialTabs(), a), POSTS_LOG);
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

  it('moves to posts.log when the last opened file closes', () => {
    const { state, next } = close(close(open, '/blog/b/').state, '/blog/a/');
    expect(urls(state)).toEqual(['/']);
    expect(next).toBe('/');
  });

  it('keeps the active tab when another tab closes', () => {
    const { state, next } = close(open, '/blog/a/');
    expect(urls(state)).toEqual(['/', '/blog/b/']);
    expect(next).toBe('/blog/b/');
  });

  it('refuses to close posts.log', () => {
    expect(close(open, '/')).toEqual({ state: open, next: '/blog/b/' });
  });

  it('ignores a tab that is not open', () => {
    expect(close(open, '/blog/z/')).toEqual({ state: open, next: '/blog/b/' });
  });
});

describe('restoreTabs', () => {
  it('rebuilds a saved session behind posts.log', () => {
    const state = restoreTabs({ files: [a, b], active: '/blog/a/' });
    expect(urls(state)).toEqual(['/', '/blog/a/', '/blog/b/']);
    expect(state.active).toBe('/blog/a/');
  });

  it('drops malformed entries, duplicates and posts.log copies', () => {
    const state = restoreTabs({ files: [a, { url: 3 }, a, POSTS_LOG, null, b], active: '/nope/' });
    expect(urls(state)).toEqual(['/', '/blog/a/', '/blog/b/']);
    expect(state.active).toBe('/');
  });

  it('starts fresh from anything else', () => {
    expect(restoreTabs(null)).toEqual(initialTabs());
    expect(restoreTabs('{"files":')).toEqual(initialTabs());
  });
});
