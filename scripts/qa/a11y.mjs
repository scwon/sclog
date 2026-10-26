/**
 * 모든 페이지 × 두 테마 × 세 폭(1440·1024·390)에서 axe-core 검사를 돌린다. 홈은 패널이 프로필 화면이므로,
 * 패널이 숨는 폭(1100px 미만)에서는 패널을 열어 한 번 더 본다.
 * 움직임 줄이기를 켜서 펼침 도중의 반투명 글자를 명암비 위반으로 잘못 잡지 않게 한다.
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

await page.cdp('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
});
for (const width of [1440, 1024, 390]) {
  await page.cdp('Emulation.setDeviceMetricsOverride', {
    width,
    height: width < 500 ? 844 : 900,
    deviceScaleFactor: 1,
    mobile: width < 500,
  });
  for (const theme of ['dark', 'light']) {
    for (const path of QA.pages) {
      await page.goto(QA.base + path);
      await page.evaluate((value) => localStorage.setItem('theme', value), theme);
      await page.reload();
      await page.evaluate(() => document.fonts.ready.then(() => true));
      await page.waitForTimeout(400);
      const violations = await axeViolations();
      runs++;
      if (violations.length)
        failures.push(`${width} ${theme} ${decodeURI(path)}: ${violations.join('; ')}`);
      if (path === '/' && width < 1100) {
        await openPanel(width < 760);
        await page.waitForTimeout(300);
        const profileViolations = await axeViolations();
        runs++;
        if (profileViolations.length)
          failures.push(`${width} ${theme} 프로필: ${profileViolations.join('; ')}`);
      }
    }
  }
}
await page.evaluate(() => localStorage.removeItem('theme'));
await task.finish({ keep: [] });

console.log(`axe ${runs}회, 위반 있는 조합 ${failures.length}개`);
for (const failure of failures) console.log(`  ✗ ${failure}`);
if (failures.length) throw new Error('접근성 위반');
