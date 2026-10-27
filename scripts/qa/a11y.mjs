/**
 * 모든 페이지 × 두 테마 × 세 폭(1440·1024·390)에서 axe-core 검사를 돌린다. 홈은 패널이 프로필 화면이므로,
 * 패널이 숨는 폭(1100px 미만)에서는 패널을 열어 한 번 더 본다. 홈에서는 ⌘P(Ctrl+P)로 연 명령 팔레트(파일 모드와
 * `>` 명령 모드)도, 폭·테마마다 결과가 있는 검색 화면도 본다.
 * 움직임 줄이기를 켜서 펼침 도중의 반투명 글자를 명암비 위반으로 잘못 잡지 않게 한다.
 * 읽기 기록을 미리 넣어 탐색기 꼬리표(`✓`·`42%`)와 프로필의 읽기 기록 칸도 함께 본다. 꼬리표 종류는 폭·테마마다
 * 번갈아 넣어 두 테마가 두 꼬리표를 모두 거친다. 읽는 중으로 넣은 글은 개요의 첫 장을 위치로 다시 넣고 열어,
 * 상태줄에 이어 읽기 버튼이 뜬 화면도 본다(폭마다 한 테마씩, 세 폭 모두). 폭·테마마다 글에서 ⌘F로 연 찾기 줄(검색어 입력)과 본문을 골라 띄운 선택 툴바도 본다.
 * 이어서 선택 툴바로 복사해 띄운 토스트도 본다.
 * `run.mjs`가 `globalThis.QA = { base, pages, axe }`를 넣고 ego-browser에서 import한다.
 */
/* global QA, taskSpace */
import { readFile } from 'node:fs/promises';
import { waits } from './wait.mjs';

const axeSource = await readFile(QA.axe, 'utf8');
const task = await taskSpace('sclog qa a11y');
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

/**
 * 본문 문단 앞 열두 자를 골라 선택 툴바를 띄운다. 첫 글자 마디가 열두 자 넘는 문단을 화면 가운데로 옮겨 고르고,
 * 문단을 누르고 고른 뒤 놓은 것처럼 알린다(선택 툴바는 마우스를 놓을 때 그린다). 고를 문단이 없으면 거짓.
 */
const selectLead = () =>
  page.evaluate(() => {
    const text = [...document.querySelectorAll('#content > p')]
      .map((p) => document.createTreeWalker(p, NodeFilter.SHOW_TEXT).nextNode())
      .find((node) => (node?.textContent ?? '').trim().length > 12);
    if (!text) return false;
    const paragraph = text.parentElement.closest('p');
    paragraph.scrollIntoView({ block: 'center' });
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 12);
    getSelection()?.removeAllRanges();
    getSelection()?.addRange(range);
    paragraph.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    paragraph.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0 }));
    return true;
  });

/**
 * 선택 툴바에서 복사해 띄운 토스트를 본다. 본문 문단 앞 글자들을 골라 툴바를 띄우고 복사 버튼을 누른 뒤, 닫힘 시계를
 * 멈춘 채 axe를 돌린다. 움직임 줄이기에서 전환 없이 뜨는지도 본다.
 */
const checkToast = async (where) => {
  const picked = await selectLead();
  if (!picked) return failures.push(`${where} 토스트: 고를 문단이 없음`);
  await page.waitForSelector('loc=css:[data-selection-toolbar] button[data-action="copy"]', {
    state: 'visible',
  });
  await page.click('loc=css:[data-selection-toolbar] button[data-action="copy"]');
  // 토스트 영역이 토스트를 센 뒤(앞뒤 포커스 대역이 생긴 뒤) 창이 포커스를 잃은 것처럼 알려 닫힘 시계를 멈춘다.
  const paused = await until('토스트가 뜨면 닫힘 시계 멈춤', () => {
    const region = document.querySelector('[data-slot="toast-viewport"]')?.parentElement;
    if (!region?.querySelector(':scope > span[tabindex="0"]')) return false;
    window.dispatchEvent(new Event('blur'));
    return true;
  });
  if (!paused) return failures.push(`${where} 토스트: 뜨지 않음`);
  // 선택을 풀어 선택 툴바를 걷고 토스트만 남긴다(툴바가 뜬 상태는 따로 본다).
  await page.evaluate(() => {
    getSelection()?.removeAllRanges();
    return true;
  });
  await until('토스트만 남김', () => document.querySelector('[data-selection-toolbar]') === null);
  const motion = await page.evaluate(() => {
    const toast = document.querySelector('[data-slot="toast"]');
    return toast ? getComputedStyle(toast).animationName : 'closed';
  });
  if (motion !== 'none') failures.push(`${where} 토스트: 움직임 줄이기에서 전환(${motion})`);
  const toastViolations = await axeViolations();
  runs++;
  if (toastViolations.length) failures.push(`${where} 토스트: ${toastViolations.join('; ')}`);
};

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
      await reload();
      await page.evaluate(() => document.fonts.ready.then(() => true));
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
        // `>` 명령 모드: 명령과 단축키 목록.
        await page.keyboard.type('>');
        await page.waitForSelector("loc=css:[role='listbox'][aria-label='명령']", {
          state: 'visible',
        });
        const commandViolations = await axeViolations();
        runs++;
        if (commandViolations.length)
          failures.push(`${width} ${theme} 명령 목록: ${commandViolations.join('; ')}`);
        await page.keyboard.press('Escape');
        await until(
          '팔레트가 닫힘',
          () => document.querySelector("[role='dialog'][aria-label='명령 팔레트']") === null,
        );
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
          await reload();
          await page.waitForSelector('loc=css:footer button', { state: 'visible', timeout: 5000 });
          const resumeViolations = await axeViolations();
          runs++;
          if (resumeViolations.length)
            failures.push(`${width} ${theme} 이어 읽기: ${resumeViolations.join('; ')}`);
        }
      }
      if (path === '/' && width < 1100) {
        await openPanel(width < 760);
        await until('패널이 열림(프로필)', () => {
          const panel = document.getElementById('panel');
          return (
            panel !== null &&
            getComputedStyle(panel).display !== 'none' &&
            panel.getAttribute('aria-label') === '프로필'
          );
        });
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
    await reload();
    if (width < 760) await page.click('loc=css:header button[aria-controls="panel"]');
    else if (width < 1100)
      await page.click("loc=css:nav[aria-label='활동 막대'] button[aria-label='검색']");
    await page.waitForSelector('loc=css:#panel input[type=search]', { state: 'visible' });
    await page.fill('loc=css:#panel input[type=search]', '개발');
    await page.waitForSelector("loc=css:#panel ul[aria-label='검색 결과']", { state: 'visible' });
    const searchViolations = await axeViolations();
    runs++;
    if (searchViolations.length)
      failures.push(`${width} ${theme} 검색 화면: ${searchViolations.join('; ')}`);
    await page.evaluate(() => sessionStorage.clear());
    // 검색어를 넣은 찾기 줄(⌘F). 칠하기는 axe가 보지 않으므로 찾기 줄 자체의 이름·명암비·겹침을 본다.
    if (postUrls[0]) {
      await goto(QA.base + postUrls[0]);
      await page.evaluate(() => {
        document.getElementById('editor')?.focus();
        return true;
      });
      await page.keyboard.press('ControlOrMeta+F');
      await page.waitForSelector('loc=css:[data-find-input]', { state: 'visible' });
      await page.keyboard.type('개발');
      await until('찾기 위치 글자(n/m)', () =>
        /^\d+\/\d+$/.test(document.querySelector('search [aria-live="polite"]')?.textContent ?? ''),
      );
      const findViolations = await axeViolations();
      runs++;
      if (findViolations.length)
        failures.push(`${width} ${theme} 찾기 줄: ${findViolations.join('; ')}`);
      await page.keyboard.press('Escape');
      await until('찾기 줄이 닫힘', () => document.querySelector('[data-find-input]') === null);
      // 본문을 골라 띄운 선택 툴바(상자와 복사 버튼).
      if (!(await selectLead())) failures.push(`${width} ${theme} 선택 툴바: 고를 문단이 없음`);
      const toolbarShown = await until(
        '선택 툴바가 뜸',
        () => document.querySelector('[data-selection-toolbar] button') !== null,
      );
      if (!toolbarShown) failures.push(`${width} ${theme} 선택 툴바: 뜨지 않음`);
      const toolbarViolations = await axeViolations();
      runs++;
      if (toolbarViolations.length)
        failures.push(`${width} ${theme} 선택 툴바: ${toolbarViolations.join('; ')}`);
      await page.keyboard.press('Escape');
      await until(
        '선택 툴바가 걷힘',
        () => document.querySelector('[data-selection-toolbar]') === null,
      );
      await checkToast(`${width} ${theme}`);
    }
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
