---
name: shadcn-ui
description: shadcn/ui 컴포넌트 추가, 수정, Storybook 스토리 작성 시 사용
---

# shadcn/ui 컴포넌트 관리

## 컴포넌트 추가

```bash
pnpm dlx shadcn@latest add [component]
```

자주 사용하는 컴포넌트:
- `button`, `card`, `badge` - 기본 UI
- `dialog`, `sheet`, `popover` - 오버레이
- `input`, `textarea`, `select` - 폼
- `tabs`, `accordion` - 네비게이션
- `avatar`, `skeleton` - 데이터 표시

## 파일 구조

```
src/
├── components/
│   └── ui/           # shadcn/ui 컴포넌트 (자동 생성)
│       ├── button.tsx
│       ├── button.stories.tsx  # Storybook 스토리
│       └── ...
├── lib/
│   └── utils.ts      # cn() 유틸리티
```

## 스토리 작성 패턴

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

## 컴포넌트 커스터마이징

shadcn/ui는 코드를 복사하는 방식이므로 직접 수정 가능:

```tsx
// src/components/ui/button.tsx
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        // 기존 variant 수정
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // 새 variant 추가
        success: "bg-green-600 text-white hover:bg-green-700",
      },
      size: {
        // 새 size 추가
        "2xl": "h-14 px-8 text-lg",
      },
    },
  }
)
```

## 스타일 변수

CSS 변수는 `src/styles/global.css`에서 관리:

```css
:root {
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  /* ... */
}

.dark {
  --primary: oklch(0.922 0 0);
  /* ... */
}
```

## Storybook 실행

```bash
pnpm storybook        # localhost:6006
pnpm build-storybook  # 정적 빌드
```

## 체크리스트

컴포넌트 추가 시:
- [ ] `pnpm dlx shadcn@latest add [name]`
- [ ] `*.stories.tsx` 파일 생성
- [ ] 기본 스토리 + variant 비교 스토리
- [ ] Storybook에서 확인 (`pnpm storybook`)

커스터마이징 시:
- [ ] 기존 variant/size 수정 또는 새로 추가
- [ ] 스토리에 새 variant 추가
- [ ] `pnpm build` 타입 체크 통과 확인
