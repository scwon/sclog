import { describe, expect, it } from 'vitest';
import { attribute, built, decodeEntities, escapeRegExp, outlineOf, pages } from './dist';

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

describe.skipIf(!built)('build output', () => {
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
});
