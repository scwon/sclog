import { CheckIcon, CopyIcon, type SelectionAction } from '@/design-system';

/**
 * 고른 글자를 평문 그대로 클립보드에 넣는다. 앞뒤에 출처·링크를 붙이지 않는다.
 * 클립보드가 막히면(권한 거부 등) 거짓을 돌려주어 버튼이 됐다는 표시로 바뀌지 않는다.
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
      return true;
    } catch {
      return false;
    }
  },
  done: { label: '복사됨', icon: <CheckIcon /> },
};

/** 선택 툴바 동작 목록. 버튼은 이 순서로 그린다. 새 동작(연관 내용 검색 등)은 여기에 더한다. */
export const selectionActions: readonly SelectionAction[] = [copySelection];
