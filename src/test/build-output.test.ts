import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type { SearchIndex } from '@/design-system';
import type { TreeYear } from '@/design-system/components/Shell/Shell';
import { nextFile } from '@/design-system/components/Shell/tree.logic';
import { resolveInitialTheme } from '@/design-system/stores/theme.logic';
import { isExternalLink } from '@/utils/external-link';

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

interface OutlineEntry {
  id: string;
  text: string;
  children: { id: string; text: string }[];
}

/** 페이지 ↔ 창 틀 계약의 개요 JSON. */
function outlineOf(html: string): OutlineEntry[] {
  const json = /<script[^>]*\bid="editor-outline"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1];
  return json ? (JSON.parse(json) as OutlineEntry[]) : [];
}

/** HTML이 이스케이프한 글자를 되돌린다(속성 값과 글자에 나오는 것만). */
function decodeEntities(value: string): string {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 태그 하나의 속성 값. */
function attribute(tag: string, name: string): string | undefined {
  const value = new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
  return value === undefined ? undefined : decodeEntities(value);
}

/** id로 찾은 제목(h2~h6)의 여는 태그와 안쪽 HTML. 제목은 서로 겹치지 않는다. */
function headingById(html: string, id: string): { open: string; inner: string } | undefined {
  const pattern = new RegExp(
    `(<h([2-6])\\b[^>]*\\sid="${escapeRegExp(id)}"[^>]*>)([\\s\\S]*?)</h\\2>`,
  );
  const match = pattern.exec(html);
  return match ? { open: match[1], inner: match[3] } : undefined;
}

/** 안쪽 HTML에서 id가 가리키는 요소(제목의 마지막 자식)의 글자. */
function elementText(inner: string, id: string): string | undefined {
  const start = new RegExp(`<(\\w+)\\b[^>]*\\sid="${escapeRegExp(id)}"[^>]*>`).exec(inner);
  if (!start) return undefined;
  const tag = start[1];
  const rest = inner.slice(start.index + start[0].length);
  const body = rest.slice(0, rest.lastIndexOf(`</${tag}>`));
  return decodeEntities(body.replace(/<[^>]*>/g, ''));
}

/** 글 본문(`.doc-prose`)의 HTML. 본문 바로 뒤에 글 꼬리(`.doc-foot`)가 온다. 글이 아니면 빈 문자열. */
function postBody(html: string): string {
  return /<div class="doc-prose[^"]*"[^>]*>([\s\S]*?)<footer class="doc-foot/.exec(html)?.[1] ?? '';
}

/** HTML 안의 `<a>`마다 `href`, 여는 태그의 속성 글자, 안쪽 HTML. */
function anchors(html: string) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attributes, inner]) => ({
    href: /\bhref="([^"]*)"/.exec(attributes)?.[1] ?? '',
    attributes,
    inner,
  }));
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

  describe('chapter links', () => {
    const posts = pages.filter(({ html }) => /<main[^>]*\bdata-file-kind="post"/.test(html));

    /** 글마다 개요의 장·절(글 순서). */
    const outlined = posts.map(({ path, html }) => ({
      path,
      html,
      entries: outlineOf(html).flatMap((chapter) => [chapter, ...chapter.children]),
    }));

    it('puts a hidden copy button in the outline headings and nowhere else', () => {
      expect(posts.length).toBeGreaterThan(0);
      expect(
        outlined.filter(({ entries }) => entries.length === 0).map(({ path }) => path),
      ).toEqual([]);
      const found = outlined.map(({ path, html }) => {
        const buttons = [...html.matchAll(/<button\b[^>]*\bdata-chapter-link="([^"]*)"[^>]*>/g)];
        return {
          path,
          targets: buttons.map(([, id]) => decodeEntities(id)),
          shown: buttons.filter(([tag]) => !/\shidden(?=[\s>=])/.test(tag)).length,
        };
      });
      expect(found).toEqual(
        outlined.map(({ path, entries }) => ({
          path,
          targets: entries.map(({ id }) => id),
          shown: 0,
        })),
      );
    });

    it('names each outline heading by its title text alone and the button by the title', () => {
      const found = outlined.flatMap(({ path, html, entries }) =>
        entries.map(({ id }) => {
          const heading = headingById(html, id);
          const labelledBy = attribute(heading?.open ?? '', 'aria-labelledby');
          const button = /<button\b[^>]*>/.exec(heading?.inner ?? '')?.[0] ?? '';
          return {
            path,
            id,
            name: labelledBy ? elementText(heading?.inner ?? '', labelledBy) : undefined,
            button: attribute(button, 'aria-label'),
          };
        }),
      );
      expect(found).toEqual(
        outlined.flatMap(({ path, entries }) =>
          entries.map(({ id, text }) => ({
            path,
            id,
            name: text,
            button: `'${text}' 장 주소 복사`,
          })),
        ),
      );
    });
  });

  // 명령 팔레트는 처음 쓸 때 불러오는 청크다. 첫 화면 HTML이 미리 불러오거나 다른 청크가 정적으로 가져오면 안 된다.
  describe('command palette chunk', () => {
    const scripts = files('.js').map((path) => ({
      name: path.slice(path.lastIndexOf(sep) + 1),
      js: readFileSync(path, 'utf8'),
    }));
    const palette = scripts.find(({ name }) => /^Palette\.[\w-]+\.js$/.test(name))?.name;

    it('is split into its own chunk loaded by a dynamic import', () => {
      expect(palette).toBeDefined();
      const loaders = scripts.filter(({ js }) => js.includes(`import(\`./${palette}\`)`));
      expect(loaders.map(({ name }) => name)).not.toEqual([]);
    });

    it('is not preloaded or referenced by any page', () => {
      expect(
        pages.filter(({ html }) => html.includes(palette ?? '?')).map(({ path }) => path),
      ).toEqual([]);
    });

    it('is not imported statically by another chunk', () => {
      const staticImport = new RegExp(
        `(from|import)\\s*["'\`]\\./${palette?.replace(/\./g, '\\.')}`,
      );
      expect(scripts.filter(({ js }) => staticImport.test(js)).map(({ name }) => name)).toEqual([]);
    });
  });

  describe('external link mark', () => {
    const SPOKEN = '(외부 링크)';
    // 사이트 주소(astro.config의 `site`)는 사이트맵 주소에서 읽는다.
    const sitemap = built ? readFileSync(resolve(dist, 'sitemap-0.xml'), 'utf8') : '';
    const SITE = new URL(/<loc>([^<]+)<\/loc>/.exec(sitemap)?.[1] ?? 'https://invalid.example')
      .origin;

    // 지금 발행된 글 본문에는 링크가 없어 아래 두 검사는 링크가 생기면 그때부터 실제로 걸린다.
    // 표시를 넣는 규칙 자체는 src/utils/external-link.test.ts가 시험용 글 조각으로 본다.
    const posts = pages.filter(({ html }) => postBody(html) !== '');
    const bodyLinks = posts.flatMap(({ path, html }) =>
      anchors(postBody(html)).map((link) => ({ path, ...link })),
    );

    it('finds the post bodies', () => {
      expect(posts.length).toBeGreaterThan(0);
    });

    it('gives every external body link the ↗ icon and the hidden "(외부 링크)", without target', () => {
      const external = bodyLinks.filter(({ href }) => isExternalLink(href, SITE));
      const unmarked = external.filter(
        ({ inner, attributes }) =>
          !/<svg\b[^>]*aria-hidden="true"/.test(inner) ||
          !inner.includes(`<span class="sr-only"> ${SPOKEN}</span>`) ||
          /\btarget=/.test(attributes),
      );
      expect(unmarked).toEqual([]);
    });

    it('leaves same-site body links unmarked', () => {
      const marked = bodyLinks
        .filter(({ href }) => !isExternalLink(href, SITE))
        .filter(({ inner }) => inner.includes(SPOKEN) || inner.includes('<svg'));
      expect(marked).toEqual([]);
    });

    it('marks nothing outside the post body, such as the shell links', () => {
      const outside = pages.filter(({ html }) => html.replace(postBody(html), '').includes(SPOKEN));
      expect(outside.map(({ path }) => path)).toEqual([]);
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

  // 찾기 줄은 ⌘F로 처음 열 때 불러오는 청크다. 첫 화면 HTML(미리 불러오기 포함)과 다른 청크의 정적 import에 없어야 한다.
  describe('find widget chunk', () => {
    const scripts = files('.js').map((path) => ({ path, js: readFileSync(path, 'utf8') }));
    const chunk = scripts.find(({ path }) => /[\\/]FindWidget\.[\w-]+\.js$/.test(path));
    const name = chunk?.path.split(/[\\/]/).at(-1) ?? 'FindWidget.js';

    it('is split into its own chunk loaded by a dynamic import', () => {
      expect(chunk).toBeDefined();
      const loaders = scripts.filter(({ js }) => js.includes(`import(\`./${name}\`)`));
      expect(loaders.map(({ path }) => path)).not.toEqual([]);
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

  // 선택 툴바는 본문에서 처음 글자를 고를 때 불러오는 청크다. 첫 화면 HTML(미리 불러오기 포함)과 다른 청크의 정적
  // import에 없어야 한다.
  describe('selection toolbar chunk', () => {
    const scripts = files('.js').map((path) => ({ path, js: readFileSync(path, 'utf8') }));
    const chunk = scripts.find(({ path }) => /[\\/]SelectionToolbar\.[\w-]+\.js$/.test(path));
    const name = chunk?.path.split(/[\\/]/).at(-1) ?? 'SelectionToolbar.js';

    it('is split into its own chunk loaded by a dynamic import', () => {
      expect(chunk).toBeDefined();
      const loaders = scripts.filter(({ js }) => js.includes(`import(\`./${name}\`)`));
      expect(loaders.map(({ path }) => path)).not.toEqual([]);
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
