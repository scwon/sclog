import { useEffect, useRef, useSyncExternalStore } from 'react';
import {
  platformOf,
  shortcutFor,
  type FocusTarget,
  type Platform,
  type ShortcutAction,
} from './shortcuts.logic';

/**
 * 단축키의 DOM 바인딩. `document`에 keydown 리스너 하나만 걸고, 키 이벤트를 판정(`shortcuts.logic.ts`의
 * `shortcutFor`)이 읽는 모양으로 옮긴 뒤 나온 동작을 창 틀(`Shell`)에 넘긴다. 동작 실행은 창 틀이 맡는다.
 * 기준은 `docs/agents/shortcuts.md`.
 */

/** 글자를 치는 입력창이 아닌 `<input>` 종류. 여기에 포커스가 있어도 단축키는 동작한다. */
const NON_TEXT_INPUTS = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

/** 키를 받은 요소의 종류(단축키 판정용). */
export function focusTarget(target: EventTarget | null): FocusTarget {
  if (!(target instanceof HTMLElement)) return 'other';
  if (target.matches('[data-palette-input]')) return 'palette-input';
  if (target.matches('[data-search-input]')) return 'search-input';
  if (target.matches('[data-find-input]')) return 'find-input';
  if (
    target.isContentEditable ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(target.type))
  )
    return 'text';
  return 'other';
}

/** 브라우저의 플랫폼. 서버 HTML에는 넣지 않고, 키를 처음 받거나 키 표기를 처음 그릴 때 읽는다. */
export function browserPlatform(): Platform {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return platformOf(nav.userAgentData?.platform || nav.platform || '');
}

/**
 * 찾기 줄을 쓸 수 있는가: CSS Custom Highlight API(`CSS.highlights`, `Highlight`)가 있어야 칠할 수 있다. 없으면 ⌘F를
 * 가로채지 않고 브라우저 찾기에 맡긴다. 브라우저에서만 부른다.
 */
export function findSupported(): boolean {
  return typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight === 'function';
}

/** 바뀌지 않는 값의 구독. */
const noSubscribe = () => () => {};

/**
 * 키 표기에 쓰는 플랫폼. 서버 HTML과 첫 하이드레이션은 `null`(키 표기 없음)이고, 하이드레이션 뒤 키 표기
 * (활동 막대 툴팁)를 처음 그릴 때 브라우저에서 읽는다.
 */
export function usePlatform(): Platform | null {
  return useSyncExternalStore(noSubscribe, browserPlatform, () => null);
}

/** 판정에 쓰는 창 틀의 지금 맥락. */
export interface ShortcutState {
  paletteOpen: boolean;
  /** 좁은 화면에서 패널이 에디터 위에 겹쳐 열려 있는가. */
  overlayOpen: boolean;
  /** 찾기 줄이 열려 있는가. */
  findOpen: boolean;
}

/**
 * `document`에 keydown 리스너 하나를 걸어, 판정이 동작을 돌려주면 기본 동작을 막고 `onAction`에 넘긴다.
 * 맥락과 `onAction`은 그릴 때마다 ref에 옮겨 리스너를 다시 걸지 않는다.
 */
export function useShortcuts(state: ShortcutState, onAction: (action: ShortcutAction) => void) {
  const latest = useRef({ state, onAction });
  useEffect(() => {
    latest.current = { state, onAction };
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const { state: current, onAction: run } = latest.current;
      const action = shortcutFor(
        {
          key: event.key,
          code: event.code,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          isComposing: event.isComposing,
          target: focusTarget(event.target),
        },
        { ...current, findSupported: findSupported(), platform: browserPlatform() },
      );
      if (!action) return;
      event.preventDefault();
      run(action);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
