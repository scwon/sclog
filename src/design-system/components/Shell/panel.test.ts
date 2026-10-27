import { describe, expect, it } from 'vitest';
import {
  PANEL_VIEWS,
  dismissPanel,
  initialPanel,
  panelVisible,
  pickView,
  restorePanelView,
  showView,
  startView,
  togglePanel,
  viewForFile,
} from './panel.logic';

describe('pickView (활동 막대 아이콘)', () => {
  it('shows the other view in the panel', () => {
    const next = pickView(initialPanel, 'profile', true);
    expect(next.view).toBe('profile');
    expect(panelVisible(next, true)).toBe(true);
  });

  it('closes the panel when the current view is picked again', () => {
    const wide = pickView(initialPanel, 'explorer', true);
    expect(panelVisible(wide, true)).toBe(false);

    const narrow = pickView(pickView(initialPanel, 'profile', false), 'profile', false);
    expect(panelVisible(narrow, false)).toBe(false);
    expect(narrow.view).toBe('profile');
  });

  it('reopens a closed panel with the picked view', () => {
    const closed = pickView(initialPanel, 'explorer', true);
    const next = pickView(closed, 'explorer', true);
    expect(next.view).toBe('explorer');
    expect(panelVisible(next, true)).toBe(true);
  });
});

describe('showView (좁은 화면의 전환 버튼, 개요 열기)', () => {
  it('opens the panel on the view, even when it is already shown', () => {
    const profile = showView('profile', false);
    expect(profile.view).toBe('profile');
    expect(panelVisible(profile, false)).toBe(true);

    expect(panelVisible(showView('profile', false), false)).toBe(true);
  });

  it('switches a wide panel back to the explorer for the outline', () => {
    const next = showView('explorer', true);
    expect(next.view).toBe('explorer');
    expect(panelVisible(next, true)).toBe(true);
  });
});

describe('togglePanel (제목 표시줄의 메뉴 버튼)', () => {
  it('opens and closes the panel without changing its view', () => {
    const profile = showView('profile', false);
    const closed = togglePanel(profile, false);
    expect(panelVisible(closed, false)).toBe(false);
    expect(closed.view).toBe('profile');

    const reopened = togglePanel(closed, false);
    expect(panelVisible(reopened, false)).toBe(true);
    expect(reopened.view).toBe('profile');
  });
});

describe('dismissPanel (좁은 화면에서 글을 열었을 때)', () => {
  it('hides the narrow panel but keeps the last view', () => {
    const next = dismissPanel(showView('profile', false), false);
    expect(panelVisible(next, false)).toBe(false);
    expect(next.view).toBe('profile');
  });
});

describe('화면 폭 경계', () => {
  it('leaves the panel to the screen width after crossing 1100px', () => {
    const closedWide = togglePanel(initialPanel, true);
    expect(panelVisible(closedWide, true)).toBe(false);
    expect(panelVisible(closedWide, false)).toBe(false);

    const openNarrow = showView('profile', false);
    expect(panelVisible(openNarrow, true)).toBe(true);
  });
});

describe('viewForFile (파일을 열었을 때의 패널 화면)', () => {
  it('shows the profile on the home log and the explorer on a post', () => {
    expect(viewForFile('explorer', 'log')).toBe('profile');
    expect(viewForFile('profile', 'post')).toBe('explorer');
  });

  it('keeps the current view on other pages', () => {
    expect(viewForFile('profile', 'page')).toBe('profile');
    expect(viewForFile('explorer', 'page')).toBe('explorer');
  });

  it('keeps the search view whatever file opens', () => {
    expect(viewForFile('search', 'log')).toBe('search');
    expect(viewForFile('search', 'post')).toBe('search');
    expect(viewForFile('search', 'page')).toBe('search');
  });
});

describe('PANEL_VIEWS (활동 막대와 전환 버튼의 순서)', () => {
  it('is profile → explorer → search', () => {
    expect(PANEL_VIEWS).toEqual(['profile', 'explorer', 'search']);
  });
});

describe('restorePanelView (저장해 둔 마지막 패널 화면)', () => {
  it('restores a saved view', () => {
    expect(restorePanelView({ v: 1, view: 'profile' })).toBe('profile');
    expect(restorePanelView({ v: 1, view: 'explorer' })).toBe('explorer');
    expect(restorePanelView({ v: 1, view: 'search' })).toBe('search');
  });

  it('drops a value with another version', () => {
    expect(restorePanelView({ v: 2, view: 'profile' })).toBeNull();
    expect(restorePanelView({ view: 'profile' })).toBeNull();
  });

  it('drops an unknown view or a malformed value', () => {
    expect(restorePanelView({ v: 1, view: 'terminal' })).toBeNull();
    expect(restorePanelView({ v: 1 })).toBeNull();
    expect(restorePanelView('profile')).toBeNull();
    expect(restorePanelView(null)).toBeNull();
  });
});

describe('startView (새로고침 뒤 처음 패널 화면)', () => {
  it('keeps the restored view on pages without a rule', () => {
    expect(startView('profile', 'page')).toBe('profile');
  });

  it('applies the file rule over the restored view', () => {
    expect(startView('explorer', 'log')).toBe('profile');
    expect(startView('profile', 'post')).toBe('explorer');
  });

  it('keeps a restored search view on any file', () => {
    expect(startView('search', 'post')).toBe('search');
    expect(startView('search', 'log')).toBe('search');
  });

  it('starts from the explorer when nothing is saved', () => {
    expect(startView(null, 'page')).toBe('explorer');
    expect(startView(null, 'log')).toBe('profile');
    expect(startView(null)).toBe('explorer');
  });
});
