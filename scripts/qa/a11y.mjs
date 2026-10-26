/**
 * 모든 페이지 × 두 테마 × 세 폭(1440·1024·390)에서 axe-core 검사를 돌린다. 홈은 패널이 프로필 화면이므로,
 * 패널이 숨는 폭(1100px 미만)에서는 패널을 열어 한 번 더 본다. 홈에서는 ⌘P(Ctrl+P)로 연 명령 팔레트도,
 * 폭·테마마다 결과가 있는 검색 화면도 본다.
 * 움직임 줄이기를 켜서 펼침 도중의 반투명 글자를 명암비 위반으로 잘못 잡지 않게 한다.
 * 읽기 기록을 미리 넣어 탐색기 꼬리표(`✓`·`42%`)와 프로필의 읽기 기록 칸도 함께 본다. 꼬리표 종류는 폭·테마마다
 * 번갈아 넣어 두 테마가 두 꼬리표를 모두 거친다. 읽는 중으로 넣은 글은 개요의 첫 장을 위치로 다시 넣고 열어,
 * 상태줄에 이어 읽기 버튼이 뜬 화면도 본다(폭마다 한 테마씩, 세 폭 모두).
 * `run.mjs`가 `globalThis.QA = { base, pages, axe }`를 넣고 ego-browser에서 import한다.
 */
/* global QA, taskSpace */
import { readFile } from 'node:fs/promises';

const axeSource = await readFile(QA.axe, 'utf8');
const task = await taskSpace('sclog qa a11y');
const page = task.page('p1');
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

/** 숨은 패널을 연다. 좁은 화면은 제목 표시줄의 메뉴 버튼, 그 밖에는 지금 화면의 활동 막대 버튼을 누른다. */
const openPanel = (narrow) =>
  page.evaluate((isNarrow) => {
    const button = isNarrow
      ? document.querySelector('header button[aria-controls="panel"]')
      : document.querySelector("nav[aria-label='활동 막대'] button[aria-pressed='false']");
    button?.click();
    return true;
  }, narrow);

/** 발행된 글 URL(태그 화면 제외). */
const postUrls = QA.pages.filter((path) => /^\/blog\/(?!tags\/)[^/]+\/$/.test(path));

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
    for (const path of QA.pages) {
      await page.goto(QA.base + path);
      await page.evaluate((value) => localStorage.setItem('theme', value), theme);
      await seedHistory((widthIndex + themeIndex) % 2 === 0 ? 'read' : 'reading');
      await page.reload();
      await page.evaluate(() => document.fonts.ready.then(() => true));
      await page.waitForTimeout(400);
      const violations = await axeViolations();
      runs++;
      if (violations.length)
        failures.push(`${width} ${theme} ${decodeURI(path)}: ${violations.join('; ')}`);
      if (path === '/') {
        // 열린 명령 팔레트(처음 쓸 때 불러오는 청크라 조금 기다린다).
        await page.keyboard.press('ControlOrMeta+P');
        await page.waitForSelector("loc=css:[role='dialog'][aria-label='명령 팔레트']", {
          state: 'visible',
        });
        const paletteViolations = await axeViolations();
        runs++;
        if (paletteViolations.length)
          failures.push(`${width} ${theme} 팔레트: ${paletteViolations.join('; ')}`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
      }
      if (postUrls.includes(path) && (widthIndex + themeIndex) % 2 === 1) {
        // 읽는 중인 글: 그 글의 위치를 개요의 장으로 넣고 다시 열면, 열기 요약(약 2.2초) 뒤 상태줄에 이어 읽기 버튼이 뜬다.
        const seeded = await page.evaluate((url) => {
          const [first] = JSON.parse(
            document.getElementById('editor-outline')?.textContent ?? '[]',
          );
          if (!first) return false;
          const entries = [{ url, chapter: first.id, percent: 42 }];
          localStorage.setItem('position', JSON.stringify({ v: 1, entries }));
          return true;
        }, decodeURI(path));
        if (seeded) {
          await page.reload();
          await page.waitForSelector('loc=css:footer button', { state: 'visible', timeout: 5000 });
          const resumeViolations = await axeViolations();
          runs++;
          if (resumeViolations.length)
            failures.push(`${width} ${theme} 이어 읽기: ${resumeViolations.join('; ')}`);
        }
      }
      if (path === '/' && width < 1100) {
        await openPanel(width < 760);
        await page.waitForTimeout(300);
        const profileViolations = await axeViolations();
        runs++;
        if (profileViolations.length)
          failures.push(`${width} ${theme} 프로필: ${profileViolations.join('; ')}`);
      }
    }
    // 결과가 있는 검색 화면. 마지막 패널 화면을 검색으로 저장하고 새로고침한다(검색 화면은 홈에서도 남는다).
    // 패널이 숨는 폭에서는 연다.
    await page.goto(`${QA.base}/`);
    await page.evaluate(() => sessionStorage.setItem('panel', '{"v":1,"view":"search"}'));
    await page.reload();
    await page.waitForTimeout(600);
    if (width < 760) await page.click('loc=css:header button[aria-controls="panel"]');
    else if (width < 1100)
      await page.click("loc=css:nav[aria-label='활동 막대'] button[aria-label='검색']");
    await page.fill('loc=css:#panel input[type=search]', '개발');
    await page.waitForSelector("loc=css:#panel ul[aria-label='검색 결과']", { state: 'visible' });
    const searchViolations = await axeViolations();
    runs++;
    if (searchViolations.length)
      failures.push(`${width} ${theme} 검색 화면: ${searchViolations.join('; ')}`);
    await page.evaluate(() => sessionStorage.clear());
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
