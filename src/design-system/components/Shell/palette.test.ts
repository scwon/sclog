import { describe, expect, it } from 'vitest';
import {
  isCommandQuery,
  paletteCommands,
  paletteFiles,
  type PaletteCommandContext,
} from './palette.logic';
import { SHORTCUT_KEYS } from './shortcuts.logic';

/** 탐색기 트리 props(최신 먼저). 시험용 글이다. */
const tree = [
  {
    year: '2024',
    files: [
      { url: '/blog/react-hooks/', title: '훅을 다시 읽다', path: 'posts/2024/react-hooks.mdx' },
      { url: '/blog/hello/', title: '개발자의 React 회고', path: 'posts/2024/hello.mdx' },
    ],
  },
  {
    year: '2023',
    files: [
      {
        url: '/blog/pro-developer-2023-days/',
        title: '프로 개발자 2023일 후기',
        path: 'posts/2023/pro-developer-2023-days.mdx',
      },
      { url: '/blog/my-react/', title: '나의 첫 글', path: 'posts/2023/my-react.mdx' },
    ],
  },
];

const urls = (query: string) => paletteFiles(tree, query).map((file) => file.url);

describe('paletteFiles', () => {
  it('lists every post in tree order for an empty input', () => {
    expect(urls('')).toEqual([
      '/blog/react-hooks/',
      '/blog/hello/',
      '/blog/pro-developer-2023-days/',
      '/blog/my-react/',
    ]);
    expect(urls('   ')).toEqual(urls(''));
  });

  it('gives each row its file name, folder and title', () => {
    expect(paletteFiles(tree, '')[2]).toEqual({
      url: '/blog/pro-developer-2023-days/',
      name: 'pro-developer-2023-days.mdx',
      folder: 'posts/2023',
      title: '프로 개발자 2023일 후기',
    });
  });

  it('ranks names starting with the input, then names containing it, then titles', () => {
    expect(urls('react')).toEqual(['/blog/react-hooks/', '/blog/my-react/', '/blog/hello/']);
  });

  it('keeps tree order inside the same rank', () => {
    expect(urls('개발자')).toEqual(['/blog/hello/', '/blog/pro-developer-2023-days/']);
  });

  it('matches regardless of case and surrounding spaces', () => {
    expect(urls('  REACT ')).toEqual(urls('react'));
  });

  it('matches a syllable still being typed and part of a compound word', () => {
    expect(urls('개바')).toEqual(['/blog/hello/', '/blog/pro-developer-2023-days/']);
    expect(urls('발자')).toEqual(['/blog/hello/', '/blog/pro-developer-2023-days/']);
  });

  it('does not match the folder', () => {
    expect(urls('2023')).toEqual(['/blog/pro-developer-2023-days/']);
    expect(urls('posts')).toEqual([]);
  });

  it('finds nothing for an unknown input', () => {
    expect(urls('zzz')).toEqual([]);
  });
});

describe('isCommandQuery', () => {
  it('switches to command mode only when the input starts with >', () => {
    expect(isCommandQuery('>')).toBe(true);
    expect(isCommandQuery('>테마')).toBe(true);
    expect(isCommandQuery('')).toBe(false);
    expect(isCommandQuery('react')).toBe(false);
    expect(isCommandQuery('a>b')).toBe(false);
  });
});

describe('paletteCommands', () => {
  const withNext: PaletteCommandContext = { hasNextFile: true, platform: 'mac' };
  const labels = (query: string, context = withNext) =>
    paletteCommands(query, context).map((command) => command.label);

  it('lists every command in order with its key for a bare >', () => {
    expect(paletteCommands('>', withNext)).toEqual([
      { id: 'open-file', label: '파일 열기', keys: '⌘P' },
      { id: 'find-in-posts', label: '본문에서 찾기', keys: '⌘⇧F' },
      { id: 'toggle-panel', label: '패널 열고 닫기', keys: '⌘B' },
      { id: 'show-explorer', label: '탐색기 보기', keys: null },
      { id: 'show-profile', label: '프로필 보기', keys: null },
      { id: 'toggle-theme', label: '테마 전환', keys: null },
      { id: 'open-next-file', label: '다음 파일 열기', keys: null },
      { id: 'clear-history', label: '읽기 기록 지우기', keys: null },
    ]);
  });

  it('writes keys for the platform', () => {
    const keys = paletteCommands('>', { ...withNext, platform: 'other' }).map((c) => c.keys);
    expect(keys.slice(0, 3)).toEqual(['Ctrl+P', 'Ctrl+Shift+F', 'Ctrl+B']);
  });

  it('shows 다음 파일 열기 only when the current post has a next file', () => {
    expect(labels('>', { ...withNext, hasNextFile: false })).not.toContain('다음 파일 열기');
    expect(labels('>', { ...withNext, hasNextFile: false })).toHaveLength(7);
    expect(labels('>다음', { ...withNext, hasNextFile: false })).toEqual([]);
  });

  it('filters by the text after > like the file mode, keeping list order', () => {
    expect(labels('>테마')).toEqual(['테마 전환']);
    expect(labels('> 보기 ')).toEqual(['탐색기 보기', '프로필 보기']);
    expect(labels('>파일')).toEqual(['파일 열기', '다음 파일 열기']);
    expect(labels('>열')).toEqual(['파일 열기', '패널 열고 닫기', '다음 파일 열기']);
  });

  it('matches a syllable still being typed', () => {
    expect(labels('>테', withNext)).toEqual(['테마 전환']);
    expect(labels('>기로')).toEqual(['읽기 기록 지우기']);
  });

  it('finds nothing for an unknown command', () => {
    expect(labels('>zzz')).toEqual([]);
  });

  it('leaves the key cell empty once ⌘⇧F is dropped from the key table', () => {
    const [, find] = paletteCommands('>', withNext, { ...SHORTCUT_KEYS, search: null });
    expect(find).toEqual({ id: 'find-in-posts', label: '본문에서 찾기', keys: null });
  });
});
