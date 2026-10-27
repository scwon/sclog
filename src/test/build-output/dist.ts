import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

/**
 * `pnpm build`가 만든 `dist/`를 바깥에서 검사하는 테스트들(`src/test/build-output/*.test.ts`)의 공용 도우미.
 * 테스트 파일은 기능 하나씩 맡고, `dist/`가 없으면 `describe.skipIf(!built)`로 건너뛴다(CI는 build 뒤 test).
 */

/** 빌드 결과물 폴더(`dist/`)의 절대 경로. */
export const dist = resolve(import.meta.dirname, '../../../dist');
/** `dist/`가 있는지. 없으면 테스트를 건너뛴다. */
export const built = existsSync(dist);
/** 원본 글 폴더(`src/content/blog`)의 절대 경로. */
export const blogDir = resolve(import.meta.dirname, '../../content/blog');

/** `dist/` 안에서 그 확장자로 끝나는 파일의 절대 경로들. `dist/`가 없으면 빈 배열. */
export function files(extension: string): string[] {
  if (!built) return [];
  return readdirSync(dist, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith(extension))
    .map((file) => resolve(dist, file));
}

/** 모든 HTML 페이지의 경로와 내용. */
export const pages = files('.html').map((path) => ({ path, html: readFileSync(path, 'utf8') }));
/** 모든 스타일시트의 경로와 내용. */
export const styles = files('.css').map((path) => ({ path, css: readFileSync(path, 'utf8') }));

/** dist 안 경로 → 그 페이지의 URL: `index.html` → `/`, `a/index.html` → `/a/`, `404.html` → `/404` */
export function urlOf(path: string): string {
  const relative = path
    .slice(dist.length + 1)
    .split(sep)
    .join('/');
  return relative.endsWith('index.html')
    ? `/${relative.slice(0, -'index.html'.length)}`
    : `/${relative.slice(0, -'.html'.length)}`;
}

/** 에디터 루트(`<main>`)의 `data-file-url`. */
export function fileUrl(html: string): string | undefined {
  return /<main[^>]*\bdata-file-url="([^"]*)"/.exec(html)?.[1];
}

/** 개요 JSON의 장 하나와 그 절들. */
export interface OutlineEntry {
  id: string;
  text: string;
  children: { id: string; text: string }[];
}

/** 페이지 ↔ 창 틀 계약의 개요 JSON. */
export function outlineOf(html: string): OutlineEntry[] {
  const json = /<script[^>]*\bid="editor-outline"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1];
  return json ? (JSON.parse(json) as OutlineEntry[]) : [];
}

/** HTML이 이스케이프한 글자를 되돌린다(속성 값과 글자에 나오는 것만). */
export function decodeEntities(value: string): string {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

/** 정규식에서 특별한 뜻을 가진 글자를 이스케이프한다. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 태그 하나의 속성 값. */
export function attribute(tag: string, name: string): string | undefined {
  const value = new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
  return value === undefined ? undefined : decodeEntities(value);
}

/** 글 본문(`.doc-prose`)의 HTML. 본문 바로 뒤에 글 꼬리(`.doc-foot`)가 온다. 글이 아니면 빈 문자열. */
export function postBody(html: string): string {
  return /<div class="doc-prose[^"]*"[^>]*>([\s\S]*?)<footer class="doc-foot/.exec(html)?.[1] ?? '';
}

/** HTML 안의 `<a>`마다 `href`, 여는 태그의 속성 글자, 안쪽 HTML. */
export function anchors(html: string) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attributes, inner]) => ({
    href: /\bhref="([^"]*)"/.exec(attributes)?.[1] ?? '',
    attributes,
    inner,
  }));
}
