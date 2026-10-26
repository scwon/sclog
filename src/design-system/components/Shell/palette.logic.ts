/**
 * 명령 팔레트의 파일 모드와 명령 모드. DOM을 모르고, 입력(과 탐색기 트리 props·지금 맥락)으로 보일 줄을 정한다.
 * 바인딩은 `Palette.tsx`가 맡는다.
 * 찾기 정규화는 패널 검색 화면과 같은 `match.logic.ts`의 `normalizeForMatch`(NFD + 소문자)라, 입력 중인 음절("개바")도
 * "개발"에 부분 일치한다.
 */

import { fileName } from '../../stores/file.logic';
import { normalizeForMatch } from './match.logic';
import { SHORTCUT_KEYS, keyLabel, type Platform, type ShortcutKeys } from './shortcuts.logic';
import type { TreeYear } from './Shell';

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
function rows(tree: TreeYear[]): PaletteFile[] {
  return tree.flatMap(({ files }) =>
    files.map(({ url, title, path }) => {
      const name = fileName(path);
      return {
        url,
        title,
        name,
        folder: path.slice(0, Math.max(path.length - name.length - 1, 0)),
      };
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
export function paletteFiles(tree: TreeYear[], query: string): PaletteFile[] {
  const all = rows(tree);
  const needle = normalizeForMatch(query.trim());
  if (!needle) return all;
  return all
    .map((file) => ({ file, rank: rankOf(file, needle) }))
    .filter((entry): entry is { file: PaletteFile; rank: number } => entry.rank !== null)
    .toSorted((a, b) => a.rank - b.rank)
    .map(({ file }) => file);
}

/** 입력이 `>`로 시작하면 명령 모드다. */
export function isCommandQuery(query: string): boolean {
  return query.startsWith('>');
}

/** 명령 팔레트의 명령. `open-file`은 팔레트가 스스로 파일 모드로 돌아가고, 나머지는 창 틀이 실행한다. */
export type PaletteCommandId =
  | 'open-file'
  | 'find-in-posts'
  | 'toggle-panel'
  | 'show-explorer'
  | 'show-profile'
  | 'toggle-theme'
  | 'open-next-file'
  | 'clear-history';

/** 명령 목록의 한 줄. */
export interface PaletteCommand {
  id: PaletteCommandId;
  label: string;
  /** 플랫폼에 맞는 키 표기(`⌘⇧F` / `Ctrl+Shift+F`). 키가 없는 명령은 `null`이라 키 칸이 빈다. */
  keys: string | null;
}

/** 명령 목록이 보는 지금 맥락. */
export interface PaletteCommandContext {
  /** 지금 글에 다음 파일(`nextFile`)이 있는가. 없으면 `다음 파일 열기`를 빼낸다. */
  hasNextFile: boolean;
  platform: Platform;
}

/** 명령 순서와 이름, 붙은 키. 이 순서가 단축키 도움말의 순서다. */
const COMMANDS: { id: PaletteCommandId; label: string; key?: keyof ShortcutKeys }[] = [
  { id: 'open-file', label: '파일 열기', key: 'palette' },
  { id: 'find-in-posts', label: '본문에서 찾기', key: 'search' },
  { id: 'toggle-panel', label: '패널 열고 닫기', key: 'panel' },
  { id: 'show-explorer', label: '탐색기 보기' },
  { id: 'show-profile', label: '프로필 보기' },
  { id: 'toggle-theme', label: '테마 전환' },
  { id: 'open-next-file', label: '다음 파일 열기' },
  { id: 'clear-history', label: '읽기 기록 지우기' },
];

/**
 * 명령 모드의 줄. `>` 뒤 글자를 파일 모드와 같은 정규화로 명령 이름에 부분 일치시키고, 목록 순서를 지킨다.
 * `>`만 있으면 모든 명령을 보인다. `keys`는 붙은 조합 키이고 기본값은 `SHORTCUT_KEYS`다.
 */
export function paletteCommands(
  query: string,
  { hasNextFile, platform }: PaletteCommandContext,
  keys: ShortcutKeys = SHORTCUT_KEYS,
): PaletteCommand[] {
  const needle = normalizeForMatch(query.replace(/^>/, '').trim());
  return COMMANDS.filter(({ id }) => id !== 'open-next-file' || hasNextFile)
    .filter(({ label }) => normalizeForMatch(label).includes(needle))
    .map(({ id, label, key }) => {
      const combo = key ? keys[key] : null;
      return { id, label, keys: combo ? keyLabel(combo, platform) : null };
    });
}
