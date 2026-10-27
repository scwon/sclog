import type { ComponentProps } from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * 팝오버. shadcn `popover`를 바탕으로 한 Radix Popover 래퍼다. Provider가 없어 단독으로 동작한다(ADR 0002).
 * 기본은 모달이 아니다(`modal={false}`): 바깥을 계속 읽고 고를 수 있다.
 */
export function Popover(props: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

/** 팝오버를 여닫는 요소. 보통 `asChild`로 버튼을 감싼다. */
export function PopoverTrigger(props: ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/**
 * 팝오버를 붙이는 기준점. 요소 대신 `virtualRef`(`getBoundingClientRect()`만 있는 객체)를 넘기면 화면의 아무 자리
 * (글자 선택의 끝 줄 등)에 붙인다. 스크롤하면 그 함수를 다시 불러 따라간다.
 */
export function PopoverAnchor(props: ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

/**
 * 팝오버 내용. `document.body`로 포털되고(`container`를 주면 그 요소 끝으로) 테마 토큰은 `<html data-theme>`를 따른다.
 * 랜드마크 안에 있어야 하는 내용(본문 위에 뜨는 툴바)은 `container`로 랜드마크 안 요소를 준다. 떠오른 바탕(`surface-raised`)에
 * 테두리를 두르고, 나타날 때 짧게 커지며 들어온다(움직임 줄이기에서는 바로 뜬다).
 */
export function PopoverContent({
  className,
  sideOffset = 6,
  container,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content> & {
  /** 포털할 요소. 없으면 `document.body`. */
  container?: HTMLElement | null;
}) {
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 rounded-md border border-border-strong bg-surface-raised p-1 text-text shadow-[0_10px_28px_-10px_var(--scrim)] outline-hidden',
          'origin-(--radix-popover-content-transform-origin) animate-in duration-(--motion-fast) fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'motion-reduce:animate-none',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
