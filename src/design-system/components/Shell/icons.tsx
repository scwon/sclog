import type { SVGProps } from 'react';

/** 창 틀 아이콘. 시안의 인라인 SVG를 옮겼고 모두 장식(`aria-hidden`)이다. */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
} as const;

/** 글 파일 기호(장식): 접힌 모서리 종이. 탐색기 파일 줄, 검색 화면의 파일 줄, 팔레트의 글 줄이 같이 쓴다. */
export function FileGlyph() {
  return (
    <span
      aria-hidden="true"
      className="h-[11px] w-[9px] flex-none rounded-[1px_3px_1px_1px] bg-accent"
    />
  );
}

/** 햄버거 메뉴(좁은 화면의 탐색기 서랍). */
export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.6} strokeLinecap="round" {...props}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

/** 겹친 파일(활동 막대의 탐색기). */
export function ExplorerIcon(props: IconProps) {
  return (
    <svg {...base} strokeLinejoin="round" {...props}>
      <path d="M8 3.5h7l4 4V17a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 17V5A1.5 1.5 0 0 1 8 3.5Z M15 3.5V8h4 M4.5 7v12A1.5 1.5 0 0 0 6 20.5h9" />
    </svg>
  );
}

/** 사람 윤곽(활동 막대의 프로필). */
export function ProfileIcon(props: IconProps) {
  return (
    <svg {...base} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4.5 20.5c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5" />
    </svg>
  );
}

/** 돋보기(활동 막대의 검색). */
export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} strokeLinecap="round" {...props}>
      <path d="M10.5 16.5a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z M15 15l5.5 5.5" />
    </svg>
  );
}

/** 브랜드 로고는 Simple Icons(CC0) v13.21.0의 경로를 옮겼다. 글자색(`currentColor`)으로 칠한다. */
const brand = { viewBox: '0 0 24 24', 'aria-hidden': true, fill: 'currentColor' } as const;

/** GitHub 로고(활동 막대의 이 블로그의 소스, 프로필 연락처). */
export function GitHubIcon(props: IconProps) {
  return (
    <svg {...brand} {...props}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/** LinkedIn 로고(프로필 연락처). */
export function LinkedInIcon(props: IconProps) {
  return (
    <svg {...brand} {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/** 봉투(프로필 연락처의 이메일). */
export function MailIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} strokeLinejoin="round" {...props}>
      <path d="M3.5 6.5h17v11h-17Z m0 0 8.5 6.5 8.5-6.5" />
    </svg>
  );
}

/** 바깥 링크 화살표. */
export function ExternalIcon(props: IconProps) {
  return (
    <svg
      {...base}
      viewBox="0 0 20 20"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 13 13 7m-5 0h5v5" />
    </svg>
  );
}

/** 가지(상태줄의 main). */
export function BranchIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.6} strokeLinecap="round" {...props}>
      <path d="M7 4v16M7 15c0-4 10-3 10-8M7 20a2 2 0 1 0 0-.01M7 6a2 2 0 1 0 0-.01M17 7a2 2 0 1 0 0-.01" />
    </svg>
  );
}

/** 위 화살표(찾기 줄의 이전 일치). */
export function ArrowUpIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 19V5m-6 6 6-6 6 6" />
    </svg>
  );
}

/** 아래 화살표(찾기 줄의 다음 일치). */
export function ArrowDownIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14m-6-6 6 6 6-6" />
    </svg>
  );
}

/** 엑스(찾기 줄 닫기). */
export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.6} strokeLinecap="round" {...props}>
      <path d="m6.5 6.5 11 11m0-11-11 11" />
    </svg>
  );
}
