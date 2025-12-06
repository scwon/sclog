import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

/**
 * 발행된 블로그 글 목록을 최신순으로 반환
 * - draft: true인 글 제외
 * - 미래 날짜 글 제외 (예약 발행)
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => {
    const now = new Date();
    return !data.draft && data.pubDate <= now;
  });

  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
}

/**
 * 모든 태그와 해당 글 수를 반환
 */
export async function getAllTags(): Promise<Map<string, number>> {
  const posts = await getPublishedPosts();
  const tagCount = new Map<string, number>();

  posts.forEach((post) => {
    post.data.tags.forEach((tag) => {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    });
  });

  return tagCount;
}

/**
 * 특정 태그를 가진 글 목록 반환
 */
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.data.tags.includes(tag));
}

/**
 * 읽기 시간 추정 (분 단위)
 * 한국어: 약 500자/분, 영어: 약 200단어/분
 */
export function getReadingTime(content: string): number {
  const koreanChars = (content.match(/[\uAC00-\uD7A3]/g) || []).length;
  const words = content.split(/\s+/).filter((word) => word.length > 0).length;

  const koreanMinutes = koreanChars / 500;
  const englishMinutes = (words - koreanChars) / 200;

  return Math.max(1, Math.ceil(koreanMinutes + englishMinutes));
}
