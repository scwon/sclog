/**
 * 모든 페이지 × 두 테마 × 세 폭(1440·1024·390)에서 axe-core 검사를 돌린다.
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
      const violations = await page.evaluate(async (source) => {
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
      runs++;
      if (violations.length)
        failures.push(`${width} ${theme} ${decodeURI(path)}: ${violations.join('; ')}`);
    }
  }
}
await page.evaluate(() => localStorage.removeItem('theme'));
await task.finish({ keep: [] });

console.log(`axe ${runs}회, 위반 있는 조합 ${failures.length}개`);
for (const failure of failures) console.log(`  ✗ ${failure}`);
if (failures.length) throw new Error('접근성 위반');
