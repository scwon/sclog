/**
 * 검색 색인의 모양(블로그 ↔ 창 틀 계약). 블로그가 빌드 때 이 모양의 JSON을 만들고, 검색 화면이 처음 열릴 때
 * 내려받는다. 디자인 시스템은 블로그 내용을 모르므로 모양만 여기에 두고 주소는 props로 받는다.
 */

/** 색인 한 블록: 글 화면의 줄 번호 칸 하나에 해당한다. */
export interface SearchBlock {
  /** 글 화면의 줄 번호(1부터). frontmatter 줄 → 제목 → 작성 정보 → 본문 블록 순서로 센다. */
  line: number;
  /** 이 블록이 속한 장(탐색기 개요와 같은 id·번호·제목). 첫 장 전이면 `null`. */
  chapter: { id: string; no: string; text: string } | null;
  /** 이 블록이 속한 절. 장 머리이거나 절이 없으면 `null`. */
  section: { id: string; text: string } | null;
  /** MDX 문법과 HTML을 걷어 낸 순수 텍스트(공백은 하나로 줄임). 그림만 있는 블록은 빈 문자열이다. */
  text: string;
}

/** 색인에 든 글 하나. */
export interface SearchPost {
  /** 글 주소(`/blog/<slug>/`). */
  url: string;
  title: string;
  /** 창 틀의 파일 경로(`posts/<연도>/<slug>.mdx`). */
  path: string;
  /** 줄 번호 순서의 모든 블록. 마지막 블록의 `line`이 그 글의 줄 수다. */
  blocks: SearchBlock[];
}

/** `/search-index.json` 전체. `posts`는 최신 글이 먼저다. */
export interface SearchIndex {
  v: 1;
  posts: SearchPost[];
}
