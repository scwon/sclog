/**
 * 선택 툴바로 복사해 띄운 토스트. 본문 문단 앞 글자들을 골라 툴바를 띄우고 복사 버튼을 누른 뒤, 닫힘 시계를 멈춘
 * 채 axe를 돌린다. 움직임 줄이기에서 전환 없이 뜨는지도 본다.
 */
/* global QA */
import { selectLead } from '../prose.mjs';

/** 첫 글에서 복사해 토스트를 띄운다. */
export async function onPass({ page, until, goto, audit, fail, postUrls }) {
  if (!postUrls[0]) return;
  await goto(QA.base + postUrls[0]);
  if (!(await selectLead(page))) return fail('토스트', '고를 문단이 없음');
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
  if (!paused) return fail('토스트', '뜨지 않음');
  // 선택을 풀어 선택 툴바를 걷고 토스트만 남긴다(툴바가 뜬 상태는 `selection-toolbar.mjs`가 본다).
  await page.evaluate(() => {
    getSelection()?.removeAllRanges();
    return true;
  });
  await until('토스트만 남김', () => document.querySelector('[data-selection-toolbar]') === null);
  const motion = await page.evaluate(() => {
    const toast = document.querySelector('[data-slot="toast"]');
    return toast ? getComputedStyle(toast).animationName : 'closed';
  });
  if (motion !== 'none') fail('토스트', `움직임 줄이기에서 전환(${motion})`);
  await audit('토스트');
}
