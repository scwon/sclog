import { statSync } from 'node:fs';
import type { MarkdownHeading } from 'astro';
import type { BlogPost } from './blog';
import { getReadingTime } from './blog';

/** 창 틀에 넘기는 열린 파일 정보(에디터 루트 `data-file-*`의 원본). */
export interface IdeFile {
  title: string;
  path: string;
  url: string;
  kind: 'log' | 'post' | 'page';
  size?: number;
  reading?: number;
  summary?: string;
}

/** 탐색기 개요의 장과 절. */
export interface IdeOutlineItem {
  id: string;
  text: string;
  children: { id: string; text: string }[];
}

/** 글의 연도(UTC 기준이라 빌드 환경의 시간대와 무관하다). */
export function postYear(post: BlogPost): string {
  return String(post.data.pubDate.getUTCFullYear());
}

/** 글 URL. 기존 주소 `/blog/<slug>/`를 그대로 쓴다. */
export function postUrl(post: BlogPost): string {
  return `/blog/${post.id}/`;
}

/** 글을 창 틀의 파일로 본다: 경로 `posts/<연도>/<slug>.mdx`, 크기는 원본 파일 바이트. */
export function postFile(post: BlogPost): IdeFile {
  return {
    title: post.data.title,
    path: `posts/${postYear(post)}/${post.id}.mdx`,
    url: postUrl(post),
    kind: 'post',
    size: post.filePath ? statSync(post.filePath).size : undefined,
    reading: getReadingTime(post.body ?? ''),
  };
}

/** 탐색기 트리: 연도 폴더(최신 연도 먼저)와 그 안의 글 파일. */
export function buildTree(posts: BlogPost[]) {
  const years = new Map<string, BlogPost[]>();
  for (const post of posts) years.set(postYear(post), [...(years.get(postYear(post)) ?? []), post]);
  return [...years.entries()]
    .toSorted(([a], [b]) => b.localeCompare(a))
    .map(([year, list]) => ({
      year,
      files: list.map((post) => {
        const { url, title, path } = postFile(post);
        return { url, title, path };
      }),
    }));
}

/** 본문 제목에서 개요를 만든다. 가장 얕은 단계가 장이고, 바로 아래 단계가 그 장의 절이다. */
export function buildOutline(headings: MarkdownHeading[]): IdeOutlineItem[] {
  if (headings.length === 0) return [];
  const top = Math.min(...headings.map((heading) => heading.depth));
  const outline: IdeOutlineItem[] = [];
  for (const heading of headings) {
    if (heading.depth === top) outline.push({ id: heading.slug, text: heading.text, children: [] });
    else if (heading.depth === top + 1)
      outline.at(-1)?.children.push({ id: heading.slug, text: heading.text });
  }
  return outline;
}
