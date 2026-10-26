import type { ComponentProps } from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * 툴팁. shadcn `tooltip`을 바탕으로 하되 `TooltipProvider`를 `Tooltip` 안에 내장해,
 * 앱 전체를 감싸는 Provider 없이 단독으로 동작한다(ADR 0002). 아일랜드 사이에서
 * 지연 시간 건너뛰기를 나누지 못하는 것만 포기한다.
 */
export function Tooltip({
  delayDuration = 300,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipPrimitive.Provider>
  );
}

/** 툴팁을 여는 요소. 보통 `asChild`로 버튼을 감싼다. */
export function TooltipTrigger(props: ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

/**
 * 툴팁 내용. `document.body`로 포털되지만 테마 토큰이 `<html data-theme>`에 있어 그대로 따른다.
 * 글자와 바탕을 뒤집은 색(바탕 `text`, 글자 `surface`)이라 두 테마 모두 눈에 띈다.
 */
export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-fit max-w-xs rounded-sm bg-text px-2 py-1 text-xs text-balance text-surface',
          'origin-(--radix-tooltip-content-transform-origin) animate-in duration-(--motion-fast) fade-in-0 zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'motion-reduce:animate-none',
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="size-2 translate-y-[calc(-50%_-_1px)] rotate-45 rounded-[1px] bg-text fill-text" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
