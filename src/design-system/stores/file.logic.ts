/**
 * 페이지 ↔ 창 틀 계약의 순수 로직. 에디터 루트의 `data-file-*` 속성과 개요 JSON을 읽어 열린 파일을 만들고,
 * 상태줄에 잠깐 보일 열기 요약을 정한다. DOM은 모른다(창 틀이 `dataset`과 JSON 문자열을 넘긴다).
 */

/** 파일 종류. `log`는 홈 흐름 로그, `post`는 글, `page`는 태그·404 같은 나머지. */
export type FileKind = 'log' | 'post' | 'page';

/** 개요의 장(1단계)과 그 아래 절(2단계). `id`는 본문 제목의 앵커다. */
export interface OutlineItem {
  id: string;
  text: string;
  children: { id: string; text: string }[];
}

/** 번호가 붙은 장: 개요의 장 id·번호(`04`)·제목. 이어 읽기 버튼과 검색 결과의 위치가 쓴다. */
export interface NumberedChapter {
  id: string;
  /** 개요 순서의 두 자리 번호(`chapterNo`). */
  no: string;
  text: string;
}

/**
 * 경로의 파일 이름(마지막 `/` 뒤). `posts/2023/<slug>.mdx` → `<slug>.mdx`. `/`가 없으면(`posts.log`, `404`) 경로
 * 그대로다.
 */
export function fileName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

/** 에디터에 열린 파일. */
export interface EditorFile {
  title: string;
  /** 탭·창 제목에 보이는 경로(`posts/2023/<slug>.mdx`, `posts.log`, `tags/<태그>`, `404`). */
  path: string;
  url: string;
  kind: FileKind;
  /** 원본 크기(바이트). 글에만 있다. */
  size?: number;
  /** 읽는 시간(분). 글에만 있다. */
  reading?: number;
  /** 크기·읽는 시간이 없는 화면의 한 줄 요약(`글 1편`). */
  summary?: string;
  outline: OutlineItem[];
}

const KINDS: FileKind[] = ['log', 'post', 'page'];

function toNumber(value: string | undefined): number | undefined {
  const number = Number(value);
  return value && Number.isFinite(number) ? number : undefined;
}

function parseOutline(json: string | null): OutlineItem[] {
  if (!json) return [];
  try {
    const value: unknown = JSON.parse(json);
    return Array.isArray(value) ? (value as OutlineItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * `data-file-title`·`-path`·`-url`·`-kind`·`-size`·`-reading`·`-summary`를 읽는다(`dataset` 이름은 camelCase).
 * 제목·경로·URL이 없으면 계약을 지키지 않은 화면이므로 `null`.
 */
export function parseEditorFile(
  dataset: Record<string, string | undefined>,
  outlineJson: string | null,
): EditorFile | null {
  const { fileTitle: title, filePath: path, fileUrl: url } = dataset;
  if (!title || !path || !url) return null;
  const kind = KINDS.find((candidate) => candidate === dataset.fileKind) ?? 'page';
  return {
    title,
    path,
    url,
    kind,
    size: toNumber(dataset.fileSize),
    reading: toNumber(dataset.fileReading),
    summary: dataset.fileSummary || undefined,
    outline: parseOutline(outlineJson),
  };
}

/** 바이트를 `512 B`, `23.4 KB`, `2.0 MB`로 적는다(1 KB = 1024 B). */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** 파일을 열 때 상태줄에 차례로 보일 두 줄: `❯ open <경로>` → `✓ 열림 · <요약>`. */
export function openLog(file: EditorFile): { command: string; result: string } {
  const parts = [
    file.size === undefined ? undefined : formatSize(file.size),
    file.reading === undefined ? undefined : `읽는 시간 ${file.reading}분`,
    file.summary,
  ].filter((part): part is string => Boolean(part));
  return { command: `❯ open ${file.path}`, result: ['✓ 열림', ...parts].join(' · ') };
}
