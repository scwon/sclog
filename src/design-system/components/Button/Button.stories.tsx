import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Design System/Button',
  component: Button,
  args: { children: '글 열기' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'ghost', 'link'] },
    size: { control: 'inline-radio', options: ['default', 'sm'] },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 선과 올린 바탕이 있는 기본 버튼. 마우스를 올리면 코랄 선과 선택 바탕이 된다. */
export const Default: Story = {};

/** 바탕 없는 버튼. */
export const Ghost: Story = { args: { variant: 'ghost' } };

/** 마우스를 올리거나 포커스하면 코랄 밑줄이 그어지는 링크 모양. */
export const Link: Story = { args: { variant: 'link', children: '글 목록으로' } };

/** 작은 크기. */
export const Small: Story = { args: { size: 'sm' } };

/** 비활성. */
export const Disabled: Story = { args: { disabled: true } };

/** `asChild`로 `<a>`에 버튼 모양을 입힌다. */
export const AsLink: Story = {
  args: { asChild: true, children: <a href="#posts">posts.log 열기</a> },
};

/** 세 모양과 두 크기를 한 번에 본다. */
export const All: Story = {
  render: () => (
    <div className="grid gap-4">
      {(['default', 'sm'] as const).map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-4">
          <Button size={size}>기본</Button>
          <Button size={size} variant="ghost">
            고스트
          </Button>
          <Button size={size} variant="link">
            링크
          </Button>
        </div>
      ))}
    </div>
  ),
};
