import type { MarkdownHeading } from 'astro';
import type { BlogPost } from './blog';
import { buildOutline, postFile, postUrl, postYear } from './ide';

/** 흐름 로그의 장 노드와 그 아래 절 노드. */
export interface FlowStep {
  no: string;
  text: string;
  href: string;
  subs: { text: string; href: string }[];
}

/** 흐름 로그의 글 하나. */
export interface FlowPost {
  id: string;
  title: string;
  url: string;
  date: string;
  category?: string;
  file: string;
  heroImage?: string;
  excerpt: string;
  reading?: number;
  steps: FlowStep[];
}

/** 흐름 로그의 줄. 접힘 줄(`folded`)만 줄 번호가 없다. */
export type FlowLine =
  | { kind: 'banner'; no: number }
  | { kind: 'comment'; no: number }
  | { kind: 'blank'; no: number }
  | { kind: 'dir'; no: number; year: string; count: number }
  | { kind: 'log'; no: number; post: FlowPost }
  | { kind: 'step'; no: number; post: FlowPost; step: FlowStep; index: number }
  | { kind: 'folded'; post: FlowPost }
  | { kind: 'end'; no: number; count: number };

/**
 * 본문의 첫 문장. 제목·인용·HTML·빈 줄을 건너뛴 첫 문단에서 마크다운 강조를 걷어 내고,
 * 첫 마침표(`.` `!` `?` 뒤 공백 또는 끝)까지 자른다.
 */
export function firstSentence(body: string): string {
  const paragraph =
    body
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .find((block) => block && !/^(#|>|<|---|```|import |export )/.test(block)) ?? '';
  const text = paragraph
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return /^.*?[.!?](?=\s|$)/.exec(text)?.[0] ?? text;
}

/** 글과 그 본문 제목으로 흐름 로그의 글을 만든다. 장 번호는 01부터. */
export function flowPost(post: BlogPost, headings: MarkdownHeading[]): FlowPost {
  const url = postUrl(post);
  return {
    id: post.id,
    title: post.data.title,
    url,
    date: post.data.pubDate.toISOString().slice(0, 10),
    category: post.data.tags[0],
    file: `${post.id}.mdx`,
    heroImage: post.data.heroImage,
    excerpt: firstSentence(post.body ?? ''),
    reading: postFile(post).reading,
    steps: buildOutline(headings).map((chapter, index) => ({
      no: String(index + 1).padStart(2, '0'),
      text: chapter.text,
      href: `${url}#${chapter.id}`,
      subs: chapter.children.map((section) => ({
        text: section.text,
        href: `${url}#${section.id}`,
      })),
    })),
  };
}

/** 흐름 로그의 줄 목록. 이름·주석·빈 줄 → 연도마다(연도 줄 → 글마다 로그 줄·장 줄·접힘 줄) → 끝 줄. */
export function flowLines(posts: { post: BlogPost; flow: FlowPost }[]): FlowLine[] {
  let no = 0;
  const next = () => (no += 1);
  const lines: FlowLine[] = [
    { kind: 'banner', no: next() },
    { kind: 'comment', no: next() },
    { kind: 'blank', no: next() },
  ];
  const years = new Map<string, FlowPost[]>();
  for (const { post, flow } of posts)
    years.set(postYear(post), [...(years.get(postYear(post)) ?? []), flow]);
  for (const [year, list] of years) {
    lines.push({ kind: 'dir', no: next(), year, count: list.length });
    for (const post of list) {
      lines.push({ kind: 'log', no: next(), post });
      post.steps.forEach((step, index) =>
        lines.push({ kind: 'step', no: next(), post, step, index }),
      );
      if (post.steps.length > 0) lines.push({ kind: 'folded', post });
    }
  }
  lines.push({ kind: 'end', no: next(), count: posts.length });
  return lines;
}
