/**
 * 검색 색인 `/search-index.json`. 빌드 때 발행된 글(초안·예약 글 제외)을 최신 글부터 담는다.
 * 검색 화면이 처음 열릴 때 내려받는다. 모양은 디자인 시스템의 `SearchIndex`, 블록 규칙은 `utils/search-index`.
 */
import type { APIRoute } from 'astro';
import { render } from 'astro:content';
import { SEARCH_INDEX_VERSION, type SearchIndex } from '@/design-system';
import { SITE } from '../site';
import { getPublishedPosts } from '../utils/blog';
import { postFile } from '../utils/ide';
import { searchPost } from '../utils/search-index';

/** 색인 JSON을 만든다. */
export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const index: SearchIndex = {
    v: SEARCH_INDEX_VERSION,
    posts: await Promise.all(
      posts.map(async (post) => {
        const { headings } = await render(post);
        const { url, title, path, reading } = postFile(post);
        const isoDate = post.data.pubDate.toISOString().slice(0, 10);
        return searchPost({
          url,
          title,
          path,
          pubDate: isoDate,
          tags: post.data.tags,
          heroImage: post.data.heroImage,
          byline: `${SITE.author} · ${isoDate.replaceAll('-', '.')} · 읽는 시간 ${reading}분`,
          body: post.body ?? '',
          headings,
        });
      }),
    ),
  };
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
