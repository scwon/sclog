import { readFileSync } from 'node:fs';
import { sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { built, files, pages } from './dist';

describe.skipIf(!built)('build output', () => {
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
});
