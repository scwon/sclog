/**
 * 검색 화면의 찾기 규칙. 색인(`SearchIndex`)과 검색어만 받아 파일별로 묶인 결과를 돌려준다. DOM을 모르고,
 * 바인딩은 `SearchView.tsx`가 맡는다. 글자 맞추기는 명령 팔레트와 같은 `match.logic.ts`를 쓴다.
 */

import { fileName } from '../../stores/file.logic';
import type { SearchBlock, SearchIndex } from './search-index';
import { matchRanges, normalizeForMatch, type MatchRange } from './match.logic';

/** 이 글자 수(앞뒤 공백을 지운 원래 글자 기준)부터 찾는다. */
export const MIN_QUERY_CHARS = 2;

/** 파일마다 처음 보이는 결과 줄 수. 나머지는 `… N줄 더`로 편다. */
export const LINES_PER_FILE = 5;

/** 일치한 블록 하나(결과 줄 하나). */
export interface SearchHit {
  /** 글 화면의 줄 번호. */
  line: number;
  /** 절 앵커, 없으면 장 앵커, 둘 다 없으면 글 맨 위. */
  href: string;
  /** `04 개발자란? › 3~4년차 · Ln 21`. 첫 장 전 블록은 `Ln 1`. */
  place: string;
  /** 블록 글자 전체. 발췌는 `excerpt`로 자른다. */
  text: string;
  /** `text`에서 일치한 범위. 블록 안의 일치를 모두 담는다. */
  ranges: MatchRange[];
}

/** 일치한 줄이 있는 글 하나(파일 묶음). */
export interface SearchFile {
  url: string;
  title: string;
  /** `posts/<연도>/<slug>.mdx` */
  path: string;
  /** 파일 이름(`<slug>.mdx`). */
  name: string;
  /** 줄 번호 순서의 결과 줄. */
  hits: SearchHit[];
}

/** 찾은 결과. 요약 줄은 `${files.length}개 파일, ${lines}줄`이다. */
export interface SearchResults {
  files: SearchFile[];
  lines: number;
}

/** 검색어를 다듬는다. 앞뒤 공백을 지우고, 원래 글자로 두 글자 미만이면 `null`(찾지 않음). */
export function searchTerm(query: string): string | null {
  const term = query.trim();
  return [...term].length >= MIN_QUERY_CHARS ? term : null;
}

function placeOf(block: SearchBlock): string {
  const ln = `Ln ${block.line}`;
  if (!block.chapter) return ln;
  const section = block.section ? ` › ${block.section.text}` : '';
  return `${block.chapter.no} ${block.chapter.text}${section} · ${ln}`;
}

function hrefOf(url: string, block: SearchBlock): string {
  const anchor = block.section?.id ?? block.chapter?.id;
  return anchor ? `${url}#${anchor}` : url;
}

/**
 * 색인에서 검색어를 찾는다. 검색어가 두 글자 미만이면 `null`이다. 순위는 제목에 검색어가 든 글 → 일치한 줄이 많은
 * 글 → 최신 글(색인 순서) 순이고, 파일 안의 줄은 줄 번호 순이다. 한 블록에 일치가 여럿이어도 결과 줄은 하나다.
 */
export function searchPosts(index: SearchIndex, query: string): SearchResults | null {
  const term = searchTerm(query);
  if (!term) return null;
  const needle = normalizeForMatch(term);
  const ranked = index.posts
    .map((post, order) => {
      const hits: SearchHit[] = [];
      for (const block of post.blocks) {
        const ranges = matchRanges(block.text, term);
        if (ranges.length === 0) continue;
        hits.push({
          line: block.line,
          href: hrefOf(post.url, block),
          place: placeOf(block),
          text: block.text,
          ranges,
        });
      }
      const file: SearchFile = {
        url: post.url,
        title: post.title,
        path: post.path,
        name: fileName(post.path),
        hits,
      };
      return { file, order, inTitle: normalizeForMatch(post.title).includes(needle) };
    })
    .filter(({ file }) => file.hits.length > 0)
    .toSorted(
      (a, b) =>
        Number(b.inTitle) - Number(a.inTitle) ||
        b.file.hits.length - a.file.hits.length ||
        a.order - b.order,
    );
  const files = ranked.map(({ file }) => file);
  return { files, lines: files.reduce((sum, file) => sum + file.hits.length, 0) };
}

/** 파일 묶음에서 보일 줄과 접혀 남은 줄 수. 펼쳤으면(`expanded`) 모두 보인다. */
export function capHits<T>(hits: T[], expanded: boolean): { shown: T[]; more: number } {
  if (expanded || hits.length <= LINES_PER_FILE) return { shown: hits, more: 0 };
  return { shown: hits.slice(0, LINES_PER_FILE), more: hits.length - LINES_PER_FILE };
}

/** 발췌에서 첫 일치 앞에 남기는 글자 수. */
const EXCERPT_LEAD = 12;
/** 발췌 길이 상한. 화면은 두 줄에서 자르므로 DOM에 넣을 만큼만 남긴다. */
const EXCERPT_LENGTH = 200;

/**
 * 결과 줄의 발췌. 첫 일치가 앞쪽에 보이도록 블록 글자의 앞을 잘라 `…`를 붙이고, 일치 범위를 잘린 글자에 맞춰
 * 옮긴다. 뒤쪽은 상한까지만 남기고 나머지 말줄임은 화면(두 줄 자르기)에 맡긴다.
 */
export function excerpt(
  text: string,
  ranges: MatchRange[],
): { text: string; ranges: MatchRange[] } {
  const first = ranges[0]?.[0] ?? 0;
  let start = Math.max(0, first - EXCERPT_LEAD);
  if (start > 0) {
    // 낱말 가운데서 자르지 않도록 첫 일치 전의 공백 뒤로 옮긴다. 공백이 없으면 서로게이트 쌍만 피한다.
    const space = text.slice(start, first).search(/\s/);
    if (space >= 0) start += space + 1;
    else if (/[\uDC00-\uDFFF]/.test(text[start])) start -= 1;
  }
  const end = Math.min(text.length, start + EXCERPT_LENGTH);
  const prefix = start > 0 ? '…' : '';
  const shift = prefix.length - start;
  return {
    text: prefix + text.slice(start, end),
    ranges: ranges
      .filter(([from]) => from < end)
      .map(([from, to]): MatchRange => [from + shift, Math.min(to, end) + shift]),
  };
}
