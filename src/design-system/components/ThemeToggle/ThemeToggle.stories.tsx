import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from './ThemeToggle';

/**
 * 누르면 `<html data-theme>`와 `localStorage`를 바꾼다. 툴바의 테마와 같은 속성을 쓰므로,
 * 툴바를 다시 바꾸면 툴바 값으로 돌아간다.
 */
const meta = {
  title: 'Design System/ThemeToggle',
  component: ThemeToggle,
} satisfies Meta<typeof ThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 어두운 테마에서는 해, 밝은 테마에서는 달 아이콘. 밝은 테마일 때 `aria-pressed="true"`. */
export const Default: Story = {};
