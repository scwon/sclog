/**
 * 명령 팔레트의 파일 모드. DOM을 모르고, 탐색기 트리 props와 입력으로 보일 글 줄을 정한다. 바인딩은 `Palette.tsx`가 맡는다.
 * 찾기 정규화는 패널 검색 화면과 같은 `match.logic.ts`의 `normalizeForMatch`(NFD + 소문자)라, 입력 중인 음절("개바")도
 * "개발"에 부분 일치한다.
 */

import { normalizeForMatch } from './match.logic';

/** 팔레트가 읽는 탐색기 트리 모양(`Shell`의 `TreeYear`와 같다). */
export interface PaletteTree {
  year: string;
  files: { url: string; title: string; path: string }[];
}

/** 팔레트 목록의 글 한 줄. */
export interface PaletteFile {
  url: string;
  /** 파일 이름. 예: `pro-developer-2023-days.mdx` */
  name: string;
  /** 경로의 폴더. 예: `posts/2023` */
  folder: string;
  title: string;
}

/** 트리를 트리 순서(최신 먼저)의 글 줄로 편다. */
function rows(tree: PaletteTree[]): PaletteFile[] {
  return tree.flatMap(({ files }) =>
    files.map(({ url, title, path }) => {
      const cut = path.lastIndexOf('/');
      return { url, title, name: path.slice(cut + 1), folder: path.slice(0, Math.max(cut, 0)) };
    }),
  );
}

/** 줄의 순위. 작을수록 위다. 맞지 않으면 `null`. */
function rankOf(file: PaletteFile, query: string): number | null {
  const name = normalizeForMatch(file.name);
  if (name.startsWith(query)) return 0;
  if (name.includes(query)) return 1;
  if (normalizeForMatch(file.title).includes(query)) return 2;
  return null;
}

/**
 * 입력에 맞는 글 줄. 파일 이름과 제목을 정규화해 부분 일치시키고(폴더는 보지 않는다), 순위는 파일 이름이
 * 입력으로 시작 → 파일 이름에 포함 → 제목에 포함이며, 같으면 트리 순서다. 빈 입력이면 모든 글을 트리 순서로 보인다.
 */
export function paletteFiles(tree: PaletteTree[], query: string): PaletteFile[] {
  const all = rows(tree);
  const needle = normalizeForMatch(query.trim());
  if (!needle) return all;
  return all
    .map((file) => ({ file, rank: rankOf(file, needle) }))
    .filter((entry): entry is { file: PaletteFile; rank: number } => entry.rank !== null)
    .toSorted((a, b) => a.rank - b.rank)
    .map(({ file }) => file);
}
