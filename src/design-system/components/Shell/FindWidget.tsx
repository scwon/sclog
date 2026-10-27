import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type Ref,
} from 'react';
import { useStore } from '@nanostores/react';
import { REDUCED_MOTION } from '../../media';
import { $findQuery, setFindQuery } from '../../stores/find';
import { IconButton } from '../IconButton/IconButton';
import {
  compareStart,
  horizontalArea,
  horizontalScroller,
  paint,
  toRange,
  unpaint,
  visibleArea,
  visibleBlocks,
} from './find';
import {
  findInBlocks,
  findPosition,
  firstVisibleMatch,
  resumeMatch,
  scrollToCenter,
  scrollToCenterX,
  stepMatch,
} from './find.logic';
import { ArrowDownIcon, ArrowUpIcon, CloseIcon } from './icons';
import type { Platform } from './shortcuts.logic';

/** 창 틀이 찾기 줄에 넘기는 키 동작. 키 판정은 창 틀의 `document` 리스너 하나가 하고, 찾기 줄은 그 결과만 받는다. */
export interface FindHandle {
  /** 입력창에 포커스를 주고 글자를 모두 고른다. 열린 찾기 줄에서 ⌘F를 다시 누르면 부른다. */
  focus: () => void;
  /** 다음(`1`)·이전(`-1`) 일치로 간다. 끝에서 처음으로 돈다. */
  move: (delta: -1 | 1) => void;
}

/**
 * 찾기 줄을 열 때 고를 일치. `next`는 화면 맨 위에 보이는 일치, `prev`는 그 바로 앞 일치다(찾기 줄이 닫힌 채 ⇧⌘G).
 */
export type FindStart = 'next' | 'prev';

/** `FindWidget`의 props. */
export interface FindWidgetProps {
  /** 찾는 영역(에디터 루트)의 id. */
  editorId: string;
  /** 툴팁 키 표기를 고르는 플랫폼. */
  platform: Platform;
  /** 열 때 고를 일치. 기본값은 `next`다. 연 뒤 검색어가 바뀌면 늘 화면 맨 위 일치부터 시작한다. */
  start?: FindStart;
  /** 닫기 버튼을 눌렀다. 창 틀이 찾기 줄을 닫고 포커스를 연 자리로 돌려준다. */
  onClose: () => void;
  ref?: Ref<FindHandle>;
}

/** 키 표기를 보일 수 있는 포인터(마우스·트랙패드). 터치 화면에서는 툴팁에 키를 넣지 않는다. */
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

/** 마우스를 쓰는 화면인가. 찾기 줄은 브라우저에서만 그리므로 서버 값은 쓰이지 않는다. */
function useFinePointer(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(FINE_POINTER);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(FINE_POINTER).matches,
    () => true,
  );
}

/**
 * 보이는 글자를 바꾸는 속성. `open`은 `<details>`, `hidden`은 흐름 로그의 접힌 줄, `class`·`style`은 `display`를 바꾸는
 * 스크립트다. 이 속성이 바뀌면 찾기 줄이 글자를 다시 모은다.
 */
const VISIBILITY_ATTRIBUTES = ['open', 'hidden', 'class', 'style'];

/**
 * 지금 일치가 보이는 영역 밖이면 그 줄을 보이는 영역 가운데로 옮긴다. 움직임 줄이기 설정에서는 바로 옮긴다.
 * 가로로 넘치는 코드 블록 안에서 가로로 화면 밖이면 그 블록을 가로로도 옮겨 일치를 보이는 폭 가운데에 둔다.
 * 일치가 찾기 줄과 가로로 겹치면 찾기 줄 아래부터를 보이는 영역으로 본다(찾기 줄에 가린 일치도 옮긴다).
 */
function reveal(range: Range | undefined, editor: HTMLElement, widget: HTMLElement | null): void {
  if (!range) return;
  const behavior = window.matchMedia(REDUCED_MOTION).matches ? 'instant' : 'smooth';
  const rect = range.getBoundingClientRect();
  // 가로 먼저: 부드러운 스크롤은 아직 움직이지 않았으므로 찾기 줄과 겹치는지는 옮긴 뒤 자리(`shift`만큼)로 본다.
  const scroller = horizontalScroller(range, editor);
  const shift = scroller ? scrollToCenterX(rect, horizontalArea(scroller)) : 0;
  if (scroller && shift !== 0) scroller.scrollBy({ left: shift, behavior });
  const view = visibleArea(editor);
  const cover = widget?.getBoundingClientRect();
  if (cover && rect.right - shift > cover.left && rect.left - shift < cover.right)
    view.top = Math.max(view.top, cover.bottom);
  const distance = scrollToCenter(rect, view);
  if (distance !== 0) window.scrollBy({ top: distance, behavior });
}

/**
 * 찾기 줄. 에디터에 연 파일 안에서 화면에 보이는 글자를 찾아, 모든 일치를 형광 띠로, 지금 일치를 코랄로 칠하고
 * `3/12`로 위치를 보인다. 칠하기는 CSS Custom Highlight API라 본문 DOM을 건드리지 않는다. 일치 규칙은 검색 화면과
 * 같다(`find.logic.ts`). 창 틀이 ⌘F로 처음 열 때 불러오는 청크라 `React.lazy`로만 가져온다. 열리면 입력창에 포커스를
 * 주고 글자를 모두 고르며, 닫히면(언마운트) 칠한 것을 지운다. Enter·Shift+Enter·Esc는 창 틀의 단축키 리스너가 받아
 * `FindHandle`로 넘긴다.
 */
export function FindWidget({ editorId, platform, start = 'next', onClose, ref }: FindWidgetProps) {
  const query = useStore($findQuery);
  const input = useRef<HTMLInputElement>(null);
  const widget = useRef<HTMLElement>(null);
  const fine = useFinePointer();

  // 찾기 줄이 열린 채 에디터의 보이는 글자가 바뀐 때(`<details>` 열기, 흐름 로그 접기). 그때의 지금 일치(`anchor`)를
  // 남겨 다시 모은 뒤에도 이어 간다. 검색어가 그 뒤 바뀌면(`query`가 다르면) 쓰지 않는다.
  const [refresh, setRefresh] = useState<{ query: string; anchor: Range | undefined } | null>(null);
  const currentRange = useRef<Range | undefined>(undefined);

  // 검색어가 바뀌면 다시 찾고, 화면 맨 위에 보이는 일치부터 시작한다. 보이는 글자가 바뀌어 다시 찾으면(`resumed`) 앞
  // 지금 일치와 같거나 그 뒤의 첫 일치에서 이어 간다. 찾기 줄은 브라우저에서만 그리므로 그릴 때 에디터 글자를 읽는다.
  const found = useMemo(() => {
    const root = document.getElementById(editorId);
    if (!root || !query.trim()) return { root, ranges: [], start: -1, resumed: false };
    const ranges = findInBlocks(visibleBlocks(root), query).map(toRange);
    const anchor = refresh?.query === query ? refresh.anchor : undefined;
    if (anchor)
      return { root, ranges, start: resumeMatch(ranges, anchor, compareStart), resumed: true };
    const rects = ranges.map((range) => range.getBoundingClientRect());
    return { root, ranges, start: firstVisibleMatch(rects, visibleArea(root).top), resumed: false };
  }, [editorId, query, refresh]);
  const total = found.ranges.length;
  // 열 때 찾은 결과. `start`는 이 결과에만 쓰고, 검색어가 바뀐 뒤에는 화면 맨 위 일치부터 시작한다.
  const [opening] = useState(found);
  const begin =
    start === 'prev' && found === opening ? stepMatch(found.start, total, -1) : found.start;
  // 다음·이전으로 고른 일치. 그 뒤 검색어가 바뀌면(`found`가 바뀌면) 버리고 시작 일치로 돌아간다.
  const [picked, setPicked] = useState<{ found: typeof found; index: number } | null>(null);
  const current = picked?.found === found ? picked.index : begin;

  // 칠하기와 스크롤은 지금 일치가 바뀔 때마다 맞춘다. 보이는 글자가 바뀌어 다시 모은 때는 칠하기만 맞추고 스크롤하지
  // 않는다(독자가 연 `<details>` 자리를 지킨다). 닫히면(언마운트) 칠한 것을 지운다.
  const stay = found.resumed && picked?.found !== found;
  useEffect(() => {
    paint(found.ranges, current);
    currentRange.current = found.ranges[current];
    if (found.root && !stay) reveal(found.ranges[current], found.root, widget.current);
  }, [found, current, stay]);
  useEffect(() => unpaint, []);

  // 에디터의 보이는 글자가 바뀌면 다시 모은다. 바뀜은 한 프레임에 한 번만 센다.
  useEffect(() => {
    const root = document.getElementById(editorId);
    if (!root) return;
    let frame = 0;
    const observer = new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setRefresh({ query: $findQuery.get(), anchor: currentRange.current });
      });
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributeFilter: VISIBILITY_ATTRIBUTES,
    });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [editorId]);

  // 위치 글자의 live 영역은 먼저 빈 채로 그리고 다음 프레임에 채운다. 내용과 함께 처음 그린 live 영역은 스크린 리더가
  // 바뀜으로 알리지 않아, 마지막 검색어로 열 때 첫 `3/12`가 읽히지 않을 수 있다.
  const [live, setLive] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const focus = useCallback(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  useEffect(focus, [focus]);

  const move = (delta: -1 | 1) => {
    const next = stepMatch(current, total, delta);
    if (next >= 0) setPicked({ found, index: next });
  };
  useImperativeHandle(ref, () => ({ focus, move }));

  const keys = {
    prev: platform === 'mac' ? '⇧Enter' : 'Shift+Enter',
    next: 'Enter',
    close: 'Esc',
  };
  const tip = (label: string, key: string) => (fine ? `${label} (${key})` : undefined);
  const position = findPosition(query, current, total);

  return (
    <search
      ref={widget}
      aria-label="파일에서 찾기"
      className="fixed top-[calc(var(--editor-top)+var(--bar-height-sm))] right-4 z-25 flex h-9.5 w-[min(360px,calc(100%-var(--editor-left)-32px))] items-center gap-1 rounded-b-(--corner-md) border border-t-0 border-border-strong bg-surface-raised pr-1 pl-2 font-mono shadow-[0_10px_28px_-10px_var(--scrim)] max-[759px]:right-2 max-[759px]:w-[calc(100%-var(--editor-left)-16px)]"
    >
      <input
        ref={input}
        data-find-input=""
        type="search"
        value={query}
        onChange={(event) => setFindQuery(event.target.value)}
        placeholder="파일에서 찾기"
        aria-label="파일에서 찾기"
        autoComplete="off"
        spellCheck={false}
        className="h-6.5 min-w-0 flex-1 rounded-sm border border-border bg-surface px-2 text-[12.5px] text-text outline-none placeholder:text-text-muted focus:border-accent [&::-webkit-search-cancel-button]:hidden"
      />
      <span
        aria-live="polite"
        className="min-w-[4.5em] flex-none px-1 text-right text-[11.5px] whitespace-nowrap text-text-soft"
      >
        {live ? position : ''}
      </span>
      <IconButton
        label="이전 일치"
        title={tip('이전 일치', keys.prev)}
        disabled={total === 0}
        // 누르는 동안 포커스가 입력창을 떠나지 않게 해 이어서 Enter로 옮길 수 있게 한다.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => move(-1)}
        className="size-7 flex-none [&_svg]:size-4"
      >
        <ArrowUpIcon />
      </IconButton>
      <IconButton
        label="다음 일치"
        title={tip('다음 일치', keys.next)}
        disabled={total === 0}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => move(1)}
        className="size-7 flex-none [&_svg]:size-4"
      >
        <ArrowDownIcon />
      </IconButton>
      <IconButton
        label="찾기 닫기"
        title={tip('찾기 닫기', keys.close)}
        onClick={onClose}
        className="size-7 flex-none [&_svg]:size-4"
      >
        <CloseIcon />
      </IconButton>
    </search>
  );
}

export default FindWidget;
