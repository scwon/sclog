import { useState, type ReactNode } from 'react';
import { useStore } from '@nanostores/react';
import { Toast as ToastPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';
import {
  $toast,
  dismissToast,
  pauseToast,
  resumeToast,
  type ToastMessage,
} from '../../stores/toast';

/** `Toast`의 속성. */
export interface ToastProps {
  /** 띄울 토스트. `null`이면 떠 있던 토스트가 닫힌다(움직임 줄이기가 아니면 사라지는 전환을 거친다). */
  message: ToastMessage | null;
  /** 토스트 영역의 이름이자 스크린 리더가 토스트 앞에 읽는 말. */
  label?: string;
  /** 포인터·포커스가 토스트에 머물거나 창이 포커스를 잃으면 부른다. 닫힘 시계를 멈춘다. */
  onPause?: () => void;
  /** 멈춘 까닭이 풀리면 부른다. */
  onResume?: () => void;
  /** 독자가 토스트를 아래로 밀어 닫으면 부른다. */
  onDismiss?: () => void;
}

const icon = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'size-4 flex-none text-accent-text',
} as const;

const toneIcon: Record<ToastMessage['tone'], ReactNode> = {
  success: (
    <svg {...icon} strokeWidth={2.4}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg {...icon} strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5m0 3.5v.01" />
    </svg>
  ),
};

/**
 * 토스트. Radix Toast를 감싸 화면 아래 가운데(상태줄 바로 위)에 한 줄 알림 하나를 띄운다. 새 토스트가 오면
 * 앞 토스트를 바로 바꾸고, 스크린 리더에는 `label`을 앞에 붙여 정중하게(polite) 읽힌다.
 *
 * 닫힘 시계는 Radix가 아니라 부르는 쪽(`stores/toast`)이 센다. 그래서 Radix의 `duration`은 끄고, 멈춤·다시 셈만
 * `onPause`·`onResume`으로 넘긴다. 키는 받지 않는다: F8로 토스트 영역에 들어가는 Radix 단축키를 끄고(`hotkey`
 * 빈 배열), Esc도 무시해 Esc는 창 틀의 단축키 판정(`shortcutFor`)이 맨 위 층 하나만 닫게 둔다.
 */
export function Toast({ message, label = '알림', onPause, onResume, onDismiss }: ToastProps) {
  // 닫히는 동안에도 마지막 토스트를 그려 사라지는 전환을 보인다.
  const [last, setLast] = useState(message);
  if (message !== null && message !== last) setLast(message);
  const open = message !== null && message.id === last?.id;

  return (
    <ToastPrimitive.Provider label={label} duration={Infinity} swipeDirection="down">
      {last && (
        <ToastPrimitive.Root
          key={last.id}
          data-slot="toast"
          data-tone={last.tone}
          open={open}
          type="background"
          onOpenChange={(next) => {
            if (!next) onDismiss?.();
          }}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPause={onPause}
          onResume={onResume}
          className={cn(
            'flex max-w-full items-center gap-2 rounded-md border border-border-strong bg-surface-raised px-3.5 py-2 font-sans text-sm text-text shadow-[0_12px_32px_-12px_var(--scrim)]',
            'animate-in duration-(--motion-enter) ease-standard fade-in-0 slide-in-from-bottom-2',
            'data-[state=closed]:animate-out data-[state=closed]:duration-(--motion-fast) data-[state=closed]:fade-out-0',
            'data-[swipe=cancel]:translate-y-0 data-[swipe=end]:translate-y-(--radix-toast-swipe-end-y) data-[swipe=move]:translate-y-(--radix-toast-swipe-move-y)',
            // `data-[state=closed]:`가 붙은 클래스가 더 구체적이라 움직임 줄이기도 같은 조건을 붙여 끈다.
            'motion-reduce:animate-none motion-reduce:data-[state=closed]:animate-none',
          )}
        >
          {toneIcon[last.tone]}
          <ToastPrimitive.Description>{last.text}</ToastPrimitive.Description>
        </ToastPrimitive.Root>
      )}
      <ToastPrimitive.Viewport
        data-slot="toast-viewport"
        hotkey={[]}
        label={label}
        className="fixed bottom-[calc(var(--bar-height-xs)+16px)] left-1/2 z-50 m-0 flex w-max max-w-[calc(100vw-32px)] -translate-x-1/2 list-none flex-col items-center p-0 outline-none"
      />
    </ToastPrimitive.Provider>
  );
}

/**
 * 토스트 채널(`$toast`)을 그리는 `Toast`. 창 틀이 처음 토스트가 올 때 불러오는 청크라 기본 내보내기로 둔다.
 */
export default function Toaster() {
  const message = useStore($toast);
  return (
    <Toast message={message} onPause={pauseToast} onResume={resumeToast} onDismiss={dismissToast} />
  );
}
