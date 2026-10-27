import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { built, files, pages, urlOf } from './dist';

describe.skipIf(!built)('build output', () => {
  // 토스트는 처음 띄울 때 불러오는 청크다. 첫 화면 HTML(미리 불러오기 포함)과 다른 청크의 정적 import에 없어야 한다.
  describe('toast chunk', () => {
    const scripts = files('.js').map((path) => ({ path, js: readFileSync(path, 'utf8') }));
    const chunk = scripts.find(({ path }) => /[\\/]Toast\.[\w-]+\.js$/.test(path));
    const name = chunk?.path.split(/[\\/]/).at(-1) ?? 'Toast.js';

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
});
