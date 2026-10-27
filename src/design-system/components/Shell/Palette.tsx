/*
 * 콤보박스 + 목록 패턴은 포커스를 입력창에 둔 채 `aria-activedescendant`로 고른 줄을 알리므로, 목록과 줄에
 * 네이티브 `<select>`·`<option>`을 쓸 수 없고 줄의 키 입력은 입력창(창 틀의 단축키 리스너)이 받는다.
 * 바깥 막은 장식이라 역할이 없다.
 */
/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import {
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type Ref,
} from 'react';
import { cn } from '@/lib/utils';
import { FileGlyph } from './icons';
import {
  isCommandQuery,
  paletteCommands,
  paletteFiles,
  type PaletteCommandId,
} from './palette.logic';
import { SHORTCUT_KEYS, keyLabel, type Platform, type ShellCommand } from './shortcuts.logic';
import { findSupported } from './shortcuts';
import type { TreeYear } from './Shell';

/** 창 틀이 팔레트에 넘기는 키 동작. 키 판정은 창 틀의 `document` 리스너 하나가 하고, 팔레트는 그 결과만 받는다. */
export interface PaletteHandle {
  /** 고른 줄을 위(`-1`)나 아래(`1`)로 옮긴다. 끝에서 멈춘다. */
  move: (delta: -1 | 1) => void;
  /** 고른 줄을 연다. 줄이 없으면 아무 일도 하지 않는다. */
  pick: () => void;
}

/** `Palette`의 props. */
export interface PaletteProps {
  /** 탐색기 트리 props. 팔레트는 이것만 거르고 검색 색인은 받지 않는다. */
  tree: TreeYear[];
  /** 키 표기를 고르는 플랫폼. 창 틀이 브라우저에서 처음 그릴 때 정한다. */
  platform: Platform;
  /** 지금 글에 다음 파일이 있는가. 없으면 명령 목록에서 `다음 파일 열기`를 뺀다. */
  hasNextFile: boolean;
  /** 글 줄을 골랐다. 창 틀이 팔레트를 닫고 그 글로 옮긴다. */
  onPick: (url: string) => void;
  /** 명령을 골랐다. 창 틀이 팔레트를 닫고 실행한다. `파일 열기`는 팔레트가 스스로 파일 모드로 돌아간다. */
  onCommand: (command: ShellCommand) => void;
  /** 바깥을 눌렀다. 창 틀이 팔레트를 닫고 포커스를 연 자리로 돌려준다. */
  onDismiss: () => void;
  ref?: Ref<PaletteHandle>;
}

/** 키 표기를 보일 수 있는 포인터(마우스·트랙패드). 터치 화면에서는 키 표기와 안내의 키 부분을 숨긴다. */
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

/** 키 표기 모양. 마우스를 쓰는 화면에서만 보인다. */
const kbd =
  'hidden rounded-[4px] border border-border bg-surface-sunken px-1.5 py-px font-mono text-[11px] text-text-muted [@media(hover:hover)_and_(pointer:fine)]:inline';

/** 마우스를 쓰는 화면인가. 팔레트는 브라우저에서만 그리므로 서버 값은 쓰이지 않는다. */
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

/** 팔레트 목록의 한 줄: 글이거나 명령이다. */
type PaletteRow =
  | { kind: 'file'; key: string; url: string; name: string; folder: string; title: string }
  | { kind: 'command'; key: string; id: PaletteCommandId; label: string; keys: string | null };

/** 입력창 안내 문구. 접근 가능한 이름은 늘 전체이고, 보이는 안내는 터치 화면에서 `>` 부분을 뺀다. */
const HINT = '파일 이름으로 찾기 · > 를 입력하면 명령';

/**
 * 명령 팔레트. 입력이 `>`로 시작하면 명령 모드(명령과 단축키 목록, 이 블로그의 단축키 도움말), 아니면 파일 모드다.
 * 제목 표시줄 바로 아래 가운데에 뜨는 대화상자이고, 안은 콤보박스 + 목록 패턴이다.
 * 고른 줄은 `aria-activedescendant`로 알리므로 포커스는 늘 입력창에 있다. 처음 쓸 때 불러오는 청크라
 * 창 틀은 `React.lazy`로만 가져온다.
 */
export function Palette({
  tree,
  platform,
  hasNextFile,
  onPick,
  onCommand,
  onDismiss,
  ref,
}: PaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const listId = `${id}-list`;
  const optionId = (index: number) => `${id}-option-${index}`;
  const fine = useFinePointer();
  const commandMode = isCommandQuery(query);
  const rows = useMemo<PaletteRow[]>(
    () =>
      commandMode
        ? paletteCommands(query, { hasNextFile, findSupported: findSupported(), platform }).map(
            (command) => ({
              kind: 'command',
              key: command.id,
              ...command,
            }),
          )
        : paletteFiles(tree, query).map((file) => ({ kind: 'file', key: file.url, ...file })),
    [commandMode, query, hasNextFile, platform, tree],
  );
  const current = rows.length ? Math.min(active, rows.length - 1) : -1;

  const change = (next: string) => {
    setQuery(next);
    setActive(0);
  };
  const choose = (row: PaletteRow) => {
    if (row.kind === 'file') onPick(row.url);
    else if (row.id === 'open-file') change('');
    else onCommand(row.id);
  };

  useImperativeHandle(ref, () => ({
    move: (delta) => setActive(Math.max(0, Math.min(rows.length - 1, current + delta))),
    pick: () => {
      if (current >= 0) choose(rows[current]);
    },
  }));

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    if (current >= 0)
      document.getElementById(`${id}-option-${current}`)?.scrollIntoView({ block: 'nearest' });
  }, [current, id]);

  return (
    <>
      {/* 바깥 막(장식): 대화상자 밖을 누르면 닫고, 누름이 아래 화면에 닿지 않게 한다. */}
      <div aria-hidden="true" className="fixed inset-0 z-60" onMouseDown={onDismiss} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="명령 팔레트"
        className="fixed top-[calc(var(--bar-height)+6px)] left-1/2 z-61 w-[min(600px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-(--corner-lg) border border-border-strong bg-surface-raised font-mono text-xs shadow-[0_18px_48px_-12px_var(--scrim)]"
      >
        <input
          ref={input}
          data-palette-input=""
          value={query}
          role="combobox"
          aria-label={HINT}
          aria-expanded="true"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={current >= 0 ? optionId(current) : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={fine ? HINT : '파일 이름으로 찾기'}
          onChange={(event) => change(event.target.value)}
          className="h-10 w-full border-b border-border bg-transparent px-3.5 font-mono text-[13px] text-text outline-none placeholder:text-text-muted"
        />
        <div
          id={listId}
          role="listbox"
          aria-label={commandMode ? '명령' : '파일'}
          className="max-h-[min(420px,60vh)] overflow-y-auto p-1 empty:hidden"
        >
          {rows.map((row, index) => {
            const chosen = index === current;
            return (
              <div
                key={row.key}
                id={optionId(index)}
                role="option"
                aria-selected={chosen}
                tabIndex={-1}
                // 누르는 동안 포커스가 입력창을 떠나지 않게 한다.
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => setActive(index)}
                onClick={() => choose(row)}
                className={cn(
                  'flex min-h-8 cursor-pointer items-center gap-2.5 rounded-(--corner-sm) px-2.5 py-1.5 text-text-soft',
                  chosen && 'bg-state-selected',
                )}
              >
                {row.kind === 'command' ? (
                  <>
                    <span className="min-w-0 truncate font-sans text-[13px] text-text">
                      {row.label}
                    </span>
                    {row.keys && <kbd className={cn(kbd, 'ml-auto flex-none')}>{row.keys}</kbd>}
                  </>
                ) : (
                  <>
                    <FileGlyph />
                    <span className="flex-none text-text">{row.name}</span>
                    {/* 흐린 글자는 고른 줄의 코랄 바탕 위에서 명암비가 모자라 한 단계 밝힌다. */}
                    <span
                      className={cn(
                        'min-w-0 truncate font-sans text-[12px]',
                        chosen ? 'text-text-soft' : 'text-text-muted',
                      )}
                    >
                      {row.title}
                    </span>
                    <span
                      className={cn(
                        'ml-auto flex-none text-[11px]',
                        chosen ? 'text-text-soft' : 'text-text-muted',
                      )}
                    >
                      {row.folder}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
        {rows.length === 0 && (
          <p className="m-0 px-3.5 py-2.5 text-text-muted">
            {commandMode ? '맞는 명령이 없습니다' : '맞는 파일이 없습니다'}
          </p>
        )}
        {/* 안내 전체가 키 표기라, 키가 빠졌거나 터치 화면이면 줄째 숨긴다. */}
        {!commandMode && SHORTCUT_KEYS.search && (
          <p className="m-0 hidden border-t border-border-subtle px-3.5 py-1.5 font-sans text-[11px] text-text-muted [@media(hover:hover)_and_(pointer:fine)]:block">
            본문에서 찾으려면 <kbd className={kbd}>{keyLabel(SHORTCUT_KEYS.search, platform)}</kbd>
          </p>
        )}
      </div>
    </>
  );
}

export default Palette;
