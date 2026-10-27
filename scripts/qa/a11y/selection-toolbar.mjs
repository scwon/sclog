/**
 * 본문을 골라 띄운 선택 툴바(상자와 복사 버튼).
 */
/* global QA */
import { selectLead } from '../prose.mjs';

/** 첫 글에서 문단 앞 글자를 골라 선택 툴바를 띄운다. */
export async function onPass({ page, until, goto, audit, fail, postUrls }) {
  if (!postUrls[0]) return;
  await goto(QA.base + postUrls[0]);
  if (!(await selectLead(page))) return fail('선택 툴바', '고를 문단이 없음');
  const shown = await until(
    '선택 툴바가 뜸',
    () => document.querySelector('[data-selection-toolbar] button') !== null,
  );
  if (!shown) fail('선택 툴바', '뜨지 않음');
  await audit('선택 툴바');
  await page.keyboard.press('Escape');
  await until(
    '선택 툴바가 걷힘',
    () => document.querySelector('[data-selection-toolbar]') === null,
  );
}
