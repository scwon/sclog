import { statSync } from 'node:fs';
import type { MarkdownHeading } from 'astro';
import {
  fileName,
  type EditorFile,
  type OutlineItem,
  type TreeFile,
  type TreeRoot,
} from '@/design-system';
import type { BlogPost } from './blog';
import { getReadingTime } from './blog';
import {
  FOLDER_ROUTES,
  FOLDERS,
  ROOT,
  isFolder,
  postFolder,
  tagPathFolder,
  type Folder,
} from './folder';

/** 창 틀에 넘기는 열린 파일 정보(에디터 루트 `data-file-*`의 원본). 개요는 따로 넘긴다. */
export type IdeFile = Omit<EditorFile, 'outline'>;

/** 탐색기 개요의 장과 절. */
export type IdeOutlineItem = OutlineItem;

/** 글의 연도(UTC 기준이라 빌드 환경의 시간대와 무관하다). */
export function postYear(post: BlogPost): string {
  return String(post.data.pubDate.getUTCFullYear());
}

/** 글 URL: 그 폴더의 주소 앞부분 + 슬러그(`/blog/<slug>/`, `/ai-written/<slug>/`). */
export function postUrl(post: BlogPost): string {
  return `${FOLDER_ROUTES[postFolder(post)].postBase}${post.id}/`;
}

/** 폴더의 태그별 글 주소: `/blog/tags/<태그>/`, `/ai-written/tags/<태그>/`. */
export function tagUrl(folder: Folder, tag: string): string {
  return `${FOLDER_ROUTES[folder].tags}${tag}/`;
}

/**
 * 태그 화면의 파일 경로(탭·경로 표시줄): 직접 쓴 글은 `tags/`·`tags/<태그>`, AI 글은 앞에 폴더를 붙여
 * `ai-written/tags/`·`ai-written/tags/<태그>`. 태그를 빼면 태그 목록이다.
 */
export function tagPath(folder: Folder, tag = ''): string {
  return `${FOLDER_ROUTES[folder].tagPath}${tag}`;
}

/**
 * 글을 창 틀의 파일로 본다: 경로 `<폴더>/<연도>/<slug>.mdx`(`posts/…`, `ai-written/…`),
 * 크기는 원본 파일 바이트.
 */
export function postFile(post: BlogPost): IdeFile {
  return {
    title: post.data.title,
    path: `${postFolder(post)}/${postYear(post)}/${post.id}.mdx`,
    url: postUrl(post),
    kind: 'post',
    size: post.filePath ? statSync(post.filePath).size : undefined,
    reading: getReadingTime(post.body ?? ''),
  };
}

/**
 * 탐색기 트리: 루트 폴더(`posts` 먼저, `ai-written` 다음)마다 그 폴더 화면의 주소와 글 파일(새 글 먼저, 발행 글 조회
 * 순서). 연도로 나누지 않는다. 글이 한 편도 없는 루트는 넣지 않는다.
 */
export function buildTree(posts: BlogPost[]): TreeRoot[] {
  return FOLDERS.map((name) => ({
    name,
    url: FOLDER_ROUTES[name].dir.url,
    files: posts
      .filter((post) => postFolder(post) === name)
      .map((post) => {
        const { url, title, path } = postFile(post);
        return { url, title, path };
      }),
  })).filter((root) => root.files.length > 0);
}

/** 글 끝 이동 줄 하나. 다음 파일 줄만 메모(글 제목)와 접근 가능한 이름이 있다. */
export type DocEndLink =
  | { href: string; label: string; note: string; name: string; next: true }
  | { href: string; label: string; next?: never };

/**
 * 글 끝 이동 줄: 다음 파일(`{slug}.mdx →` + 글 제목) → 그 폴더 화면(`posts/`·`ai-written/`) → `맨 위로`.
 * 다음 파일이 없으면 그 줄만 뺀다.
 */
export function docEndLinks(folder: Folder, next: TreeFile | null): DocEndLink[] {
  const { dir } = FOLDER_ROUTES[folder];
  const rest: DocEndLink[] = [
    { href: dir.url, label: dir.name },
    { href: '#editor', label: '맨 위로' },
  ];
  if (!next) return rest;
  return [
    {
      href: next.url,
      label: `${fileName(next.path)} →`,
      note: next.title,
      name: `다음 파일: ${next.title}`,
      next: true,
    },
    ...rest,
  ];
}

/** 경로 표시줄 조각 하나. 마지막 조각(`current`)과 폴더가 아닌 중간 조각은 링크가 없다. */
export interface Crumb {
  label: string;
  href: string | undefined;
  current: boolean;
}

/**
 * 경로 표시줄 중간 조각의 링크: 폴더면 그 폴더 화면, 그 조각까지의 경로가 어느 폴더의 태그 경로 앞부분이면
 * 그 폴더의 태그 목록(`tags/…`는 `posts`, `ai-written/tags/…`는 `ai-written`), 나머지는 없음.
 */
function sectionHref(label: string, upTo: string[]): string | undefined {
  if (isFolder(label)) return FOLDER_ROUTES[label].dir.url;
  const folder = tagPathFolder(`${upTo.join('/')}/`);
  return folder && FOLDER_ROUTES[folder].tags;
}

/**
 * 경로 표시줄: 파일 경로를 `/`로 나눈 조각(`posts › 2023 › x.mdx`, `ai-written › 2026 › x.mdx`, `posts`, `tags › 회고`,
 * `ai-written › tags › 회고`). 루트는 `/` 한 조각이다. 폴더 조각은 그 폴더 화면, `tags` 조각은 그 폴더의 태그 목록으로 간다.
 */
export function fileCrumbs(file: Pick<IdeFile, 'path' | 'kind'>): Crumb[] {
  if (file.kind === 'root') return [{ label: ROOT.name, href: undefined, current: true }];
  const segments = file.path.split('/').filter(Boolean);
  return segments.map((label, index) => {
    const current = index === segments.length - 1;
    return {
      label,
      href: current ? undefined : sectionHref(label, segments.slice(0, index + 1)),
      current,
    };
  });
}

/** 본문 제목에서 개요를 만든다. 가장 얕은 단계가 장이고, 바로 아래 단계가 그 장의 절이다. */
export function buildOutline(headings: MarkdownHeading[]): IdeOutlineItem[] {
  if (headings.length === 0) return [];
  const top = Math.min(...headings.map((heading) => heading.depth));
  const outline: IdeOutlineItem[] = [];
  for (const heading of headings) {
    if (heading.depth === top) outline.push({ id: heading.slug, text: heading.text, children: [] });
    else if (heading.depth === top + 1)
      outline.at(-1)?.children.push({ id: heading.slug, text: heading.text });
  }
  return outline;
}

/** 장 주소를 복사할 수 있는 제목: 개요에 오른 장과 절의 id → 제목 글자(글 순서). */
export function chapterLinkTargets(outline: IdeOutlineItem[]): Map<string, string> {
  return new Map(
    outline.flatMap((chapter) => [
      [chapter.id, chapter.text] as const,
      ...chapter.children.map((section) => [section.id, section.text] as const),
    ]),
  );
}
