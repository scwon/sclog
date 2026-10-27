/**
 * 모든 페이지 × 두 테마 × 세 폭(1440·1024·390)에서 axe-core 검사를 돌린다. 기능마다 더 보는 화면 상태(팔레트,
 * 찾기 줄, 선택 툴바 등)는 `a11y/*.mjs` 하나에 하나씩 두고, 이 파일은 폭·테마·페이지를 돌며 그 상태들을 부른다.
 * 움직임 줄이기를 켜서 펼침 도중의 반투명 글자를 명암비 위반으로 잘못 잡지 않게 한다.
 * 읽기 기록을 미리 넣어 탐색기 꼬리표(`✓`·`42%`)와 프로필의 읽기 기록 칸도 함께 본다. 꼬리표 종류는 폭·테마마다
 * 번갈아 넣어 두 테마가 두 꼬리표를 모두 거친다.
 *
 * 상태 파일은 둘 중 하나 또는 둘 다를 내보낸다. 이름 순으로 부른다.
 * - `onPage(ctx, path)`: 페이지마다, 그 페이지의 axe 검사 뒤(테마·읽기 기록이 들어간 채)
 * - `onPass(ctx)`: 폭·테마마다 한 번, 모든 페이지를 돈 뒤. 필요한 화면으로 스스로 옮겨 간다
 *
 * `run.mjs`가 `globalThis.QA = { base, pages, axe }`를 넣고 ego-browser에서 import한다.
 */
/* global QA, taskSpace */
import { readdir, readFile } from 'node:fs/promises';
import { waits } from './wait.mjs';

const axeSource = await readFile(QA.axe, 'utf8');
// 작업 공간 이름에 포트를 넣어 작업 트리 여럿이 함께 돌려도(`QA_PORT`) 서로의 탭을 잡지 않게 한다.
const task = await taskSpace(`sclog qa a11y ${new URL(QA.base).port}`);
const page = task.page('p1');
const { until, goto, reload } = waits(page);
const failures = [];
let runs = 0;

/** 지금 화면에 axe를 돌려 위반을 `id (대상)` 문자열로 돌려준다. */
const axeViolations = () =>
  page.evaluate(async (source) => {
    if (!window.axe) {
      const script = document.createElement('script');
      script.textContent = source;
      document.head.appendChild(script);
    }
    const result = await window.axe.run(document, { resultTypes: ['violations'] });
    return result.violations.map(
      (v) =>
        `${v.id} (${v.nodes
          .slice(0, 2)
          .map((n) => n.target.join(' '))
          .join(', ')})`,
    );
  }, axeSource);

/** 두 폴더의 발행된 글 URL(태그 화면 제외). AI 글(`/ai-written/…`)이 이름 순으로 먼저 온다. */
const postUrls = QA.pages.filter((path) => /^\/(blog|ai-written)\/(?!tags\/)[^/]+\/$/.test(path));

// AI 글 쪽 화면 네 곳(로그·글·태그 목록·태그별 글)은 dist를 도는 `pageUrls()`에 저절로 들어온다. 빌드가 그 화면을
// 빠뜨려 검사 없이 지나가지 않도록 하나라도 없으면 실패로 남긴다.
const aiWrittenPages = [
  ['ai-written.log', (path) => path === '/ai-written/'],
  ['AI 글', (path) => /^\/ai-written\/(?!tags\/)[^/]+\/$/.test(path)],
  ['AI 글 태그 목록', (path) => path === '/ai-written/tags/'],
  ['AI 글 태그별 글', (path) => /^\/ai-written\/tags\/[^/]+\/$/.test(path)],
];
for (const [label, matches] of aiWrittenPages)
  if (!QA.pages.some(matches)) failures.push(`페이지 목록에 ${label} 화면이 없음`);

/** 모든 글을 읽은 글(`read`) 또는 42% 읽는 중(`reading`)으로 기록해 둔다. */
const seedHistory = (kind) =>
  page.evaluate(
    ({ urls, mark }) => {
      const read = mark === 'read' ? urls : [];
      const entries =
        mark === 'read' ? [] : urls.map((url) => ({ url, chapter: 'qa', percent: 42 }));
      localStorage.setItem('read', JSON.stringify({ v: 1, urls: read }));
      localStorage.setItem('position', JSON.stringify({ v: 1, entries }));
      return true;
    },
    { urls: postUrls.map(decodeURI), mark: kind },
  );

const stateDir = new URL('./a11y/', import.meta.url);
const states = await Promise.all(
  (await readdir(stateDir))
    .filter((name) => name.endsWith('.mjs'))
    .toSorted()
    .map((name) => import(new URL(name, stateDir).href)),
);

await page.cdp('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
});
for (const [widthIndex, width] of [1440, 1024, 390].entries()) {
  await page.cdp('Emulation.setDeviceMetricsOverride', {
    width,
    height: width < 500 ? 844 : 900,
    deviceScaleFactor: 1,
    mobile: width < 500,
  });
  for (const [themeIndex, theme] of ['dark', 'light'].entries()) {
    /** 상태 파일이 받는 도구. `audit(label)`은 지금 화면에 axe를 돌려 위반을 `폭 테마 label`로 남긴다. */
    const ctx = {
      page,
      until,
      goto,
      reload,
      width,
      theme,
      widthIndex,
      themeIndex,
      postUrls,
      fail: (label, reason) => failures.push(`${width} ${theme} ${label}: ${reason}`),
      audit: async (label) => {
        const violations = await axeViolations();
        runs++;
        if (violations.length)
          failures.push(`${width} ${theme} ${label}: ${violations.join('; ')}`);
      },
    };
    for (const path of QA.pages) {
      await page.goto(QA.base + path);
      await page.evaluate((value) => localStorage.setItem('theme', value), theme);
      await seedHistory((widthIndex + themeIndex) % 2 === 0 ? 'read' : 'reading');
      await reload();
      await page.evaluate(() => document.fonts.ready.then(() => true));
      await ctx.audit(decodeURI(path));
      for (const state of states) await state.onPage?.(ctx, path);
    }
    for (const state of states) await state.onPass?.(ctx);
  }
}
await page.evaluate(() => {
  for (const key of ['theme', 'read', 'position']) localStorage.removeItem(key);
  return true;
});
await task.finish({ keep: [] });

console.log(`axe ${runs}회, 위반 있는 조합 ${failures.length}개`);
for (const failure of failures) console.log(`  ✗ ${failure}`);
if (failures.length) throw new Error('접근성 위반');
