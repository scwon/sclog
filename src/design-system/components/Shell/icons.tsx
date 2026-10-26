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

/** 꺾쇠 코드(이 블로그의 소스). */
export function CodeIcon(props: IconProps) {
  return (
    <svg {...base} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m8.5 7.5-5 4.5 5 4.5m7-9 5 4.5-5 4.5m-2-11-3 13" />
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
