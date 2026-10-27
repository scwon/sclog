import { COARSE_POINTER } from '../../media';
import { $selectionToolbarOpen } from '../../stores/selectionToolbar';
import {
  focusDueOnShow,
  headingAbove,
  PROSE_CLASS,
  slugOf,
  tabStopAfterSelection,
  toolbarAllowed,
  toolbarPlacement,
  toolbarSize,
  visibleActions,
  type ElementStep,
  type PendingFocus,
  type ScreenBounds,
  type SelectionAction,
  type SelectionEnds,
} from './selection.logic';
import type { SelectionToolbarProps } from './SelectionToolbar';

/**
 * 선택 툴바의 DOM 쪽: 문서 선택을 읽어 순수 판정(`selection.logic.ts`)에 넘기고, 띄울 때만 툴바 청크
 * (`SelectionToolbar.tsx`)를 불러 그린다. 첫 화면은 이 작은 감시만 싣는다.
 *
 * - 마우스로 고르는 동안(`pointerdown`~`pointerup`)은 그리지 않고 `pointerup`에서 그린다.
 * - 키보드(Shift+화살표)로 고르면 선택이 `KEYBOARD_SETTLE_MS` 동안 멈춘 뒤 그린다. 포커스는 본문에 남는다.
 * - 선택이 접히면(빈 곳 클릭 포함) 걷는다. 떠 있는 동안 선택이 바뀌면 자리를 다시 잰다.
 * - Esc, 찾기 줄·팔레트가 열릴 때는 창 틀이 `dismissSelectionToolbar()`를 부른다(선택은 남는다). 떠 있는지는
 *   `$selectionToolbarOpen`으로 알린다.
 * - 툴바가 고른 자리 바로 뒤에 놓인 것처럼 Tab 순서를 잇는다. 창 틀이 고른 자리의 첫 Tab에 `focusSelectionToolbar()`,
 *   마지막 버튼의 Tab에 `focusAfterSelection()`, 첫 버튼의 Shift+Tab에 `returnToSelection()`을 부른다.
 * - 화면을 옮기기 전에는 소비자가 `closeSelectionToolbar()`를 부른다.
 */

/** `watchSelectionToolbar`의 설정. 글자는 소비자가 넘긴다. */
export interface SelectionToolbarOptions {
  /** 동작 목록. 툴바는 `when`이 참인 것만 이 순서로 그린다. */
  actions: readonly SelectionAction[];
  /** 버튼 묶음의 접근 가능한 이름. */
  label: string;
  /**
   * 상자 층을 붙이고 버튼 묶음을 포털할 요소의 선택자. 본문 요소(`.doc-prose`)를 품는 가장 가까운 조상 가운데 이 선택자에
   * 맞는 것을 쓴다. `position: relative`여야 하고 랜드마크(`main`) 안에 있어야 한다(axe `region`).
   */
  host: string;
  /** 본문 안이어도 툴바를 띄우지 않는 요소의 클래스(제 복사 버튼이 있는 코드 블록 틀 등). */
  excludedClasses?: readonly string[];
}

/** 본문 요소. 글 화면에만 있다. */
const PROSE = `.${PROSE_CLASS}`;
/** 툴바 버튼 묶음(포털되어 본문 밖에 있다). */
const TOOLBAR = '[data-selection-toolbar]';

type Chunk = typeof import('./SelectionToolbar');

let options: SelectionToolbarOptions | null = null;
let chunk: Promise<Chunk> | null = null;
/** 마우스 단추를 누른 채 고르는 중인가. */
let dragging = false;
/** 그리기·걷기 요청 순번. 청크를 불러오는 사이에 걷혔으면 늦게 온 그리기를 버린다. */
let request = 0;
/** 키보드로 고른 선택을 그리려고 기다리는 타이머. */
let settle = 0;
/** 툴바를 그리는 중에 고른 자리에서 누른 Tab. 그리기를 마치면 첫 버튼에 포커스를 준다(`focusDueOnShow`). */
let pendingFocus: PendingFocus<Node | null> | null = null;

/**
 * 키보드로 고른 선택이 이만큼 멈추면 그린다(ms). Shift+화살표를 누르고 있는 동안 툴바가 깜박이지 않을 만큼 길고,
 * 손을 뗀 뒤 기다린다고 느끼지 않을 만큼 짧다.
 */
const KEYBOARD_SETTLE_MS = 250;

/** 툴바가 떠 있는가(그리기를 요청했고 아직 걷지 않았다). */
function shown(): boolean {
  return $selectionToolbarOpen.get();
}

/**
 * 버튼이 보이는 화면 범위: 위는 탭·경로 표시줄 아래(`html`의 `scroll-padding-top`, 앵커 이동과 같은 선), 아래는 창
 * 아래 끝, 오른쪽은 스크롤 막대를 뺀 창 오른쪽 끝이다. 그리는 쪽도 스크롤할 때마다 읽는다.
 */
export function screenBounds(): ScreenBounds {
  const root = document.documentElement;
  return {
    top: parseFloat(getComputedStyle(root).scrollPaddingTop) || 0,
    bottom: window.innerHeight,
    right: root.clientWidth,
  };
}

function load(): Promise<Chunk> {
  chunk ??= import('./SelectionToolbar');
  return chunk;
}

/** 노드에서 바깥으로 올라가며 만나는 요소들. */
function ancestry(node: Node | null): ElementStep[] {
  const steps: ElementStep[] = [];
  let element = node instanceof Element ? node : (node?.parentElement ?? null);
  for (; element; element = element.parentElement) {
    steps.push({ name: element.localName, id: element.id, classes: [...element.classList] });
  }
  return steps;
}

/** 본문 요소의 자식 노드들. 글자 노드는 `null`이다(`headingAbove`의 입력). */
function proseChildren(prose: Element): (ElementStep | null)[] {
  return [...prose.childNodes].map((node) =>
    node instanceof Element ? { name: node.localName, id: node.id } : null,
  );
}

/**
 * 선택이 시작한 본문 자식의 자리. 시작 노드가 본문 요소 자신이면(블록 경계에서 시작) 그 오프셋이 곧 자식 번호다.
 * 본문 밖이면 -1.
 */
function startChild(prose: Element, range: Range): number {
  if (range.startContainer === prose) return range.startOffset;
  let node: Node | null = range.startContainer;
  while (node && node.parentNode !== prose) node = node.parentNode;
  return node ? [...prose.childNodes].indexOf(node as ChildNode) : -1;
}

/** 끝(focus)이 시작(anchor)보다 앞에 있는가(위로·왼쪽으로 고름). */
function isBackward(selection: Selection, range: Range): boolean {
  return (
    selection.focusNode === range.startContainer &&
    selection.focusOffset === range.startOffset &&
    !range.collapsed
  );
}

/** 지금 선택으로 그릴 툴바(붙일 글 요소와 props). 띄우지 않을 선택이면 `null`. */
function toolbarView(
  current: SelectionToolbarOptions,
): { host: HTMLElement; props: SelectionToolbarProps } | null {
  const selection = document.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const prose = document.querySelector(PROSE);
  const host = prose?.closest<HTMLElement>(current.host);
  if (!prose || !host) return null;
  const range = selection.getRangeAt(0);
  const text = selection.toString();
  const allowed = toolbarAllowed({
    start: ancestry(range.startContainer),
    end: ancestry(range.endContainer),
    text,
    coarsePointer: window.matchMedia(COARSE_POINTER).matches,
    excludedClasses: current.excludedClasses,
  });
  if (!allowed) return null;

  const context = {
    text,
    slug: slugOf(document.getElementById('editor')?.dataset.fileUrl),
    headingId: headingAbove(proseChildren(prose), startChild(prose, range)),
  };
  const actions = visibleActions(current.actions, context);
  if (actions.length === 0) return null;
  const toolbar = toolbarSize(actions.length);
  const placement = toolbarPlacement({
    lines: [...range.getClientRects()],
    column: prose.getBoundingClientRect(),
    backward: isBackward(selection, range),
    lineHeight: parseFloat(getComputedStyle(prose).lineHeight) || 0,
    screen: screenBounds(),
    toolbar,
  });
  if (!placement) return null;

  // 화면 좌표 → 층 좌표. 층은 글 요소를 꽉 채우므로 글 요소의 화면 위치를 뺀다.
  const origin = host.getBoundingClientRect();
  const { box, line, inset } = placement;
  return {
    host,
    props: {
      box: {
        top: box.top - origin.top,
        bottom: box.bottom - origin.top,
        left: box.left - origin.left,
        right: box.right - origin.left,
      },
      line: { top: line.top - origin.top, bottom: line.bottom - origin.top },
      inset,
      toolbar,
      actions,
      context,
      label: current.label,
    },
  };
}

/** 지금 선택으로 다시 그리거나, 띄울 선택이 아니면 걷는다. */
function refresh(): void {
  if (!options) return;
  const view = toolbarView(options);
  if (!view) {
    hide();
    return;
  }
  const ticket = ++request;
  $selectionToolbarOpen.set(true);
  void load().then(({ showSelectionToolbar }) => {
    if (ticket !== request) return;
    showSelectionToolbar(view.host, view.props);
    const due = focusDueOnShow(pendingFocus, {
      open: shown(),
      focus: document.activeElement,
      selection: selectionEnds(),
    });
    pendingFocus = null;
    if (due) firstButton()?.focus();
  });
}

function hide(): void {
  window.clearTimeout(settle);
  pendingFocus = null;
  if (!shown()) return;
  $selectionToolbarOpen.set(false);
  request++;
  void chunk?.then(({ hideSelectionToolbar }) => hideSelectionToolbar());
}

/** 지금 선택의 두 끝. 선택이 없으면 `null`. */
function selectionEnds(): SelectionEnds<Node | null> | null {
  const selection = document.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  return {
    startNode: range.startContainer,
    startOffset: range.startOffset,
    endNode: range.endContainer,
    endOffset: range.endOffset,
  };
}

/** 그려진 툴바의 첫 버튼. */
function firstButton(): HTMLElement | null {
  return document.querySelector<HTMLElement>(`${TOOLBAR} button`);
}

function inToolbar(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(TOOLBAR) !== null;
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0 || inToolbar(event.target)) return;
  dragging = true;
}

function onPointerUp(event: PointerEvent): void {
  if (!dragging) return;
  dragging = false;
  if (!inToolbar(event.target)) refresh();
}

/**
 * 선택이 접히면 걷는다. 마우스로 고르는 중이면 `pointerup`을 기다린다. 툴바가 떠 있으면 자리를 바로 다시 재고, 떠
 * 있지 않으면(키보드로 새로 고름) 선택이 `KEYBOARD_SETTLE_MS` 동안 멈춘 뒤 그린다.
 */
function onSelectionChange(): void {
  window.clearTimeout(settle);
  if (document.getSelection()?.isCollapsed ?? true) {
    hide();
    return;
  }
  if (dragging) return;
  if (shown()) refresh();
  else
    settle = window.setTimeout(() => {
      if (!dragging) refresh();
    }, KEYBOARD_SETTLE_MS);
}

function onResize(): void {
  if (shown()) refresh();
}

/**
 * 본문 선택을 지켜보다가 선택 툴바를 띄운다. 리스너는 `document`·`window`에 한 번만 붙고(다시 부르면 설정만 바꾼다),
 * 화면을 옮겨도 그대로 쓴다. 본문이 없는 화면에서는 아무것도 하지 않는다.
 */
export function watchSelectionToolbar(next: SelectionToolbarOptions): void {
  const first = options === null;
  options = next;
  if (!first || typeof document === 'undefined') return;
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('pointerup', onPointerUp, true);
  document.addEventListener('selectionchange', onSelectionChange);
  window.addEventListener('resize', onResize);
}

/**
 * 상자와 버튼을 걷는다. 고른 글자는 그대로 두므로 ⌘C는 그대로 되고, 선택을 다시 바꾸면 다시 뜬다.
 * 창 틀이 Esc에, 그리고 찾기 줄·팔레트가 열릴 때 부른다.
 */
export function dismissSelectionToolbar(): void {
  hide();
}

/**
 * 선택 툴바의 첫 버튼에 포커스를 준다. 툴바는 글 끝에 포털되어 DOM 순서로는 고른 자리에서 멀므로, 창 틀이 고른 자리에서
 * 누른 첫 Tab에 부른다. 툴바를 아직 그리는 중이면(청크를 불러오는 중) 그리기를 마친 뒤 준다. 그 사이에 선택이 바뀌거나
 * 툴바가 걷히거나 포커스가 옮겨 갔으면 주지 않는다.
 */
export function focusSelectionToolbar(): void {
  const button = firstButton();
  if (button) button.focus();
  else {
    const selection = selectionEnds();
    if (shown() && selection) pendingFocus = { from: document.activeElement, selection };
  }
}

/** Tab 대상일 수 있는 요소. 실제로 Tab 순서에 드는지는 `tabIndex`와 보이는지로 다시 본다(`tabStopAfterSelection`). */
const TAB_CANDIDATES = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'iframe',
  'summary',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

/** 문서 순서로 선택 끝 뒤에 오는 첫 Tab 대상(툴바 밖). 선택이 없거나 그런 대상이 없으면 `null`. */
function stopAfterSelection(): HTMLElement | null {
  const selection = document.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const end = selection.getRangeAt(0).cloneRange();
  end.collapse(false);
  const candidates = [...document.querySelectorAll<HTMLElement>(TAB_CANDIDATES)];
  const index = tabStopAfterSelection(
    candidates.map((element) => ({
      tabIndex: element.tabIndex,
      afterSelection: end.comparePoint(element, 0) > 0,
      inToolbar: inToolbar(element),
      usable:
        !element.matches(':disabled') &&
        element.closest('[inert]') === null &&
        element.checkVisibility({ visibilityProperty: true }),
    })),
  );
  return candidates[index] ?? null;
}

/**
 * 키를 받은 요소가 선택 툴바 버튼이면 첫 버튼인가·마지막 버튼인가(버튼이 하나면 둘 다 참). 툴바 밖이면 `null`.
 * 창 틀의 단축키 판정이 툴바 끝에서 누른 Tab·Shift+Tab을 받을지 정할 때 쓴다.
 */
export function toolbarButtonAt(
  target: EventTarget | null,
): { first: boolean; last: boolean } | null {
  if (!(target instanceof HTMLButtonElement)) return null;
  const toolbar = target.closest(TOOLBAR);
  if (!toolbar) return null;
  const buttons = [...toolbar.querySelectorAll('button')];
  return { first: buttons[0] === target, last: buttons.at(-1) === target };
}

/** 문서 순서로 선택 끝 뒤에 툴바 밖 Tab 대상이 있는가. 없으면 마지막 버튼의 Tab은 브라우저가 받는다. */
export function hasStopAfterSelection(): boolean {
  return stopAfterSelection() !== null;
}

/**
 * 선택 끝 뒤에 오는 첫 Tab 대상에 포커스를 준다. 툴바가 고른 자리 바로 뒤에 놓인 것처럼, 창 틀이 툴바 마지막 버튼에서
 * 누른 Tab에 부른다. 선택은 그대로 남는다.
 */
export function focusAfterSelection(): void {
  stopAfterSelection()?.focus();
}

/**
 * 고른 글자를 품은 요소로 포커스를 돌린다: 선택을 품은 가장 가까운 포커스 받는 요소(에디터 루트), 없으면 `body`.
 * 창 틀이 툴바 첫 버튼에서 누른 Shift+Tab에 부른다. 선택은 그대로 남고, 다시 Tab을 누르면 툴바로 들어간다.
 */
export function returnToSelection(): void {
  const selection = document.getSelection();
  const node = selection?.rangeCount ? selection.getRangeAt(0).commonAncestorContainer : null;
  const element = node instanceof Element ? node : (node?.parentElement ?? null);
  const holder = element?.closest<HTMLElement>('[tabindex]');
  if (holder) holder.focus({ preventScroll: true });
  else if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
}

/** 상자와 버튼을 걷고 층을 없앤다. 화면을 옮기기 전(`astro:before-swap`)에 부른다. */
export function closeSelectionToolbar(): void {
  window.clearTimeout(settle);
  pendingFocus = null;
  $selectionToolbarOpen.set(false);
  dragging = false;
  request++;
  void chunk?.then(({ unmountSelectionToolbar }) => unmountSelectionToolbar());
}
