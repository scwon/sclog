import { describe, expect, it } from 'vitest';
import { fileName, formatSize, openLog, parseEditorFile } from './file.logic';

const post = {
  fileTitle: '프로 개발자 2023일 후기',
  filePath: 'posts/2023/pro-developer-2023-days.mdx',
  fileUrl: '/blog/pro-developer-2023-days/',
  fileKind: 'post',
  fileSize: '23987',
  fileReading: '8',
};

describe('parseEditorFile', () => {
  it('reads the page ↔ shell contract from data-file-* attributes', () => {
    const outline = JSON.stringify([
      { id: '개발자란', text: '개발자란?', children: [{ id: '34년차', text: '3~4년차' }] },
    ]);
    expect(parseEditorFile(post, outline)).toEqual({
      title: '프로 개발자 2023일 후기',
      path: 'posts/2023/pro-developer-2023-days.mdx',
      url: '/blog/pro-developer-2023-days/',
      kind: 'post',
      size: 23987,
      reading: 8,
      summary: undefined,
      outline: [
        { id: '개발자란', text: '개발자란?', children: [{ id: '34년차', text: '3~4년차' }] },
      ],
    });
  });

  it('treats missing numbers, unknown kinds and broken outlines as absent', () => {
    const file = parseEditorFile(
      { fileTitle: '404', filePath: '404', fileUrl: '/404', fileKind: 'weird', fileSize: 'x' },
      '{broken',
    );
    expect(file).toMatchObject({ kind: 'page', size: undefined, reading: undefined, outline: [] });
  });

  it('needs a title, a path and a url', () => {
    expect(parseEditorFile({ fileTitle: 'A', filePath: 'a' }, null)).toBeNull();
  });
});

describe('formatSize', () => {
  it('shows bytes under 1 KB and one decimal above', () => {
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(23987)).toBe('23.4 KB');
    expect(formatSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});

describe('openLog', () => {
  it('prints the open command and a summary of what was opened', () => {
    const file = parseEditorFile(post, null);
    expect(file && openLog(file)).toEqual({
      command: '❯ open posts/2023/pro-developer-2023-days.mdx',
      result: '✓ 열림 · 23.4 KB · 읽는 시간 8분',
    });
  });

  it('uses the page summary when there is no size or reading time', () => {
    const file = parseEditorFile(
      {
        fileTitle: 'posts/',
        filePath: 'posts/',
        fileUrl: '/blog/',
        fileKind: 'dir',
        fileSummary: '글 1편',
      },
      null,
    );
    expect(file && openLog(file)).toEqual({
      command: '❯ open posts/',
      result: '✓ 열림 · 글 1편',
    });
  });

  it('opens the root directory view as `open /`', () => {
    const file = parseEditorFile(
      { fileTitle: '/', filePath: '/', fileUrl: '/', fileKind: 'root', fileSummary: '폴더 2개' },
      null,
    );
    expect(file?.kind).toBe('root');
    expect(file && openLog(file)).toEqual({ command: '❯ open /', result: '✓ 열림 · 폴더 2개' });
  });

  it('still says it opened when there is nothing to summarise', () => {
    const file = parseEditorFile({ fileTitle: '404', filePath: '404', fileUrl: '/404' }, null);
    expect(file && openLog(file).result).toBe('✓ 열림');
  });
});

describe('fileName', () => {
  it('keeps what follows the last slash', () => {
    expect(fileName('posts/2023/pro-developer-2023-days.mdx')).toBe('pro-developer-2023-days.mdx');
    expect(fileName('tags/회고')).toBe('회고');
  });

  it('keeps a path without a folder as it is', () => {
    expect(fileName('404.log')).toBe('404.log');
    expect(fileName('404')).toBe('404');
  });
});
