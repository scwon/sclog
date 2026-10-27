/**
 * 글 본문을 다루는 QA 도우미. 접근성 상태(`a11y/*.mjs`)가 함께 쓴다.
 */

/**
 * 본문 문단 앞 열두 자를 골라 선택 툴바를 띄운다. 첫 글자 마디가 열두 자 넘는 문단을 화면 가운데로 옮겨 고르고,
 * 문단을 누르고 고른 뒤 놓은 것처럼 알린다(선택 툴바는 마우스를 놓을 때 그린다). 고를 문단이 없으면 거짓.
 *
 * @param page ego-browser 페이지
 */
export const selectLead = (page) =>
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
