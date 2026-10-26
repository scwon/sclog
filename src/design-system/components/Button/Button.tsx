import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * 버튼 모양. shadcn `button`을 바탕으로 의미 토큰 유틸리티만 쓰도록 바꿨다.
 * - default: 선과 올린 바탕이 있는 버튼. 마우스를 올리면 코랄 선과 선택 바탕
 * - ghost: 바탕 없이 글자만. 마우스를 올리면 상태 바탕
 * - link: 마우스를 올리면 코랄 밑줄이 왼쪽에서 그어지는 글자 링크(시안 `.pen`)
 * size `icon`은 `IconButton`이 쓰는 30px 정사각이다.
 * 포커스 외곽선은 2층 base.css의 `:focus-visible` 규칙을 그대로 쓴다.
 */
const buttonVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-medium whitespace-nowrap',
    'transition-[color,background-color,border-color,background-size] duration-(--motion-fast) ease-standard',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default:
          'rounded-md border border-border-strong bg-surface-raised text-text hover:border-accent hover:bg-state-selected',
        ghost: 'rounded-md text-text-soft hover:bg-state-hover hover:text-text',
        link: [
          'rounded-none text-text',
          'bg-linear-to-r from-accent to-accent bg-size-[0_2px] bg-position-[0_100%] bg-no-repeat',
          'duration-(--motion-base) hover:bg-size-[100%_2px] focus-visible:bg-size-[100%_2px]',
        ],
      },
      size: {
        default: 'h-9 px-3.5 text-sm',
        sm: 'h-7.5 gap-1.5 px-2.5 text-xs',
        icon: "size-7.5 rounded-sm p-0 [&_svg:not([class*='size-'])]:size-4.5",
      },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0 pb-0.5' }],
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

/** `Button`의 props. `asChild`면 자식 요소(예: `<a>`)에 버튼 모양을 입힌다. */
export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

/** 버튼. `variant`(default·ghost·link)와 `size`(default·sm·icon)를 고르고, `asChild`로 링크에도 쓴다. */
export function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      // 폼 안에서 뜻하지 않게 제출하지 않도록 기본값을 button으로 둔다.
      type={asChild ? type : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
