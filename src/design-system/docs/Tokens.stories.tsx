import type { Meta, StoryObj } from '@storybook/react';
import { ThemeSample } from './TokenDocs';

/**
 * Tokens.mdx가 붙는 스토리. addon-themes 데코레이터는 스토리를 그릴 때만 `<html data-theme>`를 바꾸므로,
 * 문서 페이지에 이 스토리를 하나 두어 툴바 전환이 페이지 전체 견본에 반영되게 한다.
 */
const meta = {
  title: 'Design System/Tokens',
  component: ThemeSample,
} satisfies Meta<typeof ThemeSample>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 의미 토큰 유틸리티(bg-surface-panel, text-prose, bg-accent …)로 그린 견본. */
export const Sample: Story = {};
