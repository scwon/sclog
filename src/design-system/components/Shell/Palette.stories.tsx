import type { Meta, StoryObj } from '@storybook/react';
import { Palette } from './Palette';

/**
 * 명령 팔레트(파일 모드). 실제 사이트에서는 창 틀이 ⌘P(Ctrl+P)로 띄우고 ↑↓·Enter·Esc를 넘겨준다. 여기서는
 * 팔레트만 떠 있으므로 입력과 마우스로 확인한다. 시험용 글이 섞여 있다.
 */
const meta = {
  title: 'Design System/Shell/Palette',
  component: Palette,
  parameters: { layout: 'fullscreen' },
  args: {
    platform: 'mac',
    onPick: () => {},
    onDismiss: () => {},
    tree: [
      {
        year: '2024',
        files: [
          {
            url: '/blog/react-hooks/',
            title: '훅을 다시 읽다',
            path: 'posts/2024/react-hooks.mdx',
          },
          { url: '/blog/hello/', title: '개발자의 React 회고', path: 'posts/2024/hello.mdx' },
        ],
      },
      {
        year: '2023',
        files: [
          {
            url: '/blog/pro-developer-2023-days/',
            title: '프로 개발자 2023일 후기',
            path: 'posts/2023/pro-developer-2023-days.mdx',
          },
        ],
      },
    ],
  },
} satisfies Meta<typeof Palette>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 빈 입력: 모든 글을 트리 순서로 보이고 첫 줄이 골라져 있다. 맨 아래에 `⌘⇧F` 안내. */
export const Mac: Story = {};

/** 윈도·리눅스: 안내의 키 표기가 `Ctrl+Shift+F`다. */
export const Other: Story = { args: { platform: 'other' } };
