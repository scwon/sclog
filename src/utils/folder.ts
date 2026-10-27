/**
 * 글의 폴더(직접 쓴 글 `posts` | AI 글 `ai-written`). 파일이 놓인 콘텐츠 컬렉션이 곧 폴더이고(ADR 0005),
 * 주소·파일 경로·로그·태그 주소·고정 문구는 모두 여기 표에서 갈라진다. 폴더를 하나 더 두려면 표에 한 줄을 더한다.
 */
import { SITE } from '../site';

/** 글의 폴더. 탐색기 루트 폴더 이름이자 파일 경로의 첫 조각이다. */
export type Folder = 'posts' | 'ai-written';

/** 폴더마다 정해진 콘텐츠 컬렉션과 주소. */
export interface FolderRoutes {
  /** 글 파일이 놓인 콘텐츠 컬렉션(`src/content.config.ts`). */
  collection: 'blog' | 'ai-written';
  /** 글의 종류 이름(`직접 쓴 글`·`AI 글`). 404 갈 곳의 메모처럼 화면 문구에 쓴다. */
  kind: string;
  /** 글 주소 앞부분. 글 주소는 `<postBase><슬러그>/`. */
  postBase: string;
  /** 그 폴더의 흐름 로그 탭: 이름(`posts.log`)과 주소. */
  log: { name: string; url: string };
  /** 글 목록 화면: 이름(`posts/`)과 주소. 없는 폴더는 로그 탭이 그 역할을 한다(`null`). */
  list: { name: string; url: string } | null;
  /** 태그 목록 주소. 태그별 글은 `<tags><태그>/`. */
  tags: string;
  /** 태그 화면의 파일 경로 앞부분(`tags/`, `ai-written/tags/`). 태그별 글은 `<tagPath><태그>`. */
  tagPath: string;
  /** 글 제목 아래 고정 문구. 없는 폴더는 `null`. */
  notice: string | null;
}

/** 폴더 표. 순서가 탐색기·합산 조회의 폴더 순서다(`posts` 먼저). */
export const FOLDER_ROUTES = {
  posts: {
    collection: 'blog',
    kind: '직접 쓴 글',
    postBase: '/blog/',
    log: { name: 'posts.log', url: '/' },
    list: { name: 'posts/', url: '/blog/' },
    tags: '/blog/tags/',
    tagPath: 'tags/',
    notice: null,
  },
  'ai-written': {
    collection: 'ai-written',
    kind: 'AI 글',
    postBase: '/ai-written/',
    log: { name: 'ai-written.log', url: '/ai-written/' },
    list: null,
    tags: '/ai-written/tags/',
    tagPath: 'ai-written/tags/',
    notice: SITE.aiWrittenNotice,
  },
} as const satisfies Record<Folder, FolderRoutes>;

/** 모든 폴더(`posts`, `ai-written` 순). */
export const FOLDERS = Object.keys(FOLDER_ROUTES) as Folder[];

/** 글의 폴더: 글이 든 콘텐츠 컬렉션을 표에서 거꾸로 찾는다. */
export function postFolder(post: { collection: FolderRoutes['collection'] }): Folder {
  const folder = FOLDERS.find((name) => FOLDER_ROUTES[name].collection === post.collection);
  if (!folder) throw new Error(`폴더 표에 없는 컬렉션: ${post.collection}`);
  return folder;
}

/** 이름(`posts`·`ai-written`)이 폴더인지. 경로 표시줄 조각을 가를 때 쓴다. */
export function isFolder(name: string): name is Folder {
  return Object.hasOwn(FOLDER_ROUTES, name);
}

/** 태그 화면 파일 경로의 앞부분(`tags/`, `ai-written/tags/`)이 어느 폴더의 것인지. 없으면 `undefined`. */
export function tagPathFolder(prefix: string): Folder | undefined {
  return FOLDERS.find((name) => FOLDER_ROUTES[name].tagPath === prefix);
}
