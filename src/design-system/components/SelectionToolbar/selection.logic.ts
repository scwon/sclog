import type { ReactNode } from 'react';

/**
 * 선택 툴바의 순수 판정. DOM을 읽는 일은 `selection.ts`가 하고, 여기는 그 결과(요소 이름·rect 숫자)만 받는다.
 */

/** 동작이 받는 선택 정보. */
export interface SelectionContext {
  /** 고른 글자(`Selection.toString()`). */
  text: string;
  /** 글 slug. 에디터 루트의 `data-file-url`에서 꺼낸다. */
  slug: string | null;
  /** 선택이 시작한 블록에서 위로 가장 가까운 제목의 id(절 링크·연관 검색용). */
  headingId: string | null;
}

/**
 * 선택 툴바의 동작 하나. 툴바는 `when`이 참인 동작을 등록한 순서대로 버튼으로 그린다.
 * 글자(`label`, `done.label`)는 소비자가 넘긴다(디자인 시스템 안에 문구를 두지 않는다).
 */
export interface SelectionAction {
  id: string;
  /** 버튼의 접근 가능한 이름이자 툴팁. */
  label: string;
  /** 18px 장식 아이콘. */
  icon: ReactNode;
  /** 휴대폰(coarse 포인터)에서도 쓰는 동작인가. 켜진 동작이 생기면 아래 고정 바를 연다(아직 없다). */
  mobile: boolean;
  when(ctx: SelectionContext): boolean;
  /** 동작을 한다. 참을 돌려주면 됐다는 표시(`done`)로 잠시 바꾼다. */
  run(ctx: SelectionContext): boolean | Promise<boolean>;
  /** 됐을 때 잠시 바꿔 보일 이름과 아이콘(복사 → 복사됨·체크). */
  done?: { label: string; icon: ReactNode };
}

/** 툴바에 그릴 동작: `when`이 참인 것만 등록한 순서대로. */
export function visibleActions(
  actions: readonly SelectionAction[],
  ctx: SelectionContext,
): SelectionAction[] {
  return actions.filter((action) => action.when(ctx));
}

/** 글 파일 주소(`/blog/<slug>/`)의 slug. 주소가 없거나 비면 `null`. */
export function slugOf(fileUrl: string | undefined): string | null {
  return fileUrl?.split('/').filter(Boolean).at(-1) ?? null;
}

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/**
 * 선택이 시작한 본문 블록부터 위로 가며 처음 만나는 제목의 id. id 없는 제목은 건너뛴다.
 *
 * `children`은 본문 요소의 자식 노드를 차례대로 옮긴 것이고 글자 노드(블록 사이 줄바꿈)는 `null`이다. `start`는 선택이
 * 시작한 자식의 자리다: 시작 노드를 품은 자식의 번호, 또는 시작 노드가 본문 요소 자신이면 그 오프셋. 오프셋이 블록 사이
 * 글자 노드나 마지막 자식 뒤를 가리키면 선택은 그 뒤 블록에서 시작하므로, 그 뒤 첫 블록(없으면 마지막 블록)부터 본다.
 */
export function headingAbove(
  children: readonly (ElementStep | null)[],
  start: number,
): string | null {
  let index = start;
  while (index < children.length && children[index] === null) index++;
  for (index = Math.min(index, children.length - 1); index >= 0; index--) {
    const block = children[index];
    if (block && HEADING_TAGS.has(block.name) && block.id) return block.id;
  }
  return null;
}

/** 선택 끝이 놓인 노드에서 바깥으로 올라가며 만나는 요소 하나. */
export interface ElementStep {
  /** 소문자 태그 이름(`localName`). */
  name: string;
  id?: string;
  classes?: readonly string[];
}

/** 띄울지 판정하는 데 쓰는 선택 정보. */
export interface SelectionFacts {
  /** 선택 시작 노드의 조상 요소들(가까운 것부터). */
  start: readonly ElementStep[];
  /** 선택 끝 노드의 조상 요소들(가까운 것부터). */
  end: readonly ElementStep[];
  /** 고른 글자. */
  text: string;
  /** `(pointer: coarse)`인 화면인가. */
  coarsePointer: boolean;
  /** 본문 안이어도 띄우지 않는 요소의 클래스(소비자가 넘긴다. 예: 제 복사 버튼이 있는 코드 블록 틀). 없으면 태그만 본다. */
  excludedClasses?: readonly string[];
}

/** 본문 요소의 클래스. 디자인 시스템 본문 스타일(`styles/prose.css`)이 붙는 요소다. */
export const PROSE_CLASS = 'doc-prose';

/** 글 본문 요소(`.doc-prose`)인가. */
function isProse(step: ElementStep): boolean {
  return step.classes?.includes(PROSE_CLASS) ?? false;
}

/**
 * 본문 안이어도 툴바를 띄우지 않는 요소: 코드 블록(`pre`), 표, 제목, 목차. 문장 속 인라인 `code`는 일반 글자로 본다.
 * 소비자가 붙이는 요소(코드 블록 머리처럼 제 동작이 있는 것)는 클래스로 더 받는다.
 */
const EXCLUDED_TAGS = new Set(['pre', 'table', 'nav', ...HEADING_TAGS]);

function isExcluded(step: ElementStep, excludedClasses: readonly string[]): boolean {
  return (
    EXCLUDED_TAGS.has(step.name) ||
    excludedClasses.some((name) => step.classes?.includes(name) ?? false)
  );
}

/** 선택 끝 하나가 본문 안 일반 글자에 있는가: 본문 요소에 닿기 전에 제외 요소를 만나지 않는다. */
function inBody(path: readonly ElementStep[], excludedClasses: readonly string[]): boolean {
  for (const step of path) {
    if (isProse(step)) return true;
    if (isExcluded(step, excludedClasses)) return false;
  }
  return false;
}

/** 툴바를 띄우는 가장 짧은 선택(공백을 뺀 글자 수). 두 글자는 낱말 하나를 더블클릭한 정도라 띄우지 않는다. */
export const MIN_SELECTED_CHARS = 3;

/**
 * 선택 툴바를 띄울 선택인가: 시작과 끝이 모두 본문 안 일반 글자에 있고(코드 블록·표·제목·목차와 제외 클래스 밖), 공백을 뺀 글자가
 * `MIN_SELECTED_CHARS` 이상이며, 터치 화면이 아니다(OS 선택 메뉴와 겹친다).
 */
export function toolbarAllowed(facts: SelectionFacts): boolean {
  if (facts.coarsePointer) return false;
  if ([...facts.text.replace(/\s/g, '')].length < MIN_SELECTED_CHARS) return false;
  const excluded = facts.excludedClasses ?? [];
  return inBody(facts.start, excluded) && inBody(facts.end, excluded);
}

/** 화면 좌표의 사각형(`DOMRect`에서 쓰는 네 변만). */
export interface Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** 자리 계산에 쓰는 화면 좌표. */
export interface PlacementInput {
  /** 선택 범위의 `getClientRects()`. */
  lines: readonly Rect[];
  /** 본문 단(`.doc-prose`)의 가로 범위. */
  column: Pick<Rect, 'left' | 'right'>;
  /** 끝(`focusNode`)이 시작(`anchorNode`)보다 앞에 있는가(위로 드래그). */
  backward: boolean;
  /**
   * 본문 줄 높이(px). `getClientRects()`는 글자 높이만 주고 선택색은 줄 상자 높이로 칠해지므로, 낮은 rect를 이
   * 높이까지 넓혀 잰다. 없으면 넓히지 않는다.
   */
  lineHeight?: number;
  /** 버튼이 보이는 화면 범위: 위는 탭·경로 표시줄 아래, 아래는 창 아래 끝, 오른쪽은 스크롤 막대를 뺀 창 오른쪽 끝. */
  screen: ScreenBounds;
  /** 툴바(버튼 묶음)의 크기. `toolbarSize`로 잰다. */
  toolbar: ToolbarSize;
}

/** 버튼이 보이는 화면 범위(화면 좌표). */
export interface ScreenBounds {
  top: number;
  bottom: number;
  right: number;
}

/** 툴바(버튼 묶음)의 폭과 높이(px). */
export interface ToolbarSize {
  width: number;
  height: number;
}

/** 상자와 버튼 자리. 모두 화면 좌표다. */
export interface Placement {
  /** 고른 줄들을 감싸는 상자. */
  box: Rect;
  /** 선택의 끝 줄(마우스를 놓은 줄). 스크롤하면 그리는 쪽이 이 줄로 `buttonAnchor`를 다시 잰다. */
  line: Pick<Rect, 'top' | 'bottom'>;
  /** 오른쪽 여백이 좁아 버튼을 상자 안쪽 오른쪽 위로 들였는가. */
  inset: boolean;
  /**
   * 버튼을 띄우는 기준점: 상자 오른쪽 가장자리에서 폭이 0이다. 바깥이면 끝 줄 높이(툴바는 기준점 오른쪽), 들였으면
   * 상자 위 끝에서 `TOOLBAR_GAP` 아래인 점(툴바는 기준점 왼쪽)이다. 세로는 화면 안으로 묶는다.
   */
  anchor: Rect;
}

/** 툴바가 기준점에서 떨어지는 간격(px). 바깥이면 상자 오른쪽 가장자리에서, 들였으면 상자 안쪽 가장자리에서 띄운다. */
export const TOOLBAR_GAP = 6;

/**
 * 툴바의 치수(px). 크기 계산(`toolbarSize`)과 그리는 쪽(`SelectionToolbar.tsx`의 인라인 스타일)이 모두 이 값을 쓴다.
 * 버튼은 정사각이고 세로로 쌓는다.
 */
export const TOOLBAR_METRICS = { button: 30, gap: 2, padding: 2, border: 1 } as const;

/** 버튼 `count`개짜리 툴바의 크기(`TOOLBAR_METRICS`로 잰다). */
export function toolbarSize(count: number): ToolbarSize {
  const { button, gap, padding, border } = TOOLBAR_METRICS;
  const frame = 2 * (padding + border);
  return { width: button + frame, height: button * count + gap * Math.max(count - 1, 0) + frame };
}

/**
 * 툴바 위 변을 화면 안으로 묶는다. 화면 안으로 옮기더라도 상자 밖으로는 나가지 않는다(상자가 통째로 화면 밖이면
 * 버튼도 상자를 따라 밖에 있다). 원래 자리가 이미 화면 안이면 그대로 둔다.
 */
function clampTop(top: number, height: number, box: Rect, screen: ScreenBounds): number {
  const wanted = Math.min(Math.max(top, screen.top), screen.bottom - height);
  if (wanted > top) return Math.min(wanted, Math.max(top, box.bottom - height));
  if (wanted < top) return Math.max(wanted, Math.min(top, box.top));
  return top;
}

/** `buttonAnchor`의 입력. 모두 화면 좌표다. */
export interface AnchorInput {
  box: Rect;
  line: Pick<Rect, 'top' | 'bottom'>;
  inset: boolean;
  screen: ScreenBounds;
  toolbar: ToolbarSize;
}

/**
 * 버튼 기준점(`Placement.anchor`)을 잰다. 그리는 쪽은 스크롤할 때마다 상자의 지금 화면 위치로 이 함수를 다시 불러,
 * 상자가 화면보다 길어도 버튼이 화면 안에 남게 한다.
 */
export function buttonAnchor({ box, line, inset, screen, toolbar }: AnchorInput): Rect {
  const top = inset ? box.top + TOOLBAR_GAP : line.top;
  const height = inset ? 0 : line.bottom - line.top;
  const clamped = clampTop(top, toolbar.height, box, screen);
  return { top: clamped, bottom: clamped + height, left: box.right, right: box.right };
}

/** 상자가 글자에서 떨어지는 여백. 왼쪽 여백이 줄 번호 열을 덮지 않을 만큼만 둔다. */
export const BOX_PADDING = { x: 10, y: 6 } as const;

/**
 * 맨 아래 줄: 아래 변이 가장 낮은 rect. 여러 줄을 감싼 요소 rect와 아래 변이 같으면 위 변이 낮은(짧은) 쪽이 줄이다.
 */
function lastLine(lines: readonly Rect[]): Rect {
  return lines.reduce((best, line) =>
    line.bottom > best.bottom || (line.bottom === best.bottom && line.top > best.top) ? line : best,
  );
}

/** 맨 위 줄: 위 변이 가장 높은 rect. 위 변이 같으면 아래 변이 높은(짧은) 쪽이 줄이다. */
function firstLine(lines: readonly Rect[]): Rect {
  return lines.reduce((best, line) =>
    line.top < best.top || (line.top === best.top && line.bottom < best.bottom) ? line : best,
  );
}

/** 글자 rect를 줄 상자 높이까지 위아래로 같은 만큼 넓힌다. 이미 줄보다 높은(요소) rect는 그대로 둔다. */
function toLineBox(line: Rect, lineHeight: number): Rect {
  const leading = (lineHeight - (line.bottom - line.top)) / 2;
  return leading > 0 ? { ...line, top: line.top - leading, bottom: line.bottom + leading } : line;
}

/**
 * 선택 rect 목록에서 상자와 버튼 자리를 계산한다. 상자는 첫 줄 위에서 끝 줄 아래까지, 폭은 본문 단 전체다.
 * 버튼은 상자 오른쪽, 선택의 끝 줄(마우스를 놓은 줄) 높이다. 오른쪽 여백이 툴바 폭보다 좁으면 상자 안쪽 오른쪽 위로
 * 들이고, 세로는 화면 안으로 묶는다. 쓸 만한 rect가 없으면 `null`.
 */
export function toolbarPlacement({
  lines,
  column,
  backward,
  lineHeight = 0,
  screen,
  toolbar,
}: PlacementInput): Placement | null {
  const usable = lines
    .filter((line) => line.bottom > line.top)
    .map((line) => toLineBox(line, lineHeight));
  if (usable.length === 0) return null;
  const top = Math.min(...usable.map((line) => line.top));
  const bottom = Math.max(...usable.map((line) => line.bottom));
  const box = {
    top: top - BOX_PADDING.y,
    bottom: bottom + BOX_PADDING.y,
    left: column.left - BOX_PADDING.x,
    right: column.right + BOX_PADDING.x,
  };
  const end = backward ? firstLine(usable) : lastLine(usable);
  const line = { top: end.top, bottom: end.bottom };
  const inset = box.right + TOOLBAR_GAP + toolbar.width > screen.right;
  return { box, line, inset, anchor: buttonAnchor({ box, line, inset, screen, toolbar }) };
}
