import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from '../IconButton/IconButton';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';

const meta = {
  title: 'Design System/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

const Trigger = () => (
  <TooltipTrigger asChild>
    <IconButton label="출력 패널">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 6h14v12H5zM8 10l3 2-3 2m5 0h3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </IconButton>
  </TooltipTrigger>
);

/** 마우스를 올리거나 포커스하면 300ms 뒤에 열린다. Provider 없이 단독으로 동작한다. */
export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Trigger />
      <TooltipContent>출력 패널 열기</TooltipContent>
    </Tooltip>
  ),
};

/** 열린 상태. 포털 내용도 툴바 테마를 따른다. */
export const Open: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <div className="p-12">
      <Tooltip {...args}>
        <Trigger />
        <TooltipContent side="bottom">출력 패널 열기 (파일 열기 기록)</TooltipContent>
      </Tooltip>
    </div>
  ),
};
