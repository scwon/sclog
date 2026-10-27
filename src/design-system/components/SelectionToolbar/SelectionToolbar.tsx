import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { IconButton } from '../IconButton/IconButton';
import { Popover, PopoverAnchor, PopoverContent } from '../Popover/Popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip/Tooltip';
import { screenBounds } from './selection';
import {
  buttonAnchor,
  TOOLBAR_GAP,
  TOOLBAR_METRICS,
  type Rect,
  type SelectionAction,
  type SelectionContext,
  type ToolbarSize,
} from './selection.logic';

/** 됐다는 표시(체크·`done.label`)를 보이는 시간. 코드 블록 복사 버튼과 같다. */
export const DONE_MS = 2000;

/** `SelectionToolbar`의 props. 좌표는 모두 층(상자를 그리는 요소) 기준이다. */
export interface SelectionToolbarProps {
  /** 고른 줄들을 감싸는 상자. */
  box: Rect;
  /** 버튼을 붙이는 줄(선택의 끝 줄)의 위·아래. */
  line: Pick<Rect, 'top' | 'bottom'>;
  /** 오른쪽 여백이 좁아 버튼을 상자 안쪽 오른쪽 위로 들이는가. */
  inset: boolean;
  /** 툴바(버튼 묶음)의 크기(`toolbarSize`). 세로 위치를 화면 안으로 묶을 때 쓴다. */
  toolbar: ToolbarSize;
  /** 그릴 동작(이미 `when`으로 거른 것). */
  actions: readonly SelectionAction[];
  context: SelectionContext;
  /** 버튼 묶음의 접근 가능한 이름. */
  label: string;
  /**
   * 버튼 묶음을 포털할 요소(소비자가 고른 글 요소). 랜드마크(`main`) 안에 두어 axe `region`을 지킨다. DOM 순서로는
   * 글 끝이라, 고른 자리에서 누른 첫 Tab은 창 틀이 툴바로 보낸다(`focusSelectionToolbar`). 없으면 `document.body`.
   */
  container?: HTMLElement | null;
}

/**
 * 선택 툴바: 고른 줄들을 감싼 상자와, 상자 오른쪽 바깥에 붙은 동작 버튼들. 상자는 층 안에 그려 글자를 밀지 않고
 * (`pointer-events: none`), 버튼은 가상 기준점(상자 오른쪽 가장자리, 끝 줄 높이)에 붙은 팝오버로 띄운다. 오른쪽 여백이
 * 좁으면(`inset`) 상자 안쪽 오른쪽 위로 들이고, 상자가 화면보다 길면 스크롤해도 버튼이 화면 안에 남는다.
 * 떠도 포커스를 가져가지 않고, 버튼을 눌러도 선택이 풀리지 않는다. Tab으로 들어갈 수 있다.
 * 닫힘·Esc는 이 컴포넌트가 아니라 그리는 쪽(`selection.ts`)과 창 틀의 단축키가 정한다.
 */
export function SelectionToolbar({
  box,
  line,
  inset,
  toolbar,
  actions,
  context,
  label,
  container,
}: SelectionToolbarProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  // 스크롤하면 Popper가 다시 부른다. 상자 요소의 지금 화면 위치로 끝 줄을 옮겨 기준점을 다시 잰다(화면 안으로 묶기).
  const anchor = useMemo(
    () => ({
      current: {
        getBoundingClientRect() {
          const frame = boxRef.current?.getBoundingClientRect();
          if (!frame) return new DOMRect();
          const shift = frame.top - box.top;
          const point = buttonAnchor({
            box: { top: frame.top, bottom: frame.bottom, left: frame.left, right: frame.right },
            line: { top: line.top + shift, bottom: line.bottom + shift },
            inset,
            screen: screenBounds(),
            toolbar,
          });
          return DOMRect.fromRect({
            x: point.left,
            y: point.top,
            width: 0,
            height: point.bottom - point.top,
          });
        },
      },
    }),
    [box.top, line.top, line.bottom, inset, toolbar],
  );

  return (
    <>
      <div
        ref={boxRef}
        data-selection-box
        className="pointer-events-none absolute rounded-md border border-border-strong bg-state-current"
        style={{
          top: box.top,
          left: box.left,
          width: box.right - box.left,
          height: box.bottom - box.top,
        }}
      />
      <Popover open>
        <PopoverAnchor virtualRef={anchor} />
        <PopoverContent
          data-selection-toolbar
          container={container}
          role="toolbar"
          aria-orientation="vertical"
          aria-label={label}
          side={inset ? 'left' : 'right'}
          align="start"
          sideOffset={TOOLBAR_GAP}
          className="z-15 flex flex-col"
          // 치수는 `toolbarSize`가 자리를 잴 때 쓰는 값과 같아야 하므로 한 상수에서 가져온다.
          style={{
            gap: TOOLBAR_METRICS.gap,
            padding: TOOLBAR_METRICS.padding,
            borderWidth: TOOLBAR_METRICS.border,
          }}
          // 포커스는 본문에 둔다. Esc·바깥 누름으로 닫는 일은 선택 상태를 보는 쪽이 한다.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          // 버튼을 눌러도 문서 선택이 풀리지 않게 한다(클릭은 그대로 간다).
          onMouseDown={(event: MouseEvent) => event.preventDefault()}
        >
          {actions.map((action) => (
            <ActionButton key={action.id} action={action} context={context} />
          ))}
        </PopoverContent>
      </Popover>
    </>
  );
}

/** 동작 버튼 하나. 동작이 됐다고 하면 `DONE_MS` 동안 `done`의 이름·아이콘으로 바뀐다. */
function ActionButton({ action, context }: { action: SelectionAction; context: SelectionContext }) {
  const [done, setDone] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const shown = done && action.done ? action.done : action;
  const run = async () => {
    if (!(await action.run(context)) || !action.done) return;
    window.clearTimeout(timer.current);
    setDone(true);
    timer.current = window.setTimeout(() => setDone(false), DONE_MS);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <IconButton
          label={shown.label}
          data-action={action.id}
          data-done={done ? '' : undefined}
          className="data-done:text-accent-text"
          style={{ width: TOOLBAR_METRICS.button, height: TOOLBAR_METRICS.button }}
          onClick={run}
        >
          {shown.icon}
        </IconButton>
      </TooltipTrigger>
      <TooltipContent side="top">{shown.label}</TooltipContent>
    </Tooltip>
  );
}

/** 층 하나와 그 React 루트. 화면을 옮기면 글이 바뀌므로 `unmountSelectionToolbar`로 걷고 다음 선택에 새로 만든다. */
let mounted: { host: HTMLElement; layer: HTMLElement; root: Root } | null = null;

/**
 * `host`(소비자가 고른 글 요소, `position: relative`) 맨 앞에 층을 두고 선택 툴바를 그린다. 버튼 묶음은 `host` 끝으로 포털한다. 층은 `position: absolute`라
 * 레이아웃에 끼지 않고, 본문(`.doc-prose`) 안에는 넣지 않는다(줄 번호·읽는 위치 블록이 바뀐다).
 */
export function showSelectionToolbar(host: HTMLElement, props: SelectionToolbarProps): void {
  if (mounted?.host !== host) {
    unmountSelectionToolbar();
    const layer = document.createElement('div');
    layer.dataset.selectionLayer = '';
    layer.className = 'pointer-events-none absolute inset-0';
    host.prepend(layer);
    mounted = { host, layer, root: createRoot(layer) };
  }
  // 고른 글자가 바뀌면 버튼의 됐다는 표시도 처음으로 돌린다.
  mounted.root.render(<SelectionToolbar key={props.context.text} container={host} {...props} />);
}

/** 상자와 버튼을 걷는다. 층은 다음 선택을 위해 남긴다. */
export function hideSelectionToolbar(): void {
  mounted?.root.render(null);
}

/** 층과 React 루트를 없앤다. 화면을 옮기기 전(`astro:before-swap`)에 부른다. */
export function unmountSelectionToolbar(): void {
  mounted?.root.unmount();
  mounted?.layer.remove();
  mounted = null;
}
