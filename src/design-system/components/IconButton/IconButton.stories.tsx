import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton';

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 7h16M4 12h16M4 17h10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const meta = {
  title: 'Design System/IconButton',
  component: IconButton,
  args: { label: '탐색기', children: <MenuIcon /> },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 30px 정사각 아이콘 버튼. `label`이 접근 가능한 이름이 된다. Tab으로 포커스하면 외곽선이 보인다. */
export const Default: Story = {};

/** 켜고 끄는 버튼은 `aria-pressed`로 상태를 알린다. */
export const Pressed: Story = { args: { 'aria-pressed': true } };

/** `asChild`로 링크에 쓴다. */
export const AsLink: Story = {
  args: {
    label: 'GitHub',
    asChild: true,
    children: (
      // 이름(aria-label)은 IconButton의 label이 asChild로 이 <a>에 붙는다.
      // oxlint-disable-next-line jsx-a11y/control-has-associated-label
      <a href="https://github.com/scwon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </a>
    ),
  },
};
