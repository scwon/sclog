import type { FindBlock, FindMatch, HorizontalSpan, VerticalSpan } from './find.logic';

/**
 * 찾기 줄의 DOM 쪽: 에디터에서 화면에 보이는 글자를 블록별 텍스트 노드로 모으고, 일치를 CSS Custom Highlight API로
 * 칠한다. 규칙(일치·순환·위치 글자·스크롤 거리)은 `find.logic.ts`의 순수 함수다. 찾기 줄 청크(`FindWidget`)만 가져온다.
 */

/** 모든 일치를 칠하는 Highlight 이름(`--marker` 형광 띠). 2층 `ide.css`의 `::highlight(find-match)`가 칠한다. */
export const MATCH_HIGHLIGHT = 'find-match';
/** 지금 일치를 칠하는 Highlight 이름(`--accent` 바탕, `--on-accent` 글자). */
export const CURRENT_HIGHLIGHT = 'find-current';

/**
 * 찾지 않는 요소. 화면에 없는 글자(`hidden`, 스크린 리더 전용 `.sr-only`), 장식인 줄 번호(`.flow-ln`), 파일 내용이 아닌
 * 경로 표시줄(`.ide-crumbs`), 글자가 아닌 요소다. `aria-hidden`이어도 보이는 글자(frontmatter 줄)는 찾는다.
 */
const SKIP = '[hidden], .sr-only, .flow-ln, .ide-crumbs, script, style, template, noscript, svg';

/** 블록을 만들지 않는 `display` 값. 이 요소 안의 글자는 바깥 블록의 글자와 이어진다. */
function isInline(display: string): boolean {
  return display.startsWith('inline') || display === 'contents' || display.startsWith('ruby');
}

/** 닫힌 `<details>` 안에서 요약(첫 `<summary>`)이 아닌 자식인가. 브라우저 찾기와 달리 열어 찾지 않는다. */
function inClosedDetails(element: Element): boolean {
  const parent = element.parentElement;
  return (
    parent instanceof HTMLDetailsElement &&
    !parent.open &&
    parent.querySelector(':scope > summary') !== element
  );
}

/**
 * `root` 안에서 화면에 보이는 글자를 블록(문단·제목·목록 줄 등)마다 텍스트 노드 목록으로 모은다. 블록은 그 글자를
 * 감싼 가장 가까운 블록 요소(`display`가 인라인이 아닌 요소)이고, 중간에 다른 블록이나 `<br>`이 끼면 나뉜다.
 * `display: none`·`visibility: hidden`인 요소와 `SKIP`, 닫힌 `<details>`의 본문은 통째로 뺀다.
 */
export function visibleBlocks(root: HTMLElement): FindBlock<Text>[] {
  const styles = new Map<Element, CSSStyleDeclaration>();
  const style = (element: Element) => {
    let value = styles.get(element);
    if (!value) {
      value = getComputedStyle(element);
      styles.set(element, value);
    }
    return value;
  };
  /** 글자가 속한 블록 요소. */
  const blockOf = (node: Node): Element => {
    let element = node.parentElement;
    while (element && element !== root && isInline(style(element).display)) {
      element = element.parentElement;
    }
    return element ?? root;
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!(node instanceof Element)) return NodeFilter.FILTER_ACCEPT;
      if (node.matches(SKIP) || inClosedDetails(node)) return NodeFilter.FILTER_REJECT;
      const { display, visibility } = style(node);
      if (display === 'none' || visibility === 'hidden') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const blocks: FindBlock<Text>[] = [];
  let block: FindBlock<Text> | null = null;
  let owner: Element | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof HTMLBRElement) {
      block = null;
      continue;
    }
    if (!(node instanceof Text) || !node.data) continue;
    const next = blockOf(node);
    if (!block || next !== owner) {
      block = [];
      blocks.push(block);
      owner = next;
    }
    block.push({ node, text: node.data });
  }
  return blocks;
}

/** 일치를 `Range`로 바꾼다. */
export function toRange({ start, end }: FindMatch<Text>): Range {
  const range = new Range();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  return range;
}

/** 두 범위의 시작 자리를 문서 순서로 견준다(`a`가 앞이면 음수). `resumeMatch`에 넘긴다. */
export function compareStart(a: Range, b: Range): number {
  return a.compareBoundaryPoints(Range.START_TO_START, b);
}

/**
 * 일치를 칠한다. 모든 일치는 `find-match`, 지금 일치(`current`)는 우선순위가 높은 `find-current`에 담는다. 다른 칠하기를
 * 지우지 않게 `CSS.highlights.clear()` 대신 두 이름만 바꾼다.
 */
export function paint(ranges: readonly Range[], current: number): void {
  if (ranges.length === 0) {
    unpaint();
    return;
  }
  CSS.highlights.set(MATCH_HIGHLIGHT, new Highlight(...ranges));
  const now = ranges[current];
  if (!now) {
    CSS.highlights.delete(CURRENT_HIGHLIGHT);
    return;
  }
  const highlight = new Highlight(now);
  highlight.priority = 1;
  CSS.highlights.set(CURRENT_HIGHLIGHT, highlight);
}

/** 찾기 줄이 칠한 것을 지운다. */
export function unpaint(): void {
  CSS.highlights.delete(MATCH_HIGHLIGHT);
  CSS.highlights.delete(CURRENT_HIGHLIGHT);
}

/**
 * 에디터에서 위쪽 막대(제목 표시줄·탭·경로 표시줄)와 아래 막대(상태줄)에 가리지 않고 보이는 세로 영역(뷰포트 좌표).
 * 위 끝은 경로 표시줄(`.ide-crumbs`, 에디터 위에 붙어 있다)의 아래 끝이고, 없으면 에디터 위 여백(탭까지의 높이)이다.
 * 아래 끝은 에디터 아래 여백(상태줄 높이)만큼 뺀다.
 */
export function visibleArea(editor: HTMLElement): VerticalSpan {
  const { paddingTop, paddingBottom } = getComputedStyle(editor);
  const crumbs = editor.querySelector('.ide-crumbs');
  const top = crumbs ? crumbs.getBoundingClientRect().bottom : parseFloat(paddingTop) || 0;
  return { top, bottom: window.innerHeight - (parseFloat(paddingBottom) || 0) };
}

/**
 * 일치를 감싼 가장 가까운 가로 스크롤 컨테이너(가로로 넘치는 코드 블록 등). `overflow-x`가 `auto`·`scroll`이고 실제로
 * 넘치는 요소만 본다. 에디터(`root`) 안에 없으면 `null`이다.
 */
export function horizontalScroller(range: Range, root: HTMLElement): HTMLElement | null {
  const start = range.startContainer;
  for (
    let element = start instanceof Element ? start : start.parentElement;
    element && element !== root;
    element = element.parentElement
  ) {
    if (!(element instanceof HTMLElement) || element.scrollWidth <= element.clientWidth) continue;
    const { overflowX } = getComputedStyle(element);
    if (overflowX === 'auto' || overflowX === 'scroll') return element;
  }
  return null;
}

/** 스크롤 컨테이너에서 글자가 보이는 가로 영역(뷰포트 좌표): 테두리 안쪽, 세로 스크롤바 앞까지다. */
export function horizontalArea(scroller: HTMLElement): HorizontalSpan {
  const left = scroller.getBoundingClientRect().left + scroller.clientLeft;
  return { left, right: left + scroller.clientWidth };
}
