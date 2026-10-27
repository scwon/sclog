import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button/Button';
import { showToast } from '../../stores/toast';
import Toaster, { Toast } from './Toast';

/**
 * 토스트. 화면 아래 가운데(상태줄 높이만큼 띄워) 한 줄 알림이 뜬다. 실제 사이트에서는 `showToast`로 띄우고 약 2초
 * 뒤 닫히며, 포인터를 올리거나 창이 포커스를 잃으면 그동안 멈춘다. 여기 성공·실패 스토리는 닫히지 않게 고정해 둔다.
 */
const meta = {
  title: 'Design System/Toast',
  component: Toast,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="h-60">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 됐다는 확인(선택 툴바에서 복사했을 때). */
export const Success: Story = {
  args: { message: { id: 1, text: '복사했어요', tone: 'success' } },
};

/** 막혀서 다른 길을 안내한다(클립보드를 쓸 수 없을 때). */
export const Failure: Story = {
  args: { message: { id: 1, text: '클립보드에 넣지 못했어요. ⌘C로 복사하세요', tone: 'error' } },
};

/** 토스트 채널에 연결한 실제 동작. 누를 때마다 앞 토스트를 바꾸고 약 2초 뒤 닫힌다. */
export const Live: Story = {
  args: { message: null },
  render: () => (
    <div className="flex gap-2 p-6">
      <Button onClick={() => showToast('복사했어요', 'success')}>성공 토스트</Button>
      <Button onClick={() => showToast('클립보드에 넣지 못했어요. ⌘C로 복사하세요', 'error')}>
        실패 토스트
      </Button>
      <Toaster />
    </div>
  ),
};
