import type { Meta, StoryObj } from '@storybook/react';
import { setFindQuery } from '../../stores/find';
import { FindWidget } from './FindWidget';

/** 에디터 대역. 보이는 `개발`은 여섯 개(제목, 본문 넷, 닫힌 `<details>`의 요약)다. */
const EDITOR = `
  <div class="ide-crumbs">posts › 2023 › 개발자란.mdx</div>
  <article class="doc-prose mx-auto max-w-[680px] px-6 py-8 font-serif text-prose">
    <h2 class="text-2xl font-bold text-text">개발자란?</h2>
    <p>프론트엔드 <strong>개발</strong>자로 일한 지 여섯 해가 되었다. 개발은 혼자 하는 일이 아니었다.</p>
    <p>입사 직후에는 <em>개발 환경</em>을 맞추는 데만 일주일이 걸렸다.<span class="sr-only">스크린 리더만 읽는 개발 메모</span></p>
    <p hidden>숨은 줄의 개발</p>
    <details>
      <summary>접힌 개발 노트</summary>
      <p>닫힌 동안에는 찾지 않는 개발 이야기</p>
    </details>
    <p>Astro로 블로그를 다시 개발했다. astro와 ASTRO도 같은 낱말로 찾는다.</p>
  </article>`;

/**
 * 찾기 줄. 실제 사이트에서는 창 틀이 ⌘F(Ctrl+F)로 띄우고 Enter·Shift+Enter·Esc를 넘겨준다. 여기서는 찾기 줄만 떠
 * 있으므로 입력과 위·아래 버튼으로 확인한다. 아래 에디터 대역(`#editor`)에서 찾고, 경로 표시줄·스크린 리더 전용 글자·
 * 숨은 줄·닫힌 `<details>` 본문은 찾지 않는다. 칠하기는 CSS Custom Highlight API라 그 API가 있는 브라우저에서만 보인다.
 */
const meta = {
  title: 'Design System/Shell/FindWidget',
  component: FindWidget,
  parameters: { layout: 'fullscreen' },
  args: { editorId: 'editor', platform: 'mac', onClose: () => {} },
  beforeEach: () => {
    setFindQuery('');
    // 찾기 줄은 그릴 때 에디터 글자를 읽으므로, 사이트의 정적 HTML처럼 그리기 전에 에디터를 문서에 둔다.
    const editor = document.createElement('main');
    editor.id = 'editor';
    editor.className = 'ide-editor';
    editor.innerHTML = EDITOR;
    document.body.append(editor);
    return () => editor.remove();
  },
} satisfies Meta<typeof FindWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 빈 입력: 위치 글자가 비고 위·아래 버튼이 꺼져 있다. 툴팁 키 표기는 맥(`⇧Enter`). */
export const Empty: Story = {};

/** `개발`: 일치 여섯 개가 형광 띠로, 첫 일치가 코랄로 칠해지고 `1/6`이 보인다. */
export const WithMatches: Story = { beforeEach: () => setFindQuery('개발') };

/** 입력 중인 음절 `개바`도 `개발`을 찾는다(검색 화면과 같은 규칙). */
export const Composing: Story = { beforeEach: () => setFindQuery('개바') };

/** 맞는 글자가 없으면 `결과 없음`. 윈도·리눅스 툴팁 키 표기(`Shift+Enter`). */
export const NoMatches: Story = {
  args: { platform: 'other' },
  beforeEach: () => setFindQuery('없는 낱말'),
};
