import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';
import { useStore } from '@nanostores/react';
import { cn } from '@/lib/utils';
import { $activeTab, $openTabs, closeTab, toTabRecord } from '../../stores/tabs';
import { POSTS_LOG, initialTabs } from '../../stores/tabs.logic';

const TAB_ITEM = 'li[data-url]';
const TAB_LINK = 'a[data-tab-link]';

const serverTabs = () => toTabRecord(initialTabs().files);
const serverActive = () => initialTabs().active;

/** `Tabs`의 props. */
export interface TabsProps {
  /**
   * 활성 탭을 닫아 다른 탭으로 옮겨 갈 때 부른다. 기본은 브라우저 이동(`location.assign`)이고,
   * Astro `<ClientRouter />` 아래에서는 `navigate`를 넘긴다.
   */
  onNavigate?: (url: string) => void;
  /** 탭 목록의 접근 가능한 이름. */
  label?: string;
  className?: string;
}

/** 탭 앞의 작은 코랄 기호. `posts.log`는 로그 줄, 글 파일은 접힌 모서리 종이(시안 `.log-glyph`·`.file-dot`). */
function TabGlyph({ pinned }: { pinned: boolean }) {
  return pinned ? (
    <span
      aria-hidden="true"
      className="relative h-[9px] w-[11px] flex-none border-y-[1.5px] border-accent after:absolute after:top-[2.25px] after:right-[3px] after:left-0 after:h-[1.5px] after:bg-accent"
    />
  ) : (
    <span
      aria-hidden="true"
      className="h-[11px] w-[9px] flex-none rounded-[1px_3px_1px_1px] bg-accent"
    />
  );
}

/** 좌우 화살표로 탭 링크 사이를 오간다. 끝에서는 반대쪽 끝으로 돈다. */
function moveFocus(event: KeyboardEvent<HTMLAnchorElement>): void {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  const links = [
    ...(event.currentTarget.closest('ul')?.querySelectorAll<HTMLAnchorElement>(TAB_LINK) ?? []),
  ];
  const index = links.indexOf(event.currentTarget);
  event.preventDefault();
  const step = event.key === 'ArrowRight' ? 1 : -1;
  links[(index + step + links.length) % links.length].focus();
}

function tabUrls(list: HTMLUListElement | null): Set<string> {
  return new Set(
    [...(list?.querySelectorAll<HTMLElement>(TAB_ITEM) ?? [])].map(
      (item) => item.dataset.url ?? '',
    ),
  );
}

/**
 * 첫 프레임이 그려진 뒤에 새로 생긴 탭에만 `animate-unroll`(왼쪽에서 드러나는 등장)을 붙인다.
 * 렌더가 아니라 커밋 뒤에 직전 목록과 비교하므로, 하이드레이션 직후 저장된 탭이 한꺼번에 움직이지 않는다.
 * `tabKey`는 탭 목록이 바뀔 때만 다시 비교하기 위한 의존성 값이다.
 */
function useNewTabEntrance(list: RefObject<HTMLUListElement | null>, tabKey: string): void {
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!seen.current) return;
    const before = seen.current;
    const now = new Set(tabKey.split('\n'));
    for (const item of list.current?.querySelectorAll<HTMLElement>(TAB_ITEM) ?? []) {
      const url = item.dataset.url ?? '';
      if (now.has(url) && !before.has(url)) item.classList.add('animate-unroll');
    }
    seen.current = now;
  }, [list, tabKey]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      seen.current = tabUrls(list.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [list]);
}

/**
 * 에디터 탭 표시줄. 탭 스토어를 구독해 열린 파일을 그린다. 탭은 링크라 JS 없이도 이동하고,
 * `posts.log`는 항상 첫 탭이며 닫기 버튼이 없다. 활성 탭은 코랄 윗선, 새로 열린 탭은 왼쪽에서 드러난다
 * (움직임 줄이기 설정에서는 바로 나타남). 닫으면 키보드 포커스는 닫은 뒤의 활성 탭 링크로 간다.
 *
 * 서버는 세션에 저장된 탭을 모르므로 서버 스냅샷은 `posts.log`만으로 두고, 하이드레이션 뒤 저장된 탭을 그린다.
 */
export function Tabs({
  onNavigate = (url) => window.location.assign(url),
  label = '열린 파일',
  className,
}: TabsProps) {
  const files = Object.values(useStore($openTabs, { ssr: serverTabs }));
  const active = useStore($activeTab, { ssr: serverActive });
  const listRef = useRef<HTMLUListElement>(null);
  useNewTabEntrance(listRef, files.map((file) => file.url).join('\n'));

  const handleClose = (url: string) => {
    const wasActive = url === active;
    const next = closeTab(url);
    // 닫기 버튼이 사라져도 포커스를 잃지 않게 닫은 뒤의 활성 탭 링크로 옮긴다.
    requestAnimationFrame(() => {
      for (const link of listRef.current?.querySelectorAll<HTMLAnchorElement>(TAB_LINK) ?? []) {
        if (link.getAttribute('href') === next) link.focus();
      }
    });
    if (wasActive) onNavigate(next);
  };

  return (
    <nav
      aria-label={label}
      className={cn(
        'flex h-(--bar-height) [scrollbar-width:none] overflow-x-auto border-b border-border bg-surface-sunken',
        className,
      )}
    >
      <ul ref={listRef} className="m-0 flex list-none p-0">
        {files.map((file) => {
          const isActive = file.url === active;
          const pinned = file.url === POSTS_LOG.url;
          return (
            <li
              key={file.url}
              data-url={file.url}
              className={cn(
                'group relative -mb-px flex flex-none items-center border-r border-border',
                isActive &&
                  'border-b border-b-surface bg-surface before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-accent',
              )}
            >
              <a
                href={file.url}
                data-tab-link
                onKeyDown={moveFocus}
                title={file.path}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-full items-center gap-2 px-4 font-mono text-xs text-text-muted',
                  'transition-colors duration-(--motion-fast) ease-standard group-hover:text-text focus-visible:-outline-offset-3',
                  isActive && 'text-text',
                )}
              >
                <TabGlyph pinned={pinned} />
                {file.path.split('/').pop()}
              </a>
              {!pinned && (
                <button
                  type="button"
                  aria-label={`${file.title} 닫기`}
                  onClick={() => handleClose(file.url)}
                  className="mr-2 -ml-2 grid size-5.5 cursor-pointer place-items-center rounded-sm font-mono text-sm leading-none text-text-muted transition-colors duration-(--motion-fast) ease-standard hover:bg-state-hover hover:text-text"
                >
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
