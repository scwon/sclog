import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button/Button';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from './Popover';

/**
 * 팝오버. 버튼으로 여닫거나, 가상 기준점(`virtualRef`)에 붙여 화면의 아무 자리에나 띄운다.
 * 두 테마는 툴바의 테마 전환으로 확인한다.
 */
const meta = {
  title: 'Design System/Popover',
  component: Popover,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 버튼으로 여는 팝오버. 바깥을 누르거나 Esc를 누르면 닫힌다. */
export const WithTrigger: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>열기</Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 text-sm">팝오버 안의 짧은 설명.</PopoverContent>
    </Popover>
  ),
};

/** 화면 좌표 하나(가로 240, 세로 120)를 기준점으로 오른쪽·위 맞춤(`side="right"`, `align="start"`)으로 띄운다. */
export const VirtualAnchor: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => {
    const point = {
      current: {
        getBoundingClientRect: () => DOMRect.fromRect({ x: 240, y: 120, width: 0, height: 28 }),
      },
    };
    return (
      <div className="h-80">
        <span aria-hidden="true" className="absolute top-[120px] left-[240px] h-7 w-px bg-accent" />
        <Popover open>
          <PopoverAnchor virtualRef={point} />
          <PopoverContent side="right" align="start" className="p-3 text-sm">
            가상 기준점에 붙은 팝오버
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};
