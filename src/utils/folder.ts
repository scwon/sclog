/**
 * 글의 폴더(직접 쓴 글 `posts` | AI 글 `ai-written`). 파일이 놓인 콘텐츠 컬렉션이 곧 폴더이고(ADR 0005),
 * 주소·파일 경로·로그·태그 주소는 모두 여기 표에서 갈라진다. 폴더를 하나 더 두려면 표에 한 줄을 더한다.
 */

/** 글의 폴더. 탐색기 최상위 폴더 이름이자 파일 경로의 첫 조각이다. */
export type Folder = 'posts' | 'ai-written';

/** 폴더마다 정해진 콘텐츠 컬렉션과 주소. */
export interface FolderRoutes {
  /** 글 파일이 놓인 콘텐츠 컬렉션(`src/content.config.ts`). */
  collection: 'blog' | 'ai-written';
  /** 글 주소 앞부분. 글 주소는 `<postBase><슬러그>/`. */
  postBase: string;
  /** 그 폴더의 흐름 로그 탭: 이름(`posts.log`)과 주소. */
  log: { name: string; url: string };
  /** 태그 목록 주소. 태그별 글은 `<tags><태그>/`. */
  tags: string;
}

/** 폴더 표. 순서가 탐색기·합산 조회의 폴더 순서다(`posts` 먼저). */
export const FOLDER_ROUTES = {
  posts: {
    collection: 'blog',
    postBase: '/blog/',
    log: { name: 'posts.log', url: '/' },
    tags: '/blog/tags/',
  },
  'ai-written': {
    collection: 'ai-written',
    postBase: '/ai-written/',
    log: { name: 'ai-written.log', url: '/ai-written/' },
    tags: '/ai-written/tags/',
  },
} as const satisfies Record<Folder, FolderRoutes>;

/** 모든 폴더(`posts`, `ai-written` 순). */
export const FOLDERS = Object.keys(FOLDER_ROUTES) as Folder[];

/** 글의 폴더: 글이 든 콘텐츠 컬렉션에서 바로 나온다. */
export function postFolder(post: { collection: FolderRoutes['collection'] }): Folder {
  return post.collection === 'ai-written' ? 'ai-written' : 'posts';
}

/** 이름(`posts`·`ai-written`)이 폴더인지. 경로 표시줄 조각을 가를 때 쓴다. */
export function isFolder(name: string): name is Folder {
  return Object.hasOwn(FOLDER_ROUTES, name);
}
