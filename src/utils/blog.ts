import { getCollection, type CollectionEntry } from 'astro:content';
import { FOLDER_ROUTES, FOLDERS, type Folder } from './folder';

/** 글 한 편: 직접 쓴 글(`blog` 컬렉션)이거나 AI 글(`ai-written` 컬렉션). 폴더는 `postFolder`로 묻는다. */
export type BlogPost = CollectionEntry<'blog'> | CollectionEntry<'ai-written'>;

/** 한 폴더의 발행 글(순서 없음). `draft`·미래 날짜(예약 발행) 규칙은 폴더와 상관없이 같다. */
async function publishedIn(folder: Folder): Promise<BlogPost[]> {
  const now = new Date();
  return getCollection(
    FOLDER_ROUTES[folder].collection,
    ({ data }: BlogPost) => !data.draft && data.pubDate <= now,
  );
}

/**
 * 발행된 글 목록을 최신순으로 반환. 폴더를 주면 그 폴더만, 안 주면 두 폴더를 합친다.
 * - draft: true인 글 제외
 * - 미래 날짜 글 제외 (예약 발행)
 */
export async function getPublishedPosts(folder?: Folder): Promise<BlogPost[]> {
  const posts = (await Promise.all((folder ? [folder] : FOLDERS).map(publishedIn))).flat();
  return posts.toSorted((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * 한 폴더의 모든 태그와 해당 글 수를 반환
 */
export async function getAllTags(folder: Folder): Promise<Map<string, number>> {
  const posts = await getPublishedPosts(folder);
  const tagCount = new Map<string, number>();

  posts.forEach((post) => {
    post.data.tags.forEach((tag) => {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    });
  });

  return tagCount;
}

/**
 * 한 폴더에서 특정 태그를 가진 글 목록 반환
 */
export async function getPostsByTag(folder: Folder, tag: string): Promise<BlogPost[]> {
  const posts = await getPublishedPosts(folder);
  return posts.filter((post) => post.data.tags.includes(tag));
}

/**
 * 읽기 시간 추정 (분 단위)
 * 한국어: 약 500자/분, 영어: 약 200단어/분
 */
export function getReadingTime(content: string): number {
  // 한국어 글자 수
  const koreanChars = (content.match(/[\uAC00-\uD7A3]/g) || []).length;

  // 영어 단어 수 (한국어 제외한 알파벳 단어만)
  const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;

  const koreanMinutes = koreanChars / 500;
  const englishMinutes = englishWords / 200;

  return Math.max(1, Math.ceil(koreanMinutes + englishMinutes));
}
