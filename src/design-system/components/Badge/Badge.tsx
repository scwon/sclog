import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * 짧은 꼬리표. 시안처럼 바탕을 칠하지 않고 글자와 기호로만 구분한다.
 * - tag: `#회고`. 본 글꼴, 흐린 글자에 코랄 `#`
 * - category: `[회고]`. 작은 모노 글자, 코랄
 * - meta: `7분`, `2023-04-30`. 작은 모노 글자, 흐린 색, 고정폭 숫자
 * `asChild`로 링크(`<a>`)에 쓰면 마우스를 올렸을 때 본 글자색이 된다.
 */
const badgeVariants = cva(
  'inline-flex items-center whitespace-nowrap transition-colors duration-(--motion-fast) ease-standard [&[href]]:hover:text-text',
  {
    variants: {
      variant: {
        tag: "text-sm text-text-muted before:mr-0.5 before:text-accent-text before:content-['#']",
        category: "font-mono text-xs text-accent-text before:content-['['] after:content-[']']",
        meta: 'font-mono text-xs text-text-muted tabular-nums',
      },
    },
    defaultVariants: { variant: 'tag' },
  },
);

/** `Badge`의 props. */
export type BadgeProps = ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  };

/** 태그·분류·메타 정보용 꼬리표. `variant`로 모양을 고르고 `asChild`로 링크에도 쓴다. */
export function Badge({ variant = 'tag', asChild = false, className, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : 'span';
  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
