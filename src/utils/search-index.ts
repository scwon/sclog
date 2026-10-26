/**
 * 검색 색인 만들기(블로그 쪽 순수 로직). 글 한 편을 글 화면과 같은 블록으로 나누고, 블록마다 줄 번호와
 * 장·절, 순수 텍스트를 붙인다. 파일·Astro·DOM은 모른다(엔드포인트가 글 데이터를 넘긴다).
 *
 * 본문은 MDX 원문을 줄 단위로 읽어 최상위 블록(문단·제목·코드·인용·목록·표·가로줄·JSX 요소)으로 나눈다.
 * 글 화면에서 `.doc-prose`의 자식 하나가 되는 단위다. 맞는지는 빌드 결과물 테스트가 실제 HTML과 맞대어 본다.
 */
import type { MarkdownHeading } from 'astro';
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

type BlockKind = 'paragraph' | 'heading' | 'code' | 'jsx' | 'quote' | 'list' | 'table' | 'rule';

interface RawBlock {
  kind: BlockKind;
  lines: string[];
}

const BLANK = /^\s*$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const ATX = /^ {0,3}#{1,6}(?:\s|$)/;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const SETEXT = /^ {0,3}(?:=+|-+)[ \t]*$/;
const QUOTE = /^ {0,3}>/;
const BULLET = /^ {0,3}([-*+])(?:\s|$)/;
const ORDERED = /^ {0,3}\d{1,9}([.)])(?:\s|$)/;
const JSX_OPEN = /^ {0,3}<([A-Za-z][\w.:-]*)/;
const ESM = /^(?:import|export)\s/;
const TABLE_DELIMITER = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/;
const INDENTED = /^(?: {2,}|\t)/;

/** 목록 항목 표시의 종류(글머리 문자 또는 번호 뒤 구분자). 다르면 새 목록이다. */
function listMarker(line: string): string | null {
  const bullet = BULLET.exec(line);
  if (bullet) return bullet[1];
  const ordered = ORDERED.exec(line);
  return ordered ? `1${ordered[1]}` : null;
}

/** 문단을 끊고 새 블록을 시작하는 줄. JSX로 시작하는 줄은 문단 안의 인라인 JSX라 끊지 않는다. */
function interruptsParagraph(line: string): boolean {
  return (
    FENCE.test(line) ||
    ATX.test(line) ||
    RULE.test(line) ||
    QUOTE.test(line) ||
    BULLET.test(line) ||
    /^ {0,3}1[.)]\s/.test(line)
  );
}

/** `{`·`}`의 짝을 맞추며 줄들을 읽어 표현식이 닫히는 줄의 다음 위치를 돌려준다. */
function skipExpression(lines: string[], start: number): number {
  let depth = 0;
  let index = start;
  do {
    for (const char of lines[index]) {
      if (char === '{') depth += 1;
      else if (char === '}') depth -= 1;
    }
    index += 1;
  } while (depth > 0 && index < lines.length);
  return index;
}

/** 같은 이름의 여는·닫는 태그 수를 세어 JSX 요소가 닫히는 줄의 다음 위치를 돌려준다. */
function readJsx(lines: string[], start: number, name: string): number {
  const escaped = name.replaceAll('.', '\\.');
  const open = new RegExp(`<${escaped}(?=[\\s/>])[^>]*?(/?)>`, 'g');
  const close = new RegExp(`</${escaped}\\s*>`, 'g');
  let depth = 0;
  let index = start;
  do {
    const line = lines[index];
    for (const match of line.matchAll(open)) if (match[1] !== '/') depth += 1;
    depth -= [...line.matchAll(close)].length;
    index += 1;
  } while (depth > 0 && index < lines.length);
  return index;
}

/** MDX 본문을 글 화면의 최상위 블록으로 나눈다. import·export와 줄 전체가 표현식(주석)인 것은 그려지지 않으므로 뺀다. */
function splitBlocks(body: string): RawBlock[] {
  const lines = body.replaceAll('\r\n', '\n').split('\n');
  const blocks: RawBlock[] = [];
  let index = 0;
  const take = (kind: BlockKind, end: number) => {
    blocks.push({ kind, lines: lines.slice(index, end) });
    index = end;
  };

  while (index < lines.length) {
    const line = lines[index];
    if (BLANK.test(line)) {
      index += 1;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const closing = new RegExp(`^ {0,3}${fence[1][0]}{${fence[1].length},}\\s*$`);
      let end = index + 1;
      while (end < lines.length && !closing.test(lines[end])) end += 1;
      take('code', Math.min(end + 1, lines.length));
      continue;
    }

    if (ESM.test(line)) {
      while (index < lines.length && !BLANK.test(lines[index])) index += 1;
      continue;
    }

    if (/^ {0,3}\{/.test(line)) {
      const end = skipExpression(lines, index);
      if (BLANK.test(lines[end - 1].slice(lines[end - 1].lastIndexOf('}') + 1))) {
        index = end;
        continue;
      }
    }

    if (ATX.test(line)) {
      take('heading', index + 1);
      continue;
    }

    if (RULE.test(line)) {
      take('rule', index + 1);
      continue;
    }

    const jsx = JSX_OPEN.exec(line);
    if (jsx) {
      take('jsx', readJsx(lines, index, jsx[1]));
      continue;
    }

    if (QUOTE.test(line)) {
      let end = index + 1;
      while (end < lines.length && !BLANK.test(lines[end]) && !FENCE.test(lines[end])) end += 1;
      take('quote', end);
      continue;
    }

    const marker = listMarker(line);
    if (marker) {
      let end = index + 1;
      while (end < lines.length) {
        const next = lines[end];
        if (BLANK.test(next)) {
          // 빈 줄 뒤에 들여 쓴 줄이나 같은 종류의 항목이 오면 같은 목록(느슨한 목록)이다.
          let after = end;
          while (after < lines.length && BLANK.test(lines[after])) after += 1;
          const following = lines[after];
          if (
            following !== undefined &&
            (INDENTED.test(following) || listMarker(following) === marker)
          ) {
            end = after;
            continue;
          }
          break;
        }
        const nextMarker = listMarker(next);
        if (nextMarker && nextMarker !== marker && !INDENTED.test(next)) break;
        if (!nextMarker && !INDENTED.test(next) && interruptsParagraph(next)) break;
        end += 1;
      }
      take('list', end);
      continue;
    }

    if (line.includes('|') && TABLE_DELIMITER.test(lines[index + 1] ?? '')) {
      let end = index + 2;
      while (end < lines.length && !BLANK.test(lines[end])) end += 1;
      take('table', end);
      continue;
    }

    let end = index + 1;
    let kind: BlockKind = 'paragraph';
    while (end < lines.length && !BLANK.test(lines[end])) {
      if (SETEXT.test(lines[end])) {
        kind = 'heading';
        end += 1;
        break;
      }
      if (interruptsParagraph(lines[end])) break;
      end += 1;
    }
    take(kind, end);
  }

  return blocks;
}

// ── 순수 텍스트 ─────────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(text: string): string {
  return text.replaceAll(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    if (name[0] === '#') {
      const code =
        name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
    }
    return ENTITIES[name.toLowerCase()] ?? entity;
  });
}

/** 바꾸기를 더 할 것이 없을 때까지 되풀이한다(겹친 강조·표현식). */
function untilStable(text: string, step: (value: string) => string): string {
  let previous = text;
  let next = step(text);
  while (next !== previous) {
    previous = next;
    next = step(next);
  }
  return next;
}

/** 인라인 MDX(강조·링크·그림·코드·JSX·표현식·이스케이프·엔티티)를 걷어 내고 보이는 글자만 남긴다. */
function stripInline(source: string): string {
  // 이스케이프한 문자와 인라인 코드는 표시 문법으로 보지 않도록 자리표시자로 감춰 두었다가 되돌린다.
  const kept: string[] = [];
  const keep = (value: string) => `\u{F0000}${kept.push(value) - 1}\u{F0001}`;
  let text = source
    .replaceAll(/\\([!-/:-@[-`{-~])/g, (_, char: string) => keep(char))
    .replaceAll(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_, _ticks, code: string) => keep(code.trim()));

  text = text
    .replaceAll(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replaceAll(/!\[[^\]]*\]\[[^\]]*\]/g, '')
    .replaceAll(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replaceAll(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
    .replaceAll(/<((?:https?|mailto):[^>\s]+)>/g, (_, url: string) => keep(url))
    .replaceAll(/<br\s*\/?>/gi, ' ')
    .replaceAll(/<\/?[A-Za-z][\w.:-]*(?:\s(?:[^>{}]|\{[^}]*\})*)?\/?>/g, '');
  text = untilStable(text, (value) => value.replaceAll(/\{[^{}]*\}/g, ''));
  text = untilStable(text, (value) =>
    value
      .replaceAll(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '$2')
      .replaceAll(/~~(?=\S)([\s\S]*?\S)~~/g, '$1')
      .replaceAll(/\*(?=\S)([\s\S]*?\S)\*/g, '$1')
      .replaceAll(/(^|[^\p{L}\p{N}_])_(?=\S)([\s\S]*?\S)_(?![\p{L}\p{N}_])/gu, '$1$2'),
  );

  text = text.replaceAll(/\u{F0000}(\d+)\u{F0001}/gu, (_, index: string) => kept[Number(index)]);
  return decodeEntities(text);
}

const collapse = (text: string) => text.replaceAll(/\s+/g, ' ').trim();

/** 블록 하나의 순수 텍스트. 코드 블록은 안의 글자를 그대로 둔다. */
function blockText({ kind, lines }: RawBlock): string {
  switch (kind) {
    case 'rule':
      return '';
    case 'code':
      return collapse(lines.slice(1, FENCE.test(lines.at(-1) ?? '') ? -1 : undefined).join('\n'));
    case 'heading':
      return collapse(
        stripInline(
          ATX.test(lines[0])
            ? lines[0].replace(/^ {0,3}#{1,6}/, '').replace(/\s#+\s*$/, '')
            : lines.slice(0, -1).join('\n'),
        ),
      );
    case 'quote':
      return collapse(stripInline(lines.map((line) => line.replace(/^ {0,3}> ?/, '')).join('\n')));
    case 'list':
      return collapse(
        stripInline(
          lines
            .map((line) => line.replace(/^\s*(?:[-*+]|\d{1,9}[.)])\s+(?:\[[ xX]\]\s+)?/, ''))
            .join('\n'),
        ),
      );
    case 'table':
      return collapse(
        stripInline(
          lines
            .filter((_, index) => index !== 1)
            .map((line) => line.replaceAll(/(?<!\\)\|/g, ' '))
            .join('\n'),
        ),
      );
    default:
      return collapse(stripInline(lines.join('\n')));
  }
}

// ── 색인 ───────────────────────────────────────────────────────────────────

/**
 * 글 한 편의 색인. 줄 번호는 글 화면의 줄 번호 칸과 같고(frontmatter 줄 → 제목 → 작성 정보 → 본문 블록),
 * 장·절은 탐색기 개요(`buildOutline`)와 같은 id·번호·제목이다. 제목 블록은 문서 순서대로 `headings`와 짝짓는다.
 */
export function searchPost(source: SearchPostSource): SearchPost {
  const outline = buildOutline(source.headings);
  const head = [...frontmatterLines(source), source.title, source.byline].map(
    (text): Omit<SearchBlock, 'line'> => ({ chapter: null, section: null, text }),
  );

  const passed: string[] = [];
  let heading = 0;
  const body = splitBlocks(source.body).map((block): Omit<SearchBlock, 'line'> => {
    if (block.kind === 'heading') {
      const slug = source.headings[heading]?.slug;
      heading += 1;
      if (slug) passed.push(slug);
    }
    return { ...locateInOutline(outline, passed), text: blockText(block) };
  });

  return {
    url: source.url,
    title: source.title,
    path: source.path,
    blocks: [...head, ...body].map((block, index) => ({ line: index + 1, ...block })),
  };
}
