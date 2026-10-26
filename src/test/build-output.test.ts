import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type { SearchIndex } from '@/design-system';
import type { TreeYear } from '@/design-system/components/Shell/Shell';
import { nextFile } from '@/design-system/components/Shell/tree.logic';
import { resolveInitialTheme } from '@/design-system/stores/theme.logic';

/**
 * `pnpm build`가 만든 `dist/`를 바깥에서 검사한다. `dist/`가 없으면 건너뛴다(CI는 build 뒤 test).
 */
const dist = resolve(import.meta.dirname, '../../dist');
const built = existsSync(dist);

function files(extension: string): string[] {
  if (!built) return [];
  return readdirSync(dist, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith(extension))
    .map((file) => resolve(dist, file));
}

const pages = files('.html').map((path) => ({ path, html: readFileSync(path, 'utf8') }));
const styles = files('.css').map((path) => ({ path, css: readFileSync(path, 'utf8') }));

/** `<head>` 안에서 `data-theme`를 정하는 인라인 스크립트 본문. */
function themeScript(html: string): string | undefined {
  const head = /<head>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? '';
  return [...head.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map(([, body]) => body)
    .find((body) => body.includes('data-theme'));
}

/** dist 안 경로 → 그 페이지의 URL: `index.html` → `/`, `a/index.html` → `/a/`, `404.html` → `/404` */
function urlOf(path: string): string {
  const relative = path
    .slice(dist.length + 1)
    .split(sep)
    .join('/');
  return relative.endsWith('index.html')
    ? `/${relative.slice(0, -'index.html'.length)}`
    : `/${relative.slice(0, -'.html'.length)}`;
}

/** 에디터 루트(`<main>`)의 `data-file-url`. */
function fileUrl(html: string): string | undefined {
  return /<main[^>]*\bdata-file-url="([^"]*)"/.exec(html)?.[1];
}

const VOID = new Set([
  'area',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

/**
 * 글 화면에서 줄 번호가 붙는 블록(`ide.css`의 `.doc-fm-line, .doc-title, .doc-byline, .doc-prose > *`)을
 * 문서 순서로 돌려준다. 값은 블록의 `id`(없으면 빈 문자열)다. 본문은 `.doc-prose`의 직계 자식만 센다.
 */
function numberedBlocks(html: string): string[] {
  const head = [...html.matchAll(/<[a-z0-9]+\b[^>]*\bclass="(doc-fm-line|doc-title|doc-byline)"/g)];
  const blocks = head.map(() => '');
  const start = /<div class="doc-prose"[^>]*>/.exec(html);
  if (!start) return blocks;
  const tag = /<(\/?)([a-zA-Z][\w-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  tag.lastIndex = start.index + start[0].length;
  let depth = 0;
  for (let match = tag.exec(html); match; match = tag.exec(html)) {
    const [, closing, name, attributes] = match;
    if (closing) {
      if (depth === 0) break;
      depth -= 1;
      continue;
    }
    if (depth === 0) blocks.push(/\bid="([^"]*)"/.exec(attributes)?.[1] ?? '');
    if (!VOID.has(name.toLowerCase()) && !attributes.trimEnd().endsWith('/')) depth += 1;
  }
  return blocks;
}

/** 원본 글 가운데 발행된 글(초안이 아니고 발행일이 지난 글)의 URL, 최신 글부터. */
function publishedPostUrls(): string[] {
  const folder = resolve(import.meta.dirname, '../content/blog');
  return readdirSync(folder)
    .filter((name) => name.endsWith('.mdx'))
    .map((name) => {
      const frontmatter = /^---\n([\s\S]*?)\n---/.exec(readFileSync(resolve(folder, name), 'utf8'));
      const field = (key: string) =>
        new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(frontmatter?.[1] ?? '')?.[1].trim();
      return {
        url: `/blog/${name.slice(0, -'.mdx'.length)}/`,
        date: new Date(field('pubDate') ?? ''),
        draft: field('draft') === 'true',
      };
    })
    .filter(({ date, draft }) => !draft && date.valueOf() <= Date.now())
    .toSorted((a, b) => b.date.valueOf() - a.date.valueOf())
    .map(({ url }) => url);
}

/** 글 끝 이동 줄(`nav.doc-end`)의 줄들: 링크 주소, 라벨, 접근 가능한 이름(`aria-label`), 꼬리표 자리 유무. */
function docEndLines(html: string) {
  const nav = /<nav class="doc-end"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? '';
  return [...nav.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(([, line]) => ({
    href: /<a\b[^>]*\bhref="([^"]*)"/.exec(line)?.[1],
    label: /class="doc-end-label"[^>]*>([^<]*)</.exec(line)?.[1],
    name: /<a\b[^>]*\baria-label="([^"]*)"/.exec(line)?.[1],
    mark: line.includes('data-next-file-mark'),
  }));
}

interface Environment {
  stored?: string | null;
  storageThrows?: boolean;
  prefersLight?: boolean;
}

/** 스크립트를 브라우저 대역(localStorage·matchMedia·documentElement) 위에서 실행한다. */
function runThemeScript(script: string, env: Environment) {
  const attributes = new Map<string, string>();
  const listeners = new Map<string, (event: unknown) => void>();
  const localStorage = {
    getItem(name: string) {
      if (env.storageThrows) throw new Error('SecurityError');
      return name === 'theme' ? (env.stored ?? null) : null;
    },
  };
  const window: Record<string, unknown> = {
    localStorage,
    matchMedia: (query: string) => ({
      matches: query.includes('light') ? Boolean(env.prefersLight) : !env.prefersLight,
    }),
  };
  const document = {
    documentElement: {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      getAttribute: (name: string) => attributes.get(name) ?? null,
    },
    addEventListener: (type: string, listener: (event: unknown) => void) =>
      listeners.set(type, listener),
  };
  new Function('window', 'document', 'localStorage', 'matchMedia', script)(
    window,
    document,
    localStorage,
    window.matchMedia,
  );
  return { theme: attributes.get('data-theme'), listeners };
}

describe.skipIf(!built)('build output', () => {
  it.each([
    'blog/pro-developer-2023-days/index.html',
    'blog/index.html',
    'blog/tags/index.html',
    'blog/tags/회고/index.html',
    '404.html',
  ])('has %s', (file) => {
    expect(existsSync(resolve(dist, file))).toBe(true);
  });

  it('puts the theme script in the head of every page', () => {
    expect(pages.length).toBeGreaterThan(0);
    expect(pages.filter(({ html }) => !themeScript(html)).map(({ path }) => path)).toEqual([]);
    expect(new Set(pages.map(({ html }) => themeScript(html))).size).toBe(1);
  });

  describe('theme script', () => {
    const script = themeScript(pages[0]?.html ?? '') ?? '';
    const cases = [null, 'dark', 'light', 'sepia'].flatMap((stored) =>
      [true, false].flatMap((prefersLight) =>
        [false, true].map((storageThrows) => ({ stored, prefersLight, storageThrows })),
      ),
    );

    // 인라인 스크립트와 테마 스토어의 순수 로직이 같은 규칙(저장값 → 시스템 설정 → 어두운 테마)인지 맞대어 본다.
    it.each(cases)('agrees with resolveInitialTheme for %o', (env) => {
      const expected = resolveInitialTheme({
        stored: env.storageThrows ? null : env.stored,
        prefersLight: env.prefersLight,
      });
      expect(runThemeScript(script, env).theme).toBe(expected);
    });

    // <ClientRouter />는 화면을 옮길 때 <html> 속성을 새 문서 것으로 바꾸므로, 바꾸기 직전에 지금 테마를 옮겨 붙인다.
    it('carries the current theme onto the next page before a client-side swap', () => {
      const { listeners } = runThemeScript(script, { stored: 'light' });
      const next = new Map<string, string>();
      listeners.get('astro:before-swap')?.({
        newDocument: {
          documentElement: { setAttribute: (n: string, v: string) => next.set(n, v) },
        },
      });
      expect(next.get('data-theme')).toBe('light');
    });
  });

  describe('page ↔ shell contract', () => {
    it('gives every page an editor root whose data-file-url is its own URL', () => {
      const mismatched = pages
        .map(({ path, html }) => ({ expected: urlOf(path), actual: fileUrl(html) }))
        .filter(({ expected, actual }) => actual !== expected);
      expect(mismatched).toEqual([]);
    });

    it('keeps the post URLs: every post source has /blog/<slug>/', () => {
      const slugs = readdirSync(resolve(import.meta.dirname, '../content/blog'))
        .filter((name) => name.endsWith('.mdx'))
        .map((name) => name.slice(0, -'.mdx'.length));
      expect(slugs.length).toBeGreaterThan(0);
      const missing = slugs.filter(
        (slug) => !existsSync(resolve(dist, 'blog', slug, 'index.html')),
      );
      expect(missing).toEqual([]);
    });
  });

  describe('search index', () => {
    const path = resolve(dist, 'search-index.json');
    const raw = existsSync(path) ? readFileSync(path) : Buffer.alloc(0);
    const index = existsSync(path) ? (JSON.parse(raw.toString('utf8')) as SearchIndex) : null;

    it('is version 1 and has every published post, newest first', () => {
      expect(index?.v).toBe(1);
      expect(index?.posts.map(({ url }) => url)).toEqual(publishedPostUrls());
    });

    it.each(index?.posts ?? [])('numbers the last block of $url like its page', (post) => {
      const html = readFileSync(resolve(dist, `.${post.url}index.html`), 'utf8');
      const lines = numberedBlocks(html);
      expect(post.blocks.map(({ line }) => line)).toEqual(lines.map((_, i) => i + 1));
      expect(post.blocks.at(-1)?.line).toBe(lines.length);
      // 장·절 제목 블록이 글 화면에서 그 id를 가진 블록과 같은 줄에 있다.
      const headingLines = post.blocks
        .filter(({ chapter, section }) => chapter || section)
        .map(({ line, chapter, section }) => ({ id: section?.id ?? chapter?.id, line }))
        .filter(({ id }, i, all) => all.findIndex((other) => other.id === id) === i);
      expect(headingLines).toEqual(
        headingLines.map(({ id }) => ({ id, line: lines.indexOf(id ?? '') + 1 })),
      );
    });

    // 재검토 조건: 결정 티켓 `.scratch/blog-details/issues/01-search-options.md`, 연구 `docs/research/blog-search.md`.
    it('stays under 100KB gzipped', () => {
      expect(raw.length).toBeGreaterThan(0);
      const size = gzipSync(raw, { level: 9 }).length;
      // 넘으면 실패 내용에 재검토 안내가 그대로 보이도록 판정을 문장으로 비교한다.
      const verdict =
        size < 100 * 1024
          ? 'under 100KB'
          : `search-index.json is ${(size / 1024).toFixed(1)}KB gzipped (limit 100KB). ` +
            'Re-measure Pagefind against the JSON index with the real posts, as "다시 볼 때" in ' +
            'ticket 01 (.scratch/blog-details/issues/01-search-options.md) and "다시 검토할 조건" ' +
            'in docs/research/blog-search.md require.';
      expect(verdict).toBe('under 100KB');
    });
  });

  // 검색 화면은 처음 열 때 불러오는 청크다. 첫 화면 HTML(미리 불러오기 포함)과 다른 청크의 정적 import에 없어야 한다.
  describe('search view chunk', () => {
    const scripts = files('.js').map((path) => ({ path, js: readFileSync(path, 'utf8') }));
    const chunk = scripts.find(({ path }) => /[\\/]SearchView\.[\w-]+\.js$/.test(path));
    const name = chunk?.path.split(/[\\/]/).at(-1) ?? 'SearchView.js';

    it('is split into its own chunk', () => {
      expect(chunk).toBeDefined();
    });

    it('is not loaded or preloaded by any page', () => {
      expect(
        pages.filter(({ html }) => html.includes(name)).map(({ path }) => urlOf(path)),
      ).toEqual([]);
    });

    it('is only imported dynamically', () => {
      const staticImport = new RegExp(
        String.raw`(?:from\s*|import\s*)["'\x60][^"'\x60]*${name.replace('.', '\\.')}`,
      );
      expect(scripts.filter(({ js }) => staticImport.test(js)).map(({ path }) => path)).toEqual([]);
    });
  });

  describe('doc end lines', () => {
    const posts = pages
      .map(({ html }) => ({
        html,
        kind: /<main[^>]*\bdata-file-kind="([^"]*)"/.exec(html)?.[1],
        url: fileUrl(html) ?? '',
        title: /<main[^>]*\bdata-file-title="([^"]*)"/.exec(html)?.[1] ?? '',
        path: /<main[^>]*\bdata-file-path="([^"]*)"/.exec(html)?.[1] ?? '',
        published: /property="article:published_time" content="([^"]*)"/.exec(html)?.[1] ?? '',
      }))
      .filter(({ kind }) => kind === 'post');

    // 글 페이지들로 탐색기 트리를 다시 짓는다: `posts/<연도>/…`의 연도 폴더, 폴더 안은 새 글 먼저.
    const tree: TreeYear[] = [...new Set(posts.map(({ path }) => path.split('/')[1]))]
      .toSorted((a, b) => b.localeCompare(a))
      .map((year) => ({
        year,
        files: posts
          .filter(({ path }) => path.split('/')[1] === year)
          .toSorted((a, b) => b.published.localeCompare(a.published))
          .map(({ url, title, path }) => ({ url, title, path })),
      }));

    it.each(posts.map(({ url, html }) => ({ url, html })))(
      'ends $url with the next file line (only when the folder has a newer post), posts.log, 맨 위로',
      ({ url, html }) => {
        const next = nextFile(tree, url);
        const nextLine = next
          ? [
              {
                href: next.url,
                label: `${next.path.split('/').at(-1)} →`,
                name: `다음 파일: ${next.title}`,
                mark: true,
              },
            ]
          : [];
        expect(docEndLines(html)).toEqual([
          ...nextLine,
          { href: '/', label: 'posts.log', name: undefined, mark: false },
          { href: '#editor', label: '맨 위로', name: undefined, mark: false },
        ]);
      },
    );
  });

  it('names the <html> view transition root on every page, for the theme spread', () => {
    // Astro는 `<html>`에 범위 속성을 붙이고, 그 범위의 이름을 `<head>`의 `<style>`에 적는다.
    const unnamed = pages.filter(({ html }) => {
      const scope = /<html\b[^>]*\bdata-astro-transition-scope="([^"]+)"/.exec(html)?.[1];
      return (
        !scope ||
        !html.includes(`[data-astro-transition-scope="${scope}"] { view-transition-name: root; }`)
      );
    });
    expect(unnamed.map(({ path }) => path)).toEqual([]);
  });

  it('lists every page except 404 in the sitemap, with the same URLs', () => {
    expect(existsSync(resolve(dist, 'sitemap-index.xml'))).toBe(true);
    const sitemap = readFileSync(resolve(dist, 'sitemap-0.xml'), 'utf8');
    const listed = new Set(
      [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) =>
        decodeURI(new URL(loc).pathname),
      ),
    );
    const expected = pages.map(({ path }) => urlOf(path)).filter((url) => url !== '/404');
    expect([...listed].toSorted()).toEqual(expected.toSorted());
  });

  it('has no dark class or Google Fonts in any page', () => {
    // `dark:hidden` 같은 변형 유틸리티는 허용하고, 단독 `dark` 클래스만 막는다.
    const darkClass = /class="(?:[^"]*\s)?dark(?:\s[^"]*)?"/;
    const offending = pages.filter(
      ({ html }) => darkClass.test(html) || html.includes('fonts.googleapis.com'),
    );
    expect(offending.map(({ path }) => path)).toEqual([]);
  });

  it('has no .dark selector or old token names in any stylesheet', () => {
    const old =
      /\.dark(?![\w\\-])|--color-primary\b|--color-bg\b|--radius-card\b|--font-logo\b|--muted-foreground\b/;
    expect(styles.length).toBeGreaterThan(0);
    expect(styles.filter(({ css }) => old.test(css)).map(({ path }) => path)).toEqual([]);
  });

  describe('fonts', () => {
    const fontFaces = styles.flatMap(({ css }) =>
      [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => ({
        family: /font-family:\s*["']?([^;"']+)/.exec(body)?.[1] ?? '',
        urls: [...body.matchAll(/url\(\s*["']?([^"')]+)/g)].map(([, url]) => url),
      })),
    );

    it('loads nothing from external font hosts', () => {
      const external = /fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net/;
      const offending = [
        ...pages.map(({ path, html }) => ({ path, text: html })),
        ...styles.map(({ path, css }) => ({ path, text: css })),
      ]
        .filter(({ text }) => external.test(text))
        .map(({ path }) => path);
      expect(offending).toEqual([]);
    });

    it.each([
      'Bricolage Grotesque Variable',
      'Pretendard Variable',
      'MaruBuri',
      'JetBrains Mono Variable',
    ])('ships @font-face for %s', (family) => {
      expect(fontFaces.some((face) => face.family === family)).toBe(true);
    });

    it('serves every @font-face file from the site itself', () => {
      const urls = fontFaces.flatMap((face) => face.urls);
      expect(urls.length).toBeGreaterThan(0);
      // 같은 출처 경로: 루트 기준 `/…`이며 `//host`나 `https:`가 아니고, dist에 실제 파일이 있다.
      // Vite가 작은 파일을 CSS에 인라인한 `data:`는 요청이 없으므로 허용한다.
      const missing = urls
        .filter((url) => !url.startsWith('data:'))
        .filter(
          (url) =>
            !url.startsWith('/') || url.startsWith('//') || !existsSync(resolve(dist, `.${url}`)),
        );
      expect(missing).toEqual([]);
    });
  });
});
