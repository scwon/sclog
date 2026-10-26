import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Tabs } from '../Tabs/Tabs';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import { useStore } from '@nanostores/react';
import { $reading, emptyReading } from '../../stores/reading';
import { chapterNo, readingSymbol } from '../../stores/reading.logic';
import {
  $readingHistory,
  clearReadingHistory,
  keepPublishedHistory,
} from '../../stores/readingHistory';
import {
  emptyHistory,
  markText,
  readingMark,
  summarizeHistory,
  type ReadingMark,
} from '../../stores/readingHistory.logic';
import { openTab } from '../../stores/tabs';
import { openLog, parseEditorFile, type EditorFile } from '../../stores/file.logic';
import { BranchIcon, CodeIcon, ExplorerIcon, ExternalIcon, MenuIcon, ProfileIcon } from './icons';
import {
  PANEL_VIEWS,
  dismissPanel,
  initialPanel,
  panelOpen,
  panelVisible,
  pickView,
  showView,
  startView,
  togglePanel,
  viewForFile,
  type PanelState,
  type PanelView,
} from './panel.logic';
import { readPanelView, writePanelView } from './panel';

/** 탐색기 트리의 글 파일 하나. */
export interface TreeFile {
  url: string;
  title: string;
  /** `posts/<연도>/<slug>.mdx` */
  path: string;
}

/** 탐색기 트리의 연도 폴더. */
export interface TreeYear {
  year: string;
  files: TreeFile[];
}

/** 지금 화면의 파일. 경로는 `posts/<연도>/<slug>.mdx`, `posts.log`, `tags/<태그>`, `404` 등이다. */
export type CurrentFile = Pick<EditorFile, 'title' | 'path' | 'url' | 'kind'>;

/** 패널의 프로필 화면에 보이는 블로그 주인 소개. */
export interface Profile {
  name: string;
  /** 직함. 예: `Frontend Developer` */
  role: string;
  /** 짧은 소개 2~3문장. */
  bio: string;
  /** 사진 URL. 원형으로 잘라 보인다. */
  photo: string;
  /** 경력 줄. 예: `WhaTapLabs · 2017.10~` */
  career: string[];
  /** 연락처 링크. 이메일은 `mailto:` URL로 넣는다. */
  links: { label: string; url: string }[];
}

/** `Shell`의 props. 모두 빌드 시 정해지는 직렬화 가능한 값이라 Astro 아일랜드로 넘길 수 있다. */
export interface ShellProps {
  /** 블로그 이름. `’`(아포스트로피)는 강조색으로 그린다. */
  brand: string;
  author: string;
  githubUrl: string;
  /** 활동 막대의 "이 블로그의 소스" 링크. */
  sourceUrl: string;
  tree: TreeYear[];
  profile: Profile;
  /**
   * 지금 화면의 파일(제목·경로·URL·종류). 서버 HTML에 탭·창 제목·패널 화면·탐색기 강조를 미리 그려, JS가 없거나
   * 하이드레이션 전에도 맞게 보인다. 하이드레이션 뒤에는 에디터 루트의 계약(`data-file-*`)을 읽어 바꾼다.
   * 계약의 원본은 에디터 루트이고, 이 값은 서버 HTML을 위한 같은 값의 사본이다.
   */
  current?: CurrentFile;
}

const DESKTOP = '(min-width: 1100px)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const EDITOR_ID = 'editor';
const OUTLINE_ID = 'editor-outline';
const PANEL_ID = 'panel';

/** 패널 화면 이름. 활동 막대 버튼·패널 제목·좁은 화면의 전환 버튼에 쓴다. */
const VIEW_LABEL: Record<PanelView, string> = { explorer: '탐색기', profile: '프로필' };

/** 활동 막대에서 패널 화면을 고르는 아이콘. */
const VIEW_ICON: Record<PanelView, ReactNode> = {
  explorer: <ExplorerIcon />,
  profile: <ProfileIcon />,
};

/** 1100px 이상인가. 서버는 화면 폭을 모르므로 넓은 화면으로 그린다. */
function useDesktop(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(DESKTOP);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => true,
  );
}

/** 에디터 루트의 계약(`data-file-*`, 개요 JSON)을 읽는다. */
function readEditorFile(editor: HTMLElement): EditorFile | null {
  return parseEditorFile(
    { ...editor.dataset },
    document.getElementById(OUTLINE_ID)?.textContent ?? null,
  );
}

/**
 * 링크를 누른 것처럼 이동한다. Astro `<ClientRouter />`가 있으면 클라이언트 이동으로, 없으면 보통 이동으로
 * 처리되므로 디자인 시스템이 Astro를 몰라도 된다.
 */
function navigateLikeLink(url: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
}

/** 블로그 이름의 `’`만 강조색으로 그린다. */
function Brand({ name }: { name: string }) {
  const [head, ...rest] = name.split('’');
  return (
    <>
      {head}
      {rest.length > 0 && <span className="text-accent-text">’</span>}
      {rest.join('’')}
    </>
  );
}

/** 작성자 서명: 코랄 동그라미 안의 아포스트로피. */
function Sign({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block size-5 flex-none overflow-hidden rounded-full bg-accent pt-[0.2em] text-center font-display text-[22px] leading-none font-extrabold text-on-accent',
        className,
      )}
    >
      ’
    </span>
  );
}

/** 개요의 현재 항목: 선택 바탕, 굵은 글자, 세로선 위의 코랄 막대. */
const outlineCurrent =
  'bg-state-selected font-semibold text-text before:absolute before:top-1.5 before:bottom-1.5 before:left-5 before:w-[3px] before:bg-accent';

/** 접힘 삼각형(장식). */
function Twisty() {
  return (
    <span
      aria-hidden="true"
      className="mx-[3px] size-0 flex-none border-x-4 border-t-[5px] border-x-transparent border-t-text-muted"
    />
  );
}

function SectionHead({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="m-0 flex h-7 items-center gap-1.5 px-3 font-sans text-xs font-bold text-text"
    >
      <Twisty />
      {children}
    </h2>
  );
}

/** 패널 제목 글자(넓은 화면의 제목 줄, 좁은 화면의 전환 버튼). */
const panelTitle = 'text-[11.5px] font-semibold tracking-[0.06em] text-text-muted';

/** 활동 막대 항목(아이콘 버튼·링크) 공통 모양. */
const railItem =
  'relative grid h-11.5 w-(--rail-width) place-items-center text-text-muted transition-colors duration-(--motion-fast) ease-standard hover:text-text focus-visible:-outline-offset-[5px] [&_svg]:size-[23px]';

/** 활동 막대에서 패널 화면 하나를 고르는 버튼. 그 화면이 보이면 코랄 바탕·아이콘·왼쪽 막대로 표시한다. */
function RailButton({
  view,
  current,
  onPick,
  className,
  children,
}: {
  view: PanelView;
  current: boolean;
  onPick: (view: PanelView) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={VIEW_LABEL[view]}
      aria-controls={PANEL_ID}
      aria-pressed={current}
      onClick={() => onPick(view)}
      className={cn(
        railItem,
        'cursor-pointer',
        current &&
          'bg-state-selected text-accent-text before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-accent hover:text-accent-text',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** 패널 줄 링크(연락처) 모양. */
const panelLink =
  'flex h-7.5 items-center gap-1 pr-3 pl-6.5 font-mono text-xs text-text-soft transition-colors duration-(--motion-fast) ease-standard hover:bg-state-hover hover:text-text focus-visible:-outline-offset-2';

/**
 * 탐색기 파일 줄 끝의 읽음 꼬리표. 읽은 글은 `✓`(흐린 글자), 읽는 중인 글은 `42%`(강조 글자)이고, 스크린 리더는
 * 기호 대신 "읽음"·"42% 읽는 중"을 읽는다. 줄지 않으므로 파일 이름이 먼저 말줄임된다.
 */
function ReadMark({ mark }: { mark: ReadingMark }) {
  const { text, label } = markText(mark, 'short');
  return (
    <span
      className={cn(
        'ml-auto flex-none pl-1 text-[11px]',
        mark.kind === 'read' ? 'text-text-muted' : 'text-accent-text',
      )}
    >
      <span aria-hidden="true">{text}</span>
      <span className="sr-only"> {label}</span>
    </span>
  );
}

/**
 * 프로필 화면 맨 아래의 읽기 기록 칸. `이 브라우저에 N편 읽음 · M편 읽는 중`과 `기록 지우기`를 보이고, 기록이 없으면
 * 안내 한 줄만 보인다. 지우면 버튼이 사라지므로 포커스를 안내 줄로 옮긴다.
 */
function HistorySection({ summary }: { summary: string | null }) {
  const status = useRef<HTMLParagraphElement>(null);
  return (
    <section aria-labelledby="profile-history" className="border-t border-border pb-2">
      <SectionHead id="profile-history">읽기 기록</SectionHead>
      <p
        ref={status}
        tabIndex={-1}
        className="m-0 py-1 pr-3 pl-6.5 font-mono text-xs leading-[1.6] text-text-soft outline-none"
      >
        {summary ? `이 브라우저에 ${summary}` : '이 브라우저에 남은 읽기 기록이 없습니다'}
      </p>
      {summary && (
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            clearReadingHistory();
            status.current?.focus();
          }}
          className="mt-1 ml-6.5 font-mono text-xs"
        >
          기록 지우기
        </Button>
      )}
    </section>
  );
}

/** 패널의 프로필 화면: 사진, 이름·직함·소개, 경력, 연락처, 읽기 기록. */
function ProfileView({ profile, history }: { profile: Profile; history: string | null }) {
  return (
    <div className="pb-2">
      <div className="px-4.5 pt-3 pb-4">
        <img
          src={profile.photo}
          alt={`${profile.name} 사진`}
          width={88}
          height={88}
          className="block size-22 rounded-full object-cover"
        />
        <h2 className="mt-3.5 mb-0 font-display text-[19px] leading-tight font-extrabold tracking-[-0.01em] text-text">
          {profile.name}
        </h2>
        <p className="mt-1 mb-0 font-mono text-xs text-accent-text">{profile.role}</p>
        <p className="mt-3 mb-0 text-[13px] leading-[1.6] text-text-soft">{profile.bio}</p>
      </div>
      <section aria-labelledby="profile-career" className="border-t border-border pb-2">
        <SectionHead id="profile-career">경력</SectionHead>
        <ul className="m-0 list-none p-0">
          {profile.career.map((line) => (
            <li
              key={line}
              className="flex h-7 items-center pr-3 pl-6.5 font-mono text-xs text-text-soft"
            >
              {line}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="profile-links" className="border-t border-border pb-2">
        <SectionHead id="profile-links">연락처</SectionHead>
        <ul className="m-0 list-none p-0">
          {profile.links.map((link) => (
            <li key={link.url}>
              <a href={link.url} className={panelLink}>
                {link.label}
                {link.url.startsWith('http') && <ExternalIcon className="size-[0.95em]" />}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <HistorySection summary={history} />
    </div>
  );
}

/**
 * 전체 화면 IDE 창 틀. 제목 표시줄·활동 막대·패널(탐색기 또는 프로필)·탭·상태줄을 모두
 * `position: fixed`로 그리는 아일랜드 하나다(ADR 0001). 에디터 내용은 아일랜드 밖 정적 HTML이고,
 * 창 틀은 페이지가 열릴 때마다(`astro:page-load`) 에디터 루트의 `data-file-*`를 읽어 탭을 열고
 * 상태줄에 열기 요약(`❯ open …` → `✓ 열림 · …`)을 약 2초 보인다.
 *
 * 패널은 탐색기(글 트리, 글이면 그 아래 개요)와 프로필 중 한 화면을 보이고, 전환 규칙은 `panel.logic.ts`에 있다.
 * 마지막 화면은 세션 동안 `sessionStorage`에 남겨(`panel.ts`) 새로고침 뒤 하이드레이션이 끝나면 되살린다.
 * 패널 열림은 `<html data-panel>`로 알려, 2층 ide.css가 에디터 여백(`--editor-left`)을 맞춘다.
 * 읽기 기록(`readingHistory.ts`)을 구독해 탐색기 파일 줄 끝에 읽음 꼬리표를, 프로필 화면 맨 아래에 읽기 기록 칸을 그린다.
 */
export function Shell({ brand, author, githubUrl, sourceUrl, tree, profile, current }: ShellProps) {
  const [file, setFile] = useState<EditorFile | null>(null);
  // 하이드레이션 전에는 서버가 넘긴 현재 파일을 보인다.
  const shown: CurrentFile | null = file ?? current ?? null;
  const desktop = useDesktop();
  // 서버 HTML과 첫 하이드레이션은 저장소를 모르므로 현재 파일의 종류로만 정한다(홈은 프로필, 글은 탐색기).
  const [panel, setPanel] = useState<PanelState>(() => ({
    ...initialPanel,
    view: startView(null, current?.kind),
  }));
  const openMode = panelOpen(panel, desktop);
  /** 패널 상태를 바꾼다. 화면 폭은 누른 순간의 값을 읽는다. */
  const updatePanel = useCallback(
    (next: (state: PanelState, wide: boolean) => PanelState) =>
      setPanel((previous) => next(previous, window.matchMedia(DESKTOP).matches)),
    [],
  );
  const [log, setLog] = useState<string | null>(null);
  const reading = useStore($reading, { ssr: emptyReading });
  // 서버 HTML과 첫 하이드레이션은 저장소를 모르므로 기록 없이 그리고, 그 뒤 실제 기록으로 다시 그린다.
  const history = useStore($readingHistory, { ssr: emptyHistory });
  const timers = useRef<number[]>([]);
  const panelRef = useRef<HTMLElement>(null);
  // 마지막으로 읽은 에디터 루트. 화면을 옮기면 <body>가 바뀌어 새 요소가 된다.
  const lastEditor = useRef<HTMLElement | null>(null);

  const visible = panelVisible(panel, desktop);
  const overlay = !desktop && openMode === 'open';
  const explorerShown = visible && panel.view === 'explorer';
  const pick = useCallback(
    (view: PanelView) => updatePanel((state, wide) => pickView(state, view, wide)),
    [updatePanel],
  );

  /** 패널을 탐색기 화면으로 연다(이미 보이면 그대로). 경로 표시줄의 `개요` 버튼이 쓴다. */
  const openExplorer = useCallback(() => {
    updatePanel((_, wide) => showView('explorer', wide));
    requestAnimationFrame(() =>
      document.getElementById('explorer-outline')?.scrollIntoView({ block: 'nearest' }),
    );
  }, [updatePanel]);

  // 하이드레이션 뒤 저장된 마지막 화면에 파일 종류 규칙을 적용한 화면으로 바꾼다. 아래 저장 효과보다
  // 먼저 선언해야 저장값을 덮어쓰기 전에 읽는다.
  // 처음 한 번만 읽는다(ADR 0004). 그 뒤 파일을 열 때의 규칙은 아래 열기 처리가 맡는다.
  const firstKind = useRef(current?.kind);
  useEffect(() => {
    const saved = readPanelView();
    if (saved) updatePanel((state) => ({ ...state, view: startView(saved, firstKind.current) }));
  }, [updatePanel]);

  // 읽기 기록에서 발행된 글 목록(트리)에 없는 글을 버린다.
  useEffect(() => {
    keepPublishedHistory(tree.flatMap((year) => year.files.map((entry) => entry.url)));
  }, [tree]);

  // 패널 화면이 바뀔 때마다 세션 동안 남긴다. 열림·닫힘은 저장하지 않는다.
  useEffect(() => writePanelView(panel.view), [panel.view]);

  // 페이지가 열리면 계약을 읽어 탭을 열고 열기 요약을 보인다. 첫 하이드레이션과 첫 page-load가
  // 겹쳐 두 번 불리면 한 번만 처리한다.
  useEffect(() => {
    const handleOpen = () => {
      // 첫 하이드레이션과 첫 page-load가 모두 부르면 같은 에디터 루트이므로 한 번만 처리한다.
      const editor = document.getElementById(EDITOR_ID);
      if (!editor || editor === lastEditor.current) return;
      lastEditor.current = editor;
      const next = readEditorFile(editor);
      if (!next) return;
      setFile(next);
      openTab({ url: next.url, title: next.title, path: next.path });
      // 패널 화면을 파일 종류에 맞춘다. 좁은 화면에서 패널로 글을 골랐다면 패널을 닫는다.
      updatePanel((state, wide) => {
        const moved = { ...state, view: viewForFile(state.view, next.kind) };
        return wide ? moved : dismissPanel(moved, wide);
      });

      const { command, result } = openLog(next);
      const reduceMotion = window.matchMedia(REDUCED_MOTION).matches;
      timers.current.forEach(clearTimeout);
      setLog(command);
      timers.current = [
        window.setTimeout(() => setLog(result), reduceMotion ? 0 : 450),
        window.setTimeout(() => setLog(null), 2200),
      ];
    };
    const pending = timers;
    handleOpen();
    document.addEventListener('astro:page-load', handleOpen);
    return () => {
      document.removeEventListener('astro:page-load', handleOpen);
      pending.current.forEach(clearTimeout);
    };
  }, [updatePanel]);

  // 패널 열림을 <html data-panel>에 알린다. 화면을 옮길 때 이 속성을 이어 붙이는 일은 소비자가 맡는다.
  useEffect(() => {
    const root = document.documentElement;
    if (openMode === 'auto') delete root.dataset.panel;
    else root.dataset.panel = openMode;
  }, [openMode]);

  // 정적 HTML의 탐색기 버튼(경로 표시줄의 `개요` 등)도 같은 동작을 하고 펼침 상태를 알린다.
  useEffect(() => {
    const sync = () => {
      for (const button of document.querySelectorAll('[data-explorer-toggle]')) {
        button.setAttribute('aria-expanded', String(explorerShown));
      }
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest('[data-explorer-toggle]')) openExplorer();
      // 겹침 패널·서랍 안의 링크(같은 페이지의 개요 앵커 포함)를 누르면 패널을 닫는다.
      else if (target?.closest(`#${PANEL_ID} a`) && !window.matchMedia(DESKTOP).matches)
        updatePanel(dismissPanel);
    };
    sync();
    document.addEventListener('astro:page-load', sync);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('astro:page-load', sync);
      document.removeEventListener('click', onClick);
    };
  }, [explorerShown, openExplorer, updatePanel]);

  // 겹침 패널은 Esc로 닫고, 열리면 패널로 포커스를 옮겼다가 닫히면 연 버튼으로 돌려준다.
  useEffect(() => {
    if (!overlay) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();
    const restore = () => {
      if (opener?.isConnected && panelRef.current?.contains(document.activeElement)) opener.focus();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') updatePanel(dismissPanel);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restore();
    };
  }, [overlay, updatePanel]);

  const years = tree.map((year) => ({ ...year, count: year.files.length }));
  const outline = file?.kind === 'post' ? file.outline : [];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-(--bar-height) items-center gap-3 border-b border-border bg-surface-sunken pr-2 pl-3.5 text-[13px] text-text max-[759px]:gap-2 max-[759px]:pl-3">
        <IconButton
          label="패널"
          aria-controls={PANEL_ID}
          aria-expanded={visible}
          onClick={() => updatePanel(togglePanel)}
          className="-ml-1.5 min-[760px]:hidden"
        >
          <MenuIcon />
        </IconButton>
        <a
          href="/"
          className="pb-0.5 font-display text-[17px] leading-none font-extrabold tracking-[-0.02em] max-[759px]:text-lg"
        >
          <Brand name={brand} />
        </a>
        <p
          aria-hidden="true"
          className="absolute left-1/2 m-0 max-w-[40vw] -translate-x-1/2 truncate font-mono text-xs leading-none text-text-muted max-[759px]:hidden"
        >
          {shown ? `${shown.path} — ${brand}` : brand}
        </p>
        <div className="ml-auto flex items-center gap-3.5">
          <span className="flex items-center gap-2 text-text-soft max-[759px]:hidden">
            <Sign />
            {author}
          </span>
          <a
            href={githubUrl}
            className="flex items-center text-text-muted transition-colors duration-(--motion-fast) ease-standard hover:text-text max-[759px]:hidden"
          >
            GitHub
            <ExternalIcon className="ml-px size-[0.95em]" />
          </a>
          <ThemeToggle />
        </div>
      </header>

      <nav
        aria-label="활동 막대"
        className="fixed top-(--bar-height) bottom-(--bar-height-xs) left-0 z-40 flex w-(--rail-width) flex-col items-center border-r border-border bg-surface-sunken py-1 max-[759px]:hidden"
      >
        {PANEL_VIEWS.map((view) => (
          <RailButton key={view} view={view} current={visible && panel.view === view} onPick={pick}>
            {VIEW_ICON[view]}
          </RailButton>
        ))}
        <a href={sourceUrl} aria-label="이 블로그의 소스" className={railItem}>
          <CodeIcon />
        </a>
      </nav>

      <aside
        id={PANEL_ID}
        ref={panelRef}
        tabIndex={-1}
        aria-label={VIEW_LABEL[panel.view]}
        className={cn(
          'fixed top-(--bar-height) bottom-(--bar-height-xs) left-(--rail-width) z-35 w-(--panel-width) [scrollbar-width:thin] overflow-y-auto border-r border-border bg-surface-panel pb-7 outline-none',
          'max-[759px]:left-0 max-[759px]:z-46 max-[759px]:w-[min(86vw,320px)]',
          openMode === 'auto' && 'hidden min-[1100px]:block',
          openMode === 'open' && 'block max-[1099px]:shadow-[24px_0_48px_-24px_var(--scrim)]',
          openMode === 'closed' && 'hidden',
        )}
      >
        <p className={cn(panelTitle, 'm-0 flex h-9 items-center px-4.5 max-[759px]:hidden')}>
          {VIEW_LABEL[panel.view]}
        </p>
        {/* 좁은 화면에는 활동 막대가 없으므로, 제목 줄이 화면 전환 버튼이 된다. */}
        <fieldset
          aria-label="패널 화면"
          className="flex h-9 items-stretch gap-1 border-b border-border-subtle px-2.5 min-[760px]:hidden"
        >
          {PANEL_VIEWS.map((view) => (
            <button
              key={view}
              type="button"
              aria-pressed={panel.view === view}
              onClick={() => updatePanel((_, wide) => showView(view, wide))}
              className={cn(
                panelTitle,
                'relative cursor-pointer px-2 transition-colors duration-(--motion-fast) ease-standard hover:text-text focus-visible:-outline-offset-2',
                panel.view === view &&
                  'text-text after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-accent',
              )}
            >
              {VIEW_LABEL[view]}
            </button>
          ))}
        </fieldset>
        {panel.view === 'profile' ? (
          <ProfileView profile={profile} history={summarizeHistory(history)} />
        ) : (
          <>
            <section aria-labelledby="explorer-posts" className="pb-2">
              <SectionHead id="explorer-posts">posts</SectionHead>
              <ul className="m-0 list-none p-0">
                {years.map(({ year, files, count }) => (
                  <li key={year}>
                    <p className="m-0 flex h-7 items-center gap-1.5 pr-3 pl-6.5 font-mono text-[12.5px] leading-none font-medium text-text-soft">
                      <Twisty />
                      {year}
                      <span className="ml-auto text-[11.5px] text-text-muted">{count}</span>
                    </p>
                    <ul className="m-0 list-none p-0">
                      {files.map((entry) => {
                        const active = shown?.url === entry.url;
                        const name = entry.path.split('/').pop();
                        const mark = readingMark(history, entry.url);
                        return (
                          <li key={entry.url}>
                            <a
                              href={entry.url}
                              title={name}
                              aria-current={active ? 'page' : undefined}
                              className={cn(
                                'relative flex h-7.5 items-center gap-2 overflow-hidden pr-3 pl-10 font-mono text-xs leading-7.5 whitespace-nowrap text-text-soft transition-colors duration-(--motion-fast) ease-standard hover:bg-state-hover hover:text-text focus-visible:-outline-offset-2',
                                mark?.kind === 'read' && 'text-text-muted',
                                active &&
                                  'bg-state-selected text-text before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-accent',
                              )}
                            >
                              <span
                                aria-hidden="true"
                                className="h-[11px] w-[9px] flex-none rounded-[1px_3px_1px_1px] bg-accent"
                              />
                              <span className="min-w-0 truncate">{name}</span>
                              {mark && <ReadMark mark={mark} />}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
            {outline.length > 0 && (
              <section aria-labelledby="explorer-outline" className="border-t border-border pb-2">
                <SectionHead id="explorer-outline">개요</SectionHead>
                <nav aria-label="글 개요" className="pt-0.5 pb-1.5">
                  <ol className="relative m-0 list-none p-0 before:absolute before:inset-y-0 before:left-[21px] before:w-px before:bg-border-subtle">
                    {outline.map((chapter, index) => {
                      const inChapter = reading.chapter?.id === chapter.id;
                      const atChapter = inChapter && !reading.section;
                      return (
                        <li key={chapter.id}>
                          <a
                            href={`#${chapter.id}`}
                            aria-current={atChapter ? 'location' : undefined}
                            className={cn(
                              'relative flex gap-2 py-[5px] pr-3.5 pl-8 text-[13px] leading-[1.45] text-text-soft transition-colors duration-(--motion-fast) ease-standard hover:bg-state-hover hover:text-text focus-visible:-outline-offset-2',
                              inChapter && 'text-text',
                              atChapter && outlineCurrent,
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                'min-w-[18px] font-mono text-[11.5px] leading-[1.68] text-text-muted',
                                inChapter && 'text-accent-text',
                              )}
                            >
                              {chapterNo(index)}
                            </span>
                            <span>{chapter.text}</span>
                          </a>
                          {chapter.children.length > 0 && (
                            <ol className="m-0 list-none p-0">
                              {chapter.children.map((section) => {
                                const here = reading.section?.id === section.id;
                                return (
                                  <li key={section.id}>
                                    <a
                                      href={`#${section.id}`}
                                      aria-current={here ? 'location' : undefined}
                                      className={cn(
                                        'relative block py-[5px] pr-3.5 pl-15 text-[12.5px] leading-[1.45] text-text-soft transition-colors duration-(--motion-fast) ease-standard hover:bg-state-hover hover:text-text focus-visible:-outline-offset-2',
                                        here && outlineCurrent,
                                      )}
                                    >
                                      {section.text}
                                    </a>
                                  </li>
                                );
                              })}
                            </ol>
                          )}
                        </li>
                      );
                    })}
                    {/* 읽은 만큼 채워지는 세로선 */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-[21px] w-px origin-top bg-accent transition-transform duration-(--motion-fast) ease-standard"
                      style={{ transform: `scaleY(${(reading.percent ?? 0) / 100})` }}
                    />
                  </ol>
                </nav>
              </section>
            )}
          </>
        )}
      </aside>

      <div
        aria-hidden="true"
        hidden={!overlay}
        onClick={() => updatePanel(dismissPanel)}
        className="fixed inset-x-0 top-(--bar-height) bottom-(--bar-height-xs) z-34 bg-scrim max-[759px]:z-45"
      />

      <Tabs
        current={current}
        onNavigate={navigateLikeLink}
        className="fixed top-(--bar-height) right-0 left-(--editor-left) z-30"
      />

      <footer className="fixed inset-x-0 bottom-0 z-50 flex h-(--bar-height-xs) items-center overflow-hidden bg-accent font-mono text-xs leading-none font-medium whitespace-nowrap text-on-accent">
        <span
          aria-hidden="true"
          className="flex items-center gap-1.5 self-stretch bg-on-accent/12 px-3"
        >
          <BranchIcon className="size-3.5" />
          main
        </span>
        {log ? (
          <span aria-hidden="true" className="min-w-0 flex-1 truncate pr-3 pl-3">
            {log}
          </span>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-4 pr-3 pl-3">
            {file?.kind === 'post' ? (
              <span className="min-w-0 truncate font-sans">
                {readingSymbol(reading) || file.title}
              </span>
            ) : (
              <span className="truncate">{file?.summary ?? file?.path}</span>
            )}
            {reading.line !== null && <span className="max-[759px]:hidden">Ln {reading.line}</span>}
            <span className="flex-1" />
            {reading.percent !== null && <span>{reading.percent}%</span>}
          </span>
        )}
      </footer>
    </>
  );
}
