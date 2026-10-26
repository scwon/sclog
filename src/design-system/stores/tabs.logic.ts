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

/** 열린 탭 하나. 파일과 "처음 보임" 표시를 함께 든다. */
export interface TabEntry extends TabFile {
  /** 이 탭에서 파일이 이미 한 번 보였는지. 탭과 수명이 같아 닫으면 사라지고 새로고침하면 남는다. */
  shown: boolean;
}

/** 열린 탭 목록(첫 칸은 항상 `posts.log`)과 활성 탭 URL. */
export interface TabsState {
  files: TabEntry[];
  active: string;
}

/** 홈의 흐름 로그 탭. 항상 첫 탭이고 닫히지 않는다. */
export const POSTS_LOG: TabFile = { url: '/', title: 'posts.log', path: 'posts.log' };

const entry = ({ url, title, path }: TabFile, shown: boolean): TabEntry => ({
  url,
  title,
  path,
  shown,
});

/** `posts.log`만 열린 처음 상태. `posts.log`는 아직 보이지 않았다. */
export function initialTabs(): TabsState {
  return { files: [entry(POSTS_LOG, false)], active: POSTS_LOG.url };
}

/** 파일을 연다. 이미 열려 있으면 자리를 그대로 두고 활성 탭으로만 바꾼다. 새 탭은 아직 보이지 않은 것으로 둔다. */
export function addOrActivate(state: TabsState, file: TabFile): TabsState {
  const open = state.files.some((tab) => tab.url === file.url);
  return {
    files: open ? state.files : [...state.files, entry(file, false)],
    active: file.url,
  };
}

/**
 * 파일을 에디터에 보인다. `addOrActivate`처럼 열고 그 탭에 "처음 보임" 표시를 붙이며, 표시가 없던 탭이면
 * `unfold`가 `true`다. 탭이 새로 생겨 처음 보일 때만 펼치고, 열린 탭으로 돌아오거나 새로고침한 뒤에는 펼치지 않는다.
 */
export function show(state: TabsState, file: TabFile): { state: TabsState; unfold: boolean } {
  const opened = addOrActivate(state, file);
  const unfold = opened.files.some((tab) => tab.url === file.url && !tab.shown);
  if (!unfold) return { state: opened, unfold };
  const files = opened.files.map((tab) => (tab.url === file.url ? { ...tab, shown: true } : tab));
  return { state: { files, active: opened.active }, unfold };
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

function isTabFile(value: unknown): value is TabFile & { shown?: unknown } {
  if (typeof value !== 'object' || value === null) return false;
  const { url, title, path } = value as Record<string, unknown>;
  return typeof url === 'string' && typeof title === 'string' && typeof path === 'string';
}

/**
 * 저장해 둔 값(sessionStorage에서 꺼낸 JSON)에서 상태를 다시 만든다. 모양이 틀린 항목과 중복은 버리고,
 * `posts.log`는 늘 첫 칸에 두며, 활성 탭이 목록에 없으면 `posts.log`를 활성 탭으로 둔다.
 * "처음 보임" 표시가 없는 항목(이전 형식)은 이미 보인 것으로 친다. 저장값에 `posts.log` 항목이 없으면 아직 보이지 않았다.
 */
export function restoreTabs(saved: unknown): TabsState {
  if (typeof saved !== 'object' || saved === null) return initialTabs();
  const { files, active } = saved as Record<string, unknown>;
  const restored = [entry(POSTS_LOG, false)];
  for (const file of (Array.isArray(files) ? files : []).filter(isTabFile)) {
    const shown = file.shown !== false;
    if (file.url === POSTS_LOG.url) restored[0] = entry(POSTS_LOG, shown);
    else if (!restored.some((tab) => tab.url === file.url)) restored.push(entry(file, shown));
  }
  const known = restored.some((tab) => tab.url === active);
  return { files: restored, active: known ? (active as string) : POSTS_LOG.url };
}
