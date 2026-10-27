/**
 * 검색 색인 만들기(블로그 쪽 순수 로직). 글 한 편을 글 화면과 같은 블록으로 나누고, 블록마다 줄 번호와
 * 장·절, 순수 텍스트를 붙인다. 파일·Astro·DOM은 모른다(엔드포인트가 글 데이터를 넘긴다).
 *
 * 본문은 MDX를 Sätteri 파서로 hast까지 읽어 최상위 블록(문단·제목·코드·인용·목록·표·가로줄·JSX 요소)으로 나눈다.
 * 글 화면에서 `.doc-prose`의 자식 하나가 되는 단위다. 맞는지는 빌드 결과물 테스트가 실제 HTML과 맞대어 본다.
 */
import type { MarkdownHeading } from 'astro';
import { mdxToHast, type HastNode } from 'satteri';
import { locateInOutline, type SearchBlock, type SearchPost } from '@/design-system';
import { buildOutline } from './ide';

/** 글 한 편의 색인 재료. */
export interface SearchPostSource {
  url: string;
  title: string;
  path: string;
  /** frontmatter 줄에 보이는 날짜(`YYYY-MM-DD`). */
  pubDate: string;
  tags: string[];
  heroImage?: string;
  /** 작성 정보 줄의 글자. */
  byline: string;
  /**
   * 작성 정보 아래 고정 문구 줄이 있는지(AI 글). 글마다 같은 문구라 찾을 글자 없이 줄 번호만 센다.
   * 담으면 "AI가" 같은 검색어가 모든 AI 글의 그 줄에 걸린다.
   */
  notice?: boolean;
  /** MDX 원문 본문(frontmatter 제외). */
  body: string;
  /** Astro가 본문에서 뽑은 제목(문서 순서). 장·절의 id·제목은 여기서 온다. */
  headings: MarkdownHeading[];
}

const quote = (value: string) => JSON.stringify(value);

/**
 * 글 화면의 frontmatter 줄 글자. 태그가 있으면 `tags`, 대표 이미지가 있으면 `heroImage` 줄이 더해진다.
 * 대표 이미지 자체(그림)는 줄로 세지 않는다.
 */
function frontmatterLines({ title, pubDate, tags, heroImage }: SearchPostSource): string[] {
  return [
    '---',
    `title: ${quote(title)}`,
    `pubDate: ${pubDate}`,
    ...(tags.length > 0 ? [`tags: [${tags.map(quote).join(', ')}]`] : []),
    ...(heroImage ? [`heroImage: ${quote(heroImage)}`] : []),
    '---',
  ];
}

// ── 블록 나누기 ─────────────────────────────────────────────────────────────

/** 글 화면에 그려지는 최상위 블록: Markdown이 만든 요소(문단·제목·코드·인용·목록·표·가로줄·각주)와 JSX 요소. */
type Block = Extract<HastNode, { type: 'element' | 'mdxJsxFlowElement' }>;

/**
 * MDX 본문을 Astro 7 기본 처리기 Sätteri로 hast까지 읽고 최상위 블록만 남긴다. 블록 사이의 줄바꿈 글자,
 * import·export, 표현식(주석)은 그려지지 않으므로 뺀다. GFM은 글 화면과 같이 켜고, 둥근 따옴표(smart
 * punctuation)는 끈다. 검색어를 자판으로 친 곧은 따옴표·`...`와 맞도록 원문 글자를 둔다.
 */
function splitBlocks(body: string): Block[] {
  const root = mdxToHast(body, {
    position: false,
    features: { gfm: true, smartPunctuation: false, frontmatter: false },
  });
  if (root.type !== 'root') return [];
  return root.children.filter(
    (node): node is Block => node.type === 'element' || node.type === 'mdxJsxFlowElement',
  );
}

const isHeading = (node: HastNode) => node.type === 'element' && /^h[1-6]$/.test(node.tagName);

/** 블록 안의 제목 수. Astro가 `headings`에 넣는 것과 같이 Markdown 제목(JSX가 아닌 `h1`~`h6`)을 센다. */
function countHeadings(node: HastNode): number {
  if (isHeading(node)) return 1;
  return 'children' in node
    ? node.children.reduce((sum, child) => sum + countHeadings(child), 0)
    : 0;
}

// ── 순수 텍스트 ─────────────────────────────────────────────────────────────

const isBreak = (node: HastNode) =>
  (node.type === 'element' && node.tagName === 'br') ||
  ((node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') && node.name === 'br');

/**
 * 보이는 글자. 글자 노드만 모으므로 그림·표현식·import는 빠지고 엔티티·이스케이프는 파서가 이미 풀어 두었다.
 * 줄바꿈(`<br>`)은 공백으로 둔다. JSX 요소 안의 블록 사이에는 줄바꿈 글자가 없어 공백을 넣는다.
 */
function textOf(node: HastNode): string {
  if (node.type === 'text') return node.value;
  if (isBreak(node)) return ' ';
  if (!('children' in node)) return '';
  return node.children.map(textOf).join(node.type === 'mdxJsxFlowElement' ? ' ' : '');
}

const collapse = (text: string) => text.replaceAll(/\s+/g, ' ').trim();

// ── 색인 ───────────────────────────────────────────────────────────────────

/**
 * 글 한 편의 색인. 줄 번호는 글 화면의 줄 번호 칸과 같고(frontmatter 줄 → 제목 → 작성 정보 → 고정 문구(빈 글자) → 본문 블록),
 * 장·절은 탐색기 개요(`buildOutline`)와 같은 id·번호·제목이다. 본문의 제목은 문서 순서대로 `headings`와 짝짓는다.
 */
export function searchPost(source: SearchPostSource): SearchPost {
  const outline = buildOutline(source.headings);
  const head = [
    ...frontmatterLines(source),
    source.title,
    source.byline,
    ...(source.notice ? [''] : []),
  ].map((text): Omit<SearchBlock, 'line'> => ({ chapter: null, section: null, text }));

  const passed: string[] = [];
  let heading = 0;
  const body = splitBlocks(source.body).map((block): Omit<SearchBlock, 'line'> => {
    for (let count = countHeadings(block); count > 0; count -= 1) {
      const slug = source.headings[heading]?.slug;
      heading += 1;
      if (slug) passed.push(slug);
    }
    return { ...locateInOutline(outline, passed), text: collapse(textOf(block)) };
  });

  return {
    url: source.url,
    title: source.title,
    path: source.path,
    blocks: [...head, ...body].map((block, index) => ({ line: index + 1, ...block })),
  };
}
