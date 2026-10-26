/**
 * 패널 전환 규칙. DOM을 모르고, 지금 상태·누른 것(또는 연 파일)·화면 폭으로 다음 상태만 정한다. 바인딩은 `Shell.tsx`가 맡는다.
 */

import type { FileKind } from '../../stores/file.logic';

/** 패널이 보여 주는 화면. 활동 막대와 좁은 화면의 전환 버튼이 이 순서로 놓인다. */
export const PANEL_VIEWS = ['profile', 'explorer'] as const;

/** 패널 화면 하나. */
export type PanelView = (typeof PANEL_VIEWS)[number];

/** 패널 열림. `auto`는 화면 폭이 정한다(넓은 화면이면 보이고, 좁은 화면이면 숨김). */
export type PanelOpen = 'auto' | 'open' | 'closed';

/** 패널 상태. 열림은 그 열림을 정한 화면 폭(`wide`)과 함께 둔다. */
export interface PanelState {
  view: PanelView;
  open: PanelOpen;
  wide: boolean;
}

/** 처음 상태: 탐색기, 화면 폭에 맡김. 서버는 넓은 화면으로 그린다. */
export const initialPanel: PanelState = { view: 'explorer', open: 'auto', wide: true };

/** 지금 화면 폭에서의 열림. 열림을 정한 뒤 1100px 경계를 넘었으면 다시 화면 폭에 맡긴다(`auto`). */
export function panelOpen(state: PanelState, wide: boolean): PanelOpen {
  return state.wide === wide ? state.open : 'auto';
}

/** 지금 패널이 보이는가. */
export function panelVisible(state: PanelState, wide: boolean): boolean {
  const open = panelOpen(state, wide);
  return wide ? open !== 'closed' : open === 'open';
}

/** 활동 막대 아이콘을 눌렀다. 보이는 화면의 아이콘이면 패널을 닫고, 아니면 그 화면으로 연다. */
export function pickView(state: PanelState, view: PanelView, wide: boolean): PanelState {
  if (state.view === view && panelVisible(state, wide))
    return { view, open: wide ? 'closed' : 'auto', wide };
  return showView(view, wide);
}

/** 그 화면으로 패널을 연다. 이미 보이는 화면이어도 닫지 않는다(좁은 화면의 전환 버튼, 개요 열기). */
export function showView(view: PanelView, wide: boolean): PanelState {
  return { view, open: wide ? 'auto' : 'open', wide };
}

/** 패널을 열거나 닫는다. 화면은 그대로 둔다(좁은 화면 제목 표시줄의 메뉴 버튼). */
export function togglePanel(state: PanelState, wide: boolean): PanelState {
  const open = panelOpen(state, wide);
  if (wide) return { view: state.view, open: open === 'closed' ? 'auto' : 'closed', wide };
  return { view: state.view, open: open === 'open' ? 'auto' : 'open', wide };
}

/** 패널 열림을 화면 폭에 돌려준다(좁은 화면에서는 닫힘). 화면은 기억한다. */
export function dismissPanel(state: PanelState, wide: boolean): PanelState {
  return { view: state.view, open: 'auto', wide };
}

/** 저장하는 마지막 패널 화면 값의 판 번호. 모양을 바꾸면 올리고, 다른 판의 값은 불러올 때 버린다(ADR 0004). */
export const PANEL_SAVE_VERSION = 1;

/** `sessionStorage`의 `panel` 키에 두는 값. 열림·닫힘은 저장하지 않고 화면만 둔다. */
export interface SavedPanel {
  v: typeof PANEL_SAVE_VERSION;
  view: PanelView;
}

/** 지금 화면을 저장할 값으로 바꾼다. */
export function savePanelView(view: PanelView): SavedPanel {
  return { v: PANEL_SAVE_VERSION, view };
}

function isPanelView(value: unknown): value is PanelView {
  return (PANEL_VIEWS as readonly unknown[]).includes(value);
}

/** 저장해 둔 값(JSON을 푼 것)에서 화면을 꺼낸다. 판 번호가 틀리거나 모르는 화면이면 버리고 `null`을 돌려준다. */
export function restorePanelView(saved: unknown): PanelView | null {
  if (typeof saved !== 'object' || saved === null) return null;
  const { v, view } = saved as Record<string, unknown>;
  return v === PANEL_SAVE_VERSION && isPanelView(view) ? view : null;
}

/** 파일을 열었을 때 패널이 보일 화면. 홈 로그는 프로필, 글은 탐색기이고, 그 밖의 화면은 지금 화면을 둔다. */
export function viewForFile(current: PanelView, kind: FileKind): PanelView {
  if (kind === 'log') return 'profile';
  if (kind === 'post') return 'explorer';
  return current;
}

/**
 * 페이지를 처음 불러왔을 때의 패널 화면. 저장된 화면(없으면 탐색기)에 파일 종류 규칙(`viewForFile`)을 적용한다.
 * 서버는 저장소를 모르므로 `saved`를 `null`로 넘겨 그리고, 하이드레이션 뒤 저장된 화면으로 다시 정한다.
 */
export function startView(saved: PanelView | null, kind?: FileKind): PanelView {
  const view = saved ?? initialPanel.view;
  return kind ? viewForFile(view, kind) : view;
}
