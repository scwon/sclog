import { describe, expect, it } from 'vitest';
import type { TreeRoot } from '@/design-system/components/Shell/Shell';
import { nextFile } from '@/design-system/components/Shell/tree.logic';
import { FOLDER_ROUTES, type Folder } from '@/utils/folder';
import { built, fileUrl, pages } from './dist';

/** 글 끝 이동 줄(`nav.doc-end`)의 줄들: 링크 주소, 라벨, 접근 가능한 이름(`aria-label`), 꼬리표 자리 유무. */
function docEndLines(html: string) {
  const nav = /<nav class="doc-end"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? '';
  return [...nav.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(([, line]) => ({
    href: /<a\b[^>]*\bhref="([^"]*)"/.exec(line)?.[1],
    label: /class="doc-end-label"[^>]*>([^<]*)</.exec(line)?.[1],
    name: /<a\b[^>]*\baria-label="([^"]*)"/.exec(line)?.[1],
    mark: line.includes('data-next-file-mark'),
  }));
}

describe.skipIf(!built)('build output', () => {
  describe('doc end lines', () => {
    const posts = pages
      .map(({ html }) => ({
        html,
        kind: /<main[^>]*\bdata-file-kind="([^"]*)"/.exec(html)?.[1],
        url: fileUrl(html) ?? '',
        title: /<main[^>]*\bdata-file-title="([^"]*)"/.exec(html)?.[1] ?? '',
        path: /<main[^>]*\bdata-file-path="([^"]*)"/.exec(html)?.[1] ?? '',
        published: /property="article:published_time" content="([^"]*)"/.exec(html)?.[1] ?? '',
      }))
      .filter(({ kind }) => kind === 'post');

    // 글 페이지들로 폴더(`posts`·`ai-written`)마다 탐색기 트리를 다시 짓는다: 폴더 안은 새 글 먼저, 연도 없음.
    const treeOf = (folder: string): TreeRoot[] => [
      {
        name: folder,
        url: FOLDER_ROUTES[folder as Folder].dir.url,
        files: posts
          .filter(({ path }) => path.split('/')[0] === folder)
          .toSorted((a, b) => b.published.localeCompare(a.published))
          .map(({ url, title, path }) => ({ url, title, path })),
      },
    ];

    it.each(
      posts.map(({ url, html, path }) => ({ url, html, folder: path.split('/')[0] as Folder })),
    )(
      'ends $url with the next file line (only when the folder has a newer post), the $folder folder screen, 맨 위로',
      ({ url, html, folder }) => {
        const next = nextFile(treeOf(folder), url);
        const { dir } = FOLDER_ROUTES[folder];
        const nextLine = next
          ? [
              {
                href: next.url,
                label: `${next.path.split('/').at(-1)} →`,
                name: `다음 파일: ${next.title}`,
                mark: true,
              },
            ]
          : [];
        expect(docEndLines(html)).toEqual([
          ...nextLine,
          { href: dir.url, label: dir.name, name: undefined, mark: false },
          { href: '#editor', label: '맨 위로', name: undefined, mark: false },
        ]);
      },
    );
  });
});
