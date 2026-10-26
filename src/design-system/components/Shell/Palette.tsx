/*
 * 콤보박스 + 목록 패턴은 포커스를 입력창에 둔 채 `aria-activedescendant`로 고른 줄을 알리므로, 목록과 줄에
 * 네이티브 `<select>`·`<option>`을 쓸 수 없고 줄의 키 입력은 입력창(창 틀의 단축키 리스너)이 받는다.
 * 바깥 막은 장식이라 역할이 없다.
 */
/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { useEffect, useId, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import { cn } from '@/lib/utils';
import { paletteFiles, type PaletteTree } from './palette.logic';
import { keyLabel, type Platform } from './shortcuts.logic';

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
  tree: PaletteTree[];
  /** 키 표기를 고르는 플랫폼. 창 틀이 브라우저에서 처음 그릴 때 정한다. */
  platform: Platform;
  /** 글 줄을 골랐다. 창 틀이 팔레트를 닫고 그 글로 옮긴다. */
  onPick: (url: string) => void;
  /** 바깥을 눌렀다. 창 틀이 팔레트를 닫고 포커스를 연 자리로 돌려준다. */
  onDismiss: () => void;
  ref?: Ref<PaletteHandle>;
}

/** 파일 아이콘(장식). 탐색기의 파일 줄과 같은 모양이다. */
function FileGlyph() {
  return (
    <span
      aria-hidden="true"
      className="h-[11px] w-[9px] flex-none rounded-[1px_3px_1px_1px] bg-accent"
    />
  );
}

/**
 * 명령 팔레트(파일 모드). 제목 표시줄 바로 아래 가운데에 뜨는 대화상자이고, 안은 콤보박스 + 목록 패턴이다.
 * 고른 줄은 `aria-activedescendant`로 알리므로 포커스는 늘 입력창에 있다. 처음 쓸 때 불러오는 청크라
 * 창 틀은 `React.lazy`로만 가져온다.
 */
export function Palette({ tree, platform, onPick, onDismiss, ref }: PaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const listId = `${id}-list`;
  const optionId = (index: number) => `${id}-option-${index}`;
  const files = useMemo(() => paletteFiles(tree, query), [tree, query]);
  const current = files.length ? Math.min(active, files.length - 1) : -1;

  useImperativeHandle(
    ref,
    () => ({
      move: (delta) => setActive(Math.max(0, Math.min(files.length - 1, current + delta))),
      pick: () => {
        if (current >= 0) onPick(files[current].url);
      },
    }),
    [files, current, onPick],
  );

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
          aria-label="파일 이름으로 찾기"
          aria-expanded="true"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={current >= 0 ? optionId(current) : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="파일 이름으로 찾기"
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          className="h-10 w-full border-b border-border bg-transparent px-3.5 font-mono text-[13px] text-text outline-none placeholder:text-text-muted"
        />
        <div
          id={listId}
          role="listbox"
          aria-label="파일"
          className="max-h-[min(420px,60vh)] overflow-y-auto p-1 empty:hidden"
        >
          {files.map((file, index) => (
            <div
              key={file.url}
              id={optionId(index)}
              role="option"
              aria-selected={index === current}
              tabIndex={-1}
              // 누르는 동안 포커스가 입력창을 떠나지 않게 한다.
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => setActive(index)}
              onClick={() => onPick(file.url)}
              className={cn(
                'flex min-h-8 cursor-pointer items-center gap-2.5 rounded-(--corner-sm) px-2.5 py-1.5 text-text-soft',
                index === current && 'bg-state-selected',
              )}
            >
              <FileGlyph />
              <span className="flex-none text-text">{file.name}</span>
              {/* 흐린 글자는 고른 줄의 코랄 바탕 위에서 명암비가 모자라 한 단계 밝힌다. */}
              <span
                className={cn(
                  'min-w-0 truncate font-sans text-[12px]',
                  index === current ? 'text-text-soft' : 'text-text-muted',
                )}
              >
                {file.title}
              </span>
              <span
                className={cn(
                  'ml-auto flex-none text-[11px]',
                  index === current ? 'text-text-soft' : 'text-text-muted',
                )}
              >
                {file.folder}
              </span>
            </div>
          ))}
        </div>
        {files.length === 0 && (
          <p className="m-0 px-3.5 py-2.5 text-text-muted">맞는 파일이 없습니다</p>
        )}
        <p className="m-0 border-t border-border-subtle px-3.5 py-1.5 font-sans text-[11px] text-text-muted">
          본문에서 찾으려면{' '}
          <kbd className="rounded-[4px] border border-border bg-surface-sunken px-1.5 py-px font-mono text-[11px] text-text-muted">
            {keyLabel({ letter: 'f', shift: true }, platform)}
          </kbd>
        </p>
      </div>
    </>
  );
}

export default Palette;
