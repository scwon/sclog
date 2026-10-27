import { render } from 'astro:content';
import type { MarkdownHeading } from 'astro';
import type { BlogPost } from './blog';
import { chapterNo } from '@/design-system';
import { buildOutline, postFile, postUrl, postYear } from './ide';
import { FOLDER_ROUTES } from './folder';

/** 홈 아래 AI 글 칸에 보이는 AI 글 수 상한. */
export const HOME_AI_WRITTEN_LIMIT = 5;

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

/** 글과 그 흐름 로그 모양. */
export type FlowEntry = { post: BlogPost; flow: FlowPost };

/** 글마다 본문 제목을 읽어 흐름 로그의 글을 만든다(빌드 시). */
export async function loadFlows(posts: BlogPost[]): Promise<FlowEntry[]> {
  return Promise.all(
    posts.map(async (post) => ({ post, flow: flowPost(post, (await render(post)).headings) })),
  );
}

/** 흐름 로그의 줄. 접힘 줄(`folded`)만 줄 번호가 없다. */
export type FlowLine =
  | { kind: 'banner'; no: number; text: string }
  | { kind: 'comment'; no: number; text: string; link?: { href: string; label: string } }
  | { kind: 'blank'; no: number }
  | { kind: 'entry'; no: number; href: string; label: string; note?: string }
  | { kind: 'dir'; no: number; year: string; count: number }
  | { kind: 'log'; no: number; post: FlowPost; foldable: boolean }
  | { kind: 'step'; no: number; post: FlowPost; step: FlowStep; index: number }
  | { kind: 'folded'; post: FlowPost }
  | { kind: 'end'; no: number; label: string };

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
      no: chapterNo(index),
      text: chapter.text,
      href: `${url}#${chapter.id}`,
      subs: chapter.children.map((section) => ({
        text: section.text,
        href: `${url}#${section.id}`,
      })),
    })),
  };
}

/** 줄 번호를 차례로 붙이며 줄을 쌓는다. 접힘 줄은 번호 없이 끼운다. */
function lineWriter() {
  const lines: FlowLine[] = [];
  let no = 0;
  return {
    lines,
    /** 번호가 붙는 줄을 더한다. */
    add: (line: DistributiveOmit<FlowLine, 'no'>) => {
      if (line.kind === 'folded') lines.push(line);
      else lines.push({ ...line, no: (no += 1) } as FlowLine);
    },
  };
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** 연도마다 연도 줄 → 글마다 로그 줄(카드)과, `steps`면 장 줄·접힘 줄. */
function addPosts(write: ReturnType<typeof lineWriter>, posts: FlowEntry[], steps: boolean) {
  const years = new Map<string, FlowPost[]>();
  for (const { post, flow } of posts)
    years.set(postYear(post), [...(years.get(postYear(post)) ?? []), flow]);
  for (const [year, list] of years) {
    write.add({ kind: 'dir', year, count: list.length });
    for (const post of list) {
      write.add({ kind: 'log', post, foldable: steps && post.steps.length > 0 });
      if (!steps) continue;
      post.steps.forEach((step, index) => write.add({ kind: 'step', post, step, index }));
      if (post.steps.length > 0) write.add({ kind: 'folded', post });
    }
  }
}

/**
 * 홈 `posts.log`: 블로그 이름·주석·빈 줄 → 직접 쓴 글의 연도별 글(장 흐름 포함) → AI 글 칸 → 끝 줄.
 * AI 글 칸은 나가는 줄 `ai-written.log ---- 글 M편`(M은 AI 글 전체 수) 아래 AI 글 로그 줄을
 * 최신순 최대 다섯 개 둔다(장 흐름·접힘 없음). AI 글이 없으면 칸을 생략한다. 끝 줄은 직접 쓴 글만 센다.
 */
export function homeLines(
  posts: FlowEntry[],
  site: { brand: string; author: string; githubUrl: string },
  aiWritten: FlowEntry[] = [],
): FlowLine[] {
  const write = lineWriter();
  write.add({ kind: 'banner', text: site.brand });
  write.add({
    kind: 'comment',
    text: `${site.author} ·`,
    link: { href: site.githubUrl, label: site.githubUrl.replace(/^https?:\/\//, '') },
  });
  write.add({ kind: 'blank' });
  addPosts(write, posts, true);
  if (aiWritten.length > 0) {
    const { log } = FOLDER_ROUTES['ai-written'];
    write.add({ kind: 'entry', href: log.url, label: log.name, note: `글 ${aiWritten.length}편` });
    for (const { flow } of aiWritten.slice(0, HOME_AI_WRITTEN_LIMIT))
      write.add({ kind: 'log', post: flow, foldable: false });
  }
  write.add({ kind: 'end', label: `글 ${posts.length}편` });
  return write.lines;
}

/**
 * 이름·주석·빈 줄 → 연도별 글 카드 → 끝 줄 `글 N편`. 글 목록·태그별 글은 장 흐름 없이,
 * 폴더의 로그(`ai-written.log`)는 `steps`를 켜 홈처럼 장 흐름까지 그린다.
 */
export function listLines(
  posts: FlowEntry[],
  { title, comment, steps = false }: { title: string; comment: string; steps?: boolean },
): FlowLine[] {
  const write = lineWriter();
  write.add({ kind: 'banner', text: title });
  write.add({ kind: 'comment', text: comment });
  write.add({ kind: 'blank' });
  addPosts(write, posts, steps);
  write.add({ kind: 'end', label: `글 ${posts.length}편` });
  return write.lines;
}

/** 링크 목록(태그 목록, 404의 갈 곳): 이름·주석·빈 줄 → 링크 줄 → 끝 줄. */
export function linkLines({
  title,
  comment,
  links,
  end,
}: {
  title: string;
  comment: string;
  links: { href: string; label: string; note?: string }[];
  /** 끝 줄 글자. 없으면 `링크 N개`. */
  end?: string;
}): FlowLine[] {
  const write = lineWriter();
  write.add({ kind: 'banner', text: title });
  write.add({ kind: 'comment', text: comment });
  write.add({ kind: 'blank' });
  for (const link of links) write.add({ kind: 'entry', ...link });
  write.add({ kind: 'end', label: end ?? `링크 ${links.length}개` });
  return write.lines;
}
