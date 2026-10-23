---
name: storybook-stories
description: 이 저장소의 UI 컴포넌트에 Storybook 스토리를 작성하거나 수정할 때 사용. 스토리 파일 위치, 메타 구성, variant 비교 스토리, 추가 후 점검 순서를 정한다. shadcn 컴포넌트 추가·테마·레지스트리 자체는 공식 `shadcn` 스킬을 따른다.
---

# Storybook 스토리 작성

## 파일 위치

스토리는 컴포넌트 옆에 `*.stories.tsx`로 둔다.

```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       └── button.stories.tsx
└── lib/
    └── utils.ts      # cn()
```

## 스토리 구성

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'UI/Button',        // 카테고리/이름
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],        // 자동 문서 생성
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 스토리
export const Default: Story = {
  args: { children: 'Button' },
};

// 여러 variant 비교
export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="default">Default</Button>
      <Button variant="outline">Outline</Button>
    </div>
  ),
};
```

## 실행

```bash
pnpm storybook        # localhost:6006
pnpm build-storybook  # 정적 빌드
```

## 점검 순서

컴포넌트를 추가했을 때:
1. `*.stories.tsx`를 만든다.
2. 기본 스토리와 variant 비교 스토리를 넣는다.
3. `pnpm storybook`에서 확인한다.

variant나 size를 바꿨을 때:
1. 비교 스토리에 새 값을 추가한다.
2. `pnpm build`로 타입 체크를 통과시킨다.
