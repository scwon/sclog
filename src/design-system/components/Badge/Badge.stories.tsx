import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'Design System/Badge',
  component: Badge,
  args: { children: '회고' },
  argTypes: { variant: { control: 'inline-radio', options: ['tag', 'category', 'meta'] } },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 태그: 코랄 `#`과 흐린 글자. */
export const Tag: Story = {};

/** 분류: 작은 모노 글자의 `[회고]`. 흐름 로그 줄에 쓴다. */
export const Category: Story = { args: { variant: 'category' } };

/** 메타: 읽는 시간·날짜 같은 작은 모노 글자. */
export const ReadingTime: Story = { args: { variant: 'meta', children: '7분 읽기' } };

/** 태그 링크. 마우스를 올리면 본 글자색이 된다. */
export const TagLinks: Story = {
  render: () => (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0" aria-label="태그">
      {['회고', '개발자', '프론트엔드', '커리어'].map((tag) => (
        <li key={tag}>
          <Badge asChild>
            <a href={`#${tag}`}>{tag}</a>
          </Badge>
        </li>
      ))}
    </ul>
  ),
};

/** 흐름 로그 한 줄처럼 섞어 쓴 모습. */
export const InALogLine: Story = {
  render: () => (
    <p className="m-0 flex items-center gap-3">
      <Badge variant="meta">2023-04-30</Badge>
      <Badge variant="category">회고</Badge>
      <span className="font-mono text-xs text-text-soft">pro-developer-2023-days.mdx</span>
      <Badge variant="meta">7분</Badge>
    </p>
  ),
};
