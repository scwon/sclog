import {
  browserPlatform,
  CheckIcon,
  CopyIcon,
  keyLabel,
  showToast,
  type SelectionAction,
  type SelectionToolbarOptions,
} from '@/design-system';

/**
 * 고른 글자를 평문 그대로 클립보드에 넣는다. 앞뒤에 출처·링크를 붙이지 않는다.
 * 되면 "복사했어요" 토스트를 띄운다. 클립보드가 막히면(권한 거부 등) 플랫폼의 복사 키(⌘C·Ctrl+C)를 쓰라는
 * 토스트를 띄우고 거짓을 돌려주어 버튼이 됐다는 표시로 바뀌지 않는다.
 */
export const copySelection: SelectionAction = {
  id: 'copy',
  label: '복사',
  icon: <CopyIcon />,
  mobile: false,
  when: () => true,
  async run({ text }) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('복사했어요', 'success');
      return true;
    } catch {
      const copyKey = keyLabel({ letter: 'c' }, browserPlatform());
      showToast(`클립보드에 넣지 못했어요. ${copyKey}로 복사하세요`, 'error');
      return false;
    }
  },
  done: { label: '복사됨', icon: <CheckIcon /> },
};

/** 선택 툴바 동작 목록. 버튼은 이 순서로 그린다. 새 동작(연관 내용 검색 등)은 여기에 더한다. */
export const selectionActions: readonly SelectionAction[] = [copySelection];

/**
 * 글 화면의 선택 툴바 설정. 층은 글 요소(`article.doc[data-doc]`)에 붙이고, 제 복사 버튼이 있는 코드 블록 틀
 * (`CodeBlock.astro`의 `.code-block-wrapper`, 언어 라벨 머리 포함)에서는 띄우지 않는다.
 */
export const selectionToolbarOptions: SelectionToolbarOptions = {
  actions: selectionActions,
  label: '선택 툴바',
  host: '[data-doc]',
  excludedClasses: ['code-block-wrapper'],
};
