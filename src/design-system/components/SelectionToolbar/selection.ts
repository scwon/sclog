import { COARSE_POINTER } from '../../media';
import {
  headingAbove,
  slugOf,
  toolbarAllowed,
  toolbarPlacement,
  visibleActions,
  type ElementStep,
  type SelectionAction,
} from './selection.logic';
import type { SelectionToolbarProps } from './SelectionToolbar';

/**
 * 선택 툴바의 DOM 쪽: 문서 선택을 읽어 순수 판정(`selection.logic.ts`)에 넘기고, 띄울 때만 툴바 청크
 * (`SelectionToolbar.tsx`)를 불러 그린다. 첫 화면은 이 작은 감시만 싣는다.
 *
 * - 마우스로 고르는 동안(`pointerdown`~`pointerup`)은 그리지 않고 `pointerup`에서 그린다.
 * - 선택이 접히면(빈 곳 클릭 포함) 걷는다. 떠 있는 동안 선택이 바뀌면 자리를 다시 잰다.
 * - 화면을 옮기기 전에는 소비자가 `closeSelectionToolbar()`를 부른다.
 */

/** `watchSelectionToolbar`의 설정. 글자는 소비자가 넘긴다. */
export interface SelectionToolbarOptions {
  /** 동작 목록. 툴바는 `when`이 참인 것만 이 순서로 그린다. */
  actions: readonly SelectionAction[];
  /** 버튼 묶음의 접근 가능한 이름. */
  label: string;
}

/** 본문 요소. 글 화면에만 있다. */
const PROSE = '.doc-prose';
/** 층을 붙이는 글 요소(`position: relative`). */
const DOC = '[data-doc]';
/** 툴바 버튼 묶음(포털되어 본문 밖에 있다). */
const TOOLBAR = '[data-selection-toolbar]';

type Chunk = typeof import('./SelectionToolbar');

let options: SelectionToolbarOptions | null = null;
let chunk: Promise<Chunk> | null = null;
/** 마우스 단추를 누른 채 고르는 중인가. */
let dragging = false;
/** 툴바가 떠 있는가(그리기를 요청했고 아직 걷지 않았다). */
let shown = false;
/** 그리기·걷기 요청 순번. 청크를 불러오는 사이에 걷혔으면 늦게 온 그리기를 버린다. */
let request = 0;

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

/** 선택이 시작한 본문 블록과 그 앞 블록들(가까운 것부터). */
function blocksAbove(prose: Element, node: Node): ElementStep[] {
  let block = node instanceof Element ? node : node.parentElement;
  while (block && block.parentElement !== prose) block = block.parentElement;
  const steps: ElementStep[] = [];
  for (; block; block = block.previousElementSibling) {
    steps.push({ name: block.localName, id: block.id });
  }
  return steps;
}

/** 끝(focus)이 시작(anchor)보다 앞에 있는가(위로·왼쪽으로 고름). */
function isBackward(selection: Selection, range: Range): boolean {
  return (
    selection.focusNode === range.startContainer &&
    selection.focusOffset === range.startOffset &&
    !range.collapsed
  );
}

/** 지금 선택으로 그릴 툴바. 띄우지 않을 선택이면 `null`. */
function read(
  current: SelectionToolbarOptions,
): { host: HTMLElement; props: SelectionToolbarProps } | null {
  const selection = document.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  const prose = document.querySelector(PROSE);
  const host = prose?.closest<HTMLElement>(DOC);
  if (!prose || !host) return null;
  const range = selection.getRangeAt(0);
  const text = selection.toString();
  const allowed = toolbarAllowed({
    start: ancestry(range.startContainer),
    end: ancestry(range.endContainer),
    text,
    coarsePointer: window.matchMedia(COARSE_POINTER).matches,
  });
  if (!allowed) return null;

  const placement = toolbarPlacement({
    lines: [...range.getClientRects()],
    column: prose.getBoundingClientRect(),
    backward: isBackward(selection, range),
    lineHeight: parseFloat(getComputedStyle(prose).lineHeight) || 0,
  });
  if (!placement) return null;
  const context = {
    text,
    slug: slugOf(document.getElementById('editor')?.dataset.fileUrl),
    headingId: headingAbove(blocksAbove(prose, range.startContainer)),
  };
  const actions = visibleActions(current.actions, context);
  if (actions.length === 0) return null;

  // 화면 좌표 → 층 좌표. 층은 글 요소를 꽉 채우므로 글 요소의 화면 위치를 뺀다.
  const origin = host.getBoundingClientRect();
  const { box, anchor } = placement;
  return {
    host,
    props: {
      box: {
        top: box.top - origin.top,
        bottom: box.bottom - origin.top,
        left: box.left - origin.left,
        right: box.right - origin.left,
      },
      line: { top: anchor.top - origin.top, bottom: anchor.bottom - origin.top },
      actions,
      context,
      label: current.label,
    },
  };
}

/** 지금 선택으로 다시 그리거나, 띄울 선택이 아니면 걷는다. */
function refresh(): void {
  if (!options) return;
  const view = read(options);
  if (!view) {
    hide();
    return;
  }
  const ticket = ++request;
  shown = true;
  void load().then(({ showSelectionToolbar }) => {
    if (ticket === request) showSelectionToolbar(view.host, view.props);
  });
}

function hide(): void {
  if (!shown) return;
  shown = false;
  request++;
  void chunk?.then(({ hideSelectionToolbar }) => hideSelectionToolbar());
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
 * 선택이 접히면 걷는다. 마우스로 고르는 중이 아니고 툴바가 떠 있으면 자리를 다시 잰다.
 * 키보드(Shift+화살표)로 새로 고른 선택을 띄우는 일은 아직 하지 않는다.
 */
function onSelectionChange(): void {
  if (document.getSelection()?.isCollapsed ?? true) {
    hide();
    return;
  }
  if (!dragging && shown) refresh();
}

function onResize(): void {
  if (shown) refresh();
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

/** 상자와 버튼을 걷고 층을 없앤다. 화면을 옮기기 전(`astro:before-swap`)에 부른다. */
export function closeSelectionToolbar(): void {
  shown = false;
  dragging = false;
  request++;
  void chunk?.then(({ unmountSelectionToolbar }) => unmountSelectionToolbar());
}
