import { describe, expect, it } from 'vitest';
import { paletteFiles } from './palette.logic';

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
