import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';
import { cn } from '@/lib/utils';
import { Button } from '../Button/Button';
import { $searchFocus, $searchQuery, setSearchQuery } from '../../stores/search';
import type { SearchIndex } from '../../stores/search-index';
import { capHits, excerpt, searchPosts, type SearchFile, type SearchHit } from './search.logic';

/**
 * 패널의 검색 화면. 창 틀이 처음 검색 화면을 열 때 이 모듈을 따로 불러오므로(`React.lazy`) 첫 화면 JS에는 없다.
 * 색인은 이 화면이 처음 그려질 때 한 번 내려받고, 받은 뒤에는 이 모듈의 메모리에 둔다.
 */

type IndexState = { url: string } & (
  | { status: 'loading' }
  | { status: 'ready'; index: SearchIndex }
  | { status: 'error' }
);

/** 내려받은 색인과 그 주소. 화면 이동 사이에도 남는다(창 틀이 남으므로 이 모듈도 남는다). */
const $index = atom<IndexState | null>(null);

function isSearchIndex(value: unknown): value is SearchIndex {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { v?: unknown }).v === 1 &&
    Array.isArray((value as { posts?: unknown }).posts)
  );
}

/** 색인을 내려받는다. 같은 주소를 이미 받았거나 받는 중이면 아무것도 하지 않는다. 실패하면 `error`가 되고 다시 부를 수 있다. */
function loadIndex(url: string): void {
  const state = $index.get();
  if (state?.url === url && state.status !== 'error') return;
  $index.set({ url, status: 'loading' });
  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<unknown>;
    })
    .then((value) => {
      if (!isSearchIndex(value)) throw new Error('search index shape');
      if ($index.get()?.url === url) $index.set({ url, status: 'ready', index: value });
    })
    .catch(() => {
      if ($index.get()?.url === url) $index.set({ url, status: 'error' });
    });
}

/** 접힘 삼각형(장식). 접히면 오른쪽을 가리킨다. */
function Twisty({ folded }: { folded: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'mx-[3px] size-0 flex-none border-x-4 border-t-[5px] border-x-transparent border-t-text-muted transition-transform duration-(--motion-fast) ease-standard',
        folded && '-rotate-90',
      )}
    />
  );
}

/** 발췌. 일치한 글자는 형광 띠(`marker`)로 칠한다. */
function Excerpt({ hit }: { hit: SearchHit }) {
  const { text, ranges } = excerpt(hit.text, hit.ranges);
  return (
    <>
      {ranges.map(([start, end], index) => (
        <Fragment key={start}>
          {text.slice(index > 0 ? ranges[index - 1][1] : 0, start)}
          <mark className="rounded-[2px] bg-marker text-text">{text.slice(start, end)}</mark>
        </Fragment>
      ))}
      {text.slice(ranges.at(-1)?.[1] ?? 0)}
    </>
  );
}

/** 결과 줄 하나: 위는 위치(모노), 아래는 발췌(세리프, 두 줄까지). */
function HitLink({ hit }: { hit: SearchHit }) {
  return (
    <a
      href={hit.href}
      className="block py-1 pr-3 pl-9 text-text-soft transition-colors duration-(--motion-fast) ease-standard hover:bg-state-hover hover:text-text focus-visible:-outline-offset-2"
    >
      <span className="block truncate font-mono text-[11px] leading-[1.6] text-text-muted">
        {hit.place}
      </span>
      <span className="line-clamp-2 font-serif text-[13px] leading-[1.5]">
        <Excerpt hit={hit} />
      </span>
    </a>
  );
}

/** 파일 묶음: 파일 줄(접힘 삼각형·파일 이름·일치 수)과 그 아래 결과 줄. */
function FileGroup({ file }: { file: SearchFile }) {
  const [folded, setFolded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { shown, more } = capHits(file.hits, expanded);
  return (
    <li>
      <button
        type="button"
        aria-expanded={!folded}
        title={file.path}
        onClick={() => setFolded((value) => !value)}
        className="flex h-7 w-full cursor-pointer items-center gap-1.5 pr-3 pl-3 font-mono text-xs text-text transition-colors duration-(--motion-fast) ease-standard hover:bg-state-hover focus-visible:-outline-offset-2"
      >
        <Twisty folded={folded} />
        <span
          aria-hidden="true"
          className="h-[11px] w-[9px] flex-none rounded-[1px_3px_1px_1px] bg-accent"
        />
        <span className="truncate">{file.name}</span>
        <span className="ml-auto rounded-full bg-state-selected px-1.5 text-[11px] leading-[1.5] text-text-soft">
          <span className="sr-only">일치 </span>
          {file.hits.length}
          <span className="sr-only">줄</span>
        </span>
      </button>
      {!folded && (
        <ul className="m-0 list-none p-0">
          {shown.map((hit) => (
            <li key={hit.line}>
              <HitLink hit={hit} />
            </li>
          ))}
          {more > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="block h-6.5 w-full cursor-pointer pr-3 pl-9 text-left font-mono text-[11.5px] text-text-muted transition-colors duration-(--motion-fast) ease-standard hover:bg-state-hover hover:text-text focus-visible:-outline-offset-2"
              >
                … {more}줄 더
              </button>
            </li>
          )}
        </ul>
      )}
    </li>
  );
}

/** 상태 줄(요약·결과 없음·불러오는 중) 모양. */
const note = 'm-0 min-h-[1.5em] px-4 pb-1.5 font-mono text-[11.5px] text-text-muted';

/** `SearchView`의 props. */
export interface SearchViewProps {
  /** 검색 색인(`SearchIndex`) 주소. 디자인 시스템은 블로그 내용을 모르므로 창 틀 props로 받는다. */
  indexUrl: string;
}

/**
 * 검색 화면: 입력창, `N개 파일, M줄` 요약, 파일별로 묶인 결과. 두 글자부터 찾고, 결과 링크는 진짜 `<a href>`라
 * 화면 이동(ClientRouter)을 탄다. 검색어는 `$searchQuery`(메모리)에 있어 화면을 옮겨도 남는다.
 */
export default function SearchView({ indexUrl }: SearchViewProps) {
  const query = useStore($searchQuery);
  const focusRequested = useStore($searchFocus);
  const loaded = useStore($index);
  const state = loaded?.url === indexUrl ? loaded : null;
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => loadIndex(indexUrl), [indexUrl]);

  useEffect(() => {
    if (!focusRequested) return;
    input.current?.focus();
    $searchFocus.set(false);
  }, [focusRequested]);

  const results = useMemo(
    () => (state?.status === 'ready' ? searchPosts(state.index, query) : null),
    [state, query],
  );

  return (
    <div className="pb-2">
      <div className="px-3 pt-1 pb-2">
        <input
          ref={input}
          type="search"
          value={query}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="본문에서 찾기"
          aria-label="본문에서 찾기"
          aria-describedby="search-summary"
          autoComplete="off"
          spellCheck={false}
          className="h-7.5 w-full rounded-sm border border-border bg-surface px-2 font-mono text-[12.5px] text-text outline-none placeholder:text-text-muted focus:border-accent"
        />
      </div>
      {state?.status === 'error' ? (
        <div role="alert" className="px-4 pt-1">
          <p className="m-0 mb-2.5 text-[13px] text-text-soft">검색 색인을 불러오지 못했습니다</p>
          <Button size="sm" onClick={() => loadIndex(indexUrl)}>
            다시 시도
          </Button>
        </div>
      ) : (
        <>
          <output id="search-summary" className={cn('block', note)}>
            {state?.status !== 'ready'
              ? query.trim() && '색인을 불러오는 중'
              : results &&
                (results.files.length > 0
                  ? `${results.files.length}개 파일, ${results.lines}줄`
                  : '결과 없음')}
          </output>
          {results && results.files.length > 0 && (
            <ul aria-label="검색 결과" className="m-0 list-none p-0">
              {results.files.map((file) => (
                <FileGroup key={`${query}\n${file.path}`} file={file} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
