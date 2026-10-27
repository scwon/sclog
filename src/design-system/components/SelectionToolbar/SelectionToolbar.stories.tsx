import type { Meta, StoryObj } from '@storybook/react';
import { CheckIcon, CopyIcon } from './icons';
import { SelectionToolbar } from './SelectionToolbar';
import { toolbarSize, type SelectionAction } from './selection.logic';

/** 복사 동작 대역. 클립보드에 쓰지 않고 됐다고만 한다. */
const copy: SelectionAction = {
  id: 'copy',
  label: '복사',
  icon: <CopyIcon />,
  mobile: false,
  when: () => true,
  run: () => true,
  done: { label: '복사됨', icon: <CheckIcon /> },
};

/**
 * 선택 툴바. 실제 사이트에서는 본문을 드래그하면 고른 줄들을 감싼 상자와, 상자 오른쪽 바깥 끝 줄 높이에 동작 버튼이
 * 뜬다. 여기서는 좌표를 손으로 넣은 대역 문단(줄 높이 28px) 위에 그린다. 버튼을 누르면 2초 동안 체크·`복사됨`이다.
 */
const meta = {
  title: 'Design System/SelectionToolbar',
  component: SelectionToolbar,
  parameters: { layout: 'fullscreen' },
  args: {
    // 대역 문단의 둘째~넷째 줄(위 여백 40px, 줄 28px), 본문 단 680px에 상자 여백 10px
    box: { top: 62, bottom: 158, left: 46, right: 746 },
    line: { top: 124, bottom: 152 },
    inset: false,
    toolbar: toolbarSize(1),
    actions: [copy],
    context: { text: '고른 대목', slug: 'developer', headingId: null },
    label: '선택 툴바',
  },
  decorators: [
    (Story) => (
      <div className="relative w-[792px] px-14 py-10 font-serif text-[17px]/7 text-prose">
        <p className="w-[680px]">
          프론트엔드 개발자로 일한 지 여섯 해가 되었다. 개발은 혼자 하는 일이 아니었다. 입사
          직후에는 개발 환경을 맞추는 데만 일주일이 걸렸고, 그동안 옆자리 동료가 하나하나 알려
          주었다. 그때 배운 것은 도구보다 질문하는 법이었다. 모르는 것을 모른다고 말하는 일이
          생각보다 어렵다는 것도 그때 알았다. 지금은 내가 옆자리에 앉은 사람에게 같은 것을 알려
          준다.
        </p>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SelectionToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 아래로 드래그: 버튼이 끝 줄(넷째 줄) 높이에 뜬다. */
export const Default: Story = {};

/** 위로 드래그: 끝이 첫 줄이라 버튼도 상자 첫 줄 높이에 뜬다. */
export const Backward: Story = { args: { line: { top: 68, bottom: 96 } } };

/** 오른쪽 여백이 좁다(좁은 화면): 버튼을 상자 안쪽 오른쪽 위로 들인다. */
export const Inset: Story = { args: { inset: true } };

/** 클립보드가 막혔다: 눌러도 체크로 바뀌지 않는다. */
export const CopyBlocked: Story = {
  args: { actions: [{ ...copy, run: () => false }] },
};
