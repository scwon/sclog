/**
 * 탭 스토어의 순수 로직. 현재 탭 상태와 입력으로 다음 상태만 정하고 DOM·storage는 모른다.
 * 바인딩은 tabs.ts가 맡는다.
 */

/** 탭 하나가 가리키는 파일. 키는 글 URL이다. */
export interface TabFile {
  /** 글 URL(`/blog/<slug>/`). 탭의 링크이자 키. */
  url: string;
  /** 글 제목. 닫기 버튼 이름 등에 쓴다. */
  title: string;
  /** 탭에 보이는 파일 경로(`posts/2023/<slug>.mdx`). */
  path: string;
}

/** 열린 탭 목록(첫 칸은 항상 `posts.log`)과 활성 탭 URL. */
export interface TabsState {
  files: TabFile[];
  active: string;
}

/** 홈의 흐름 로그 탭. 항상 첫 탭이고 닫히지 않는다. */
export const POSTS_LOG: TabFile = { url: '/', title: 'posts.log', path: 'posts.log' };

/** `posts.log`만 열린 처음 상태. */
export function initialTabs(): TabsState {
  return { files: [POSTS_LOG], active: POSTS_LOG.url };
}

/** 파일을 연다. 이미 열려 있으면 자리를 그대로 두고 활성 탭으로만 바꾼다. */
export function addOrActivate(state: TabsState, file: TabFile): TabsState {
  const open = state.files.some((tab) => tab.url === file.url);
  return { files: open ? state.files : [...state.files, file], active: file.url };
}

/**
 * 탭을 닫는다. 활성 탭을 닫으면 왼쪽 탭이 활성 탭이 되고(맨 왼쪽은 언제나 `posts.log`),
 * `next`로 그 URL을 돌려준다. `posts.log`나 열려 있지 않은 탭은 닫지 않는다.
 */
export function close(state: TabsState, url: string): { state: TabsState; next: string } {
  const index = state.files.findIndex((tab) => tab.url === url);
  if (url === POSTS_LOG.url || index === -1) return { state, next: state.active };
  const files = state.files.filter((tab) => tab.url !== url);
  const active = state.active === url ? state.files[index - 1].url : state.active;
  return { state: { files, active }, next: active };
}

function isTabFile(value: unknown): value is TabFile {
  if (typeof value !== 'object' || value === null) return false;
  const { url, title, path } = value as Record<string, unknown>;
  return typeof url === 'string' && typeof title === 'string' && typeof path === 'string';
}

/**
 * 저장해 둔 값(sessionStorage에서 꺼낸 JSON)에서 상태를 다시 만든다. 모양이 틀린 항목, 중복,
 * `posts.log` 사본은 버리고, 활성 탭이 목록에 없으면 `posts.log`를 활성 탭으로 둔다.
 */
export function restoreTabs(saved: unknown): TabsState {
  if (typeof saved !== 'object' || saved === null) return initialTabs();
  const { files, active } = saved as Record<string, unknown>;
  const restored = (Array.isArray(files) ? files : [])
    .filter(isTabFile)
    .reduce((state, file) => addOrActivate(state, file), initialTabs());
  const known = restored.files.some((tab) => tab.url === active);
  return { files: restored.files, active: known ? (active as string) : POSTS_LOG.url };
}
