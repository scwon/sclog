import { atom } from 'nanostores';

/**
 * 토스트 채널. 화면 아래 가운데에 잠깐 떴다 사라지는 한 줄 알림이다. 어느 아일랜드·페이지 스크립트에서나
 * `showToast`로 띄우고, 창 틀(`Shell`)이 그리는 `Toaster`가 구독해 그린다. 상태줄 알림(`notice.ts`)과는
 * 다른 채널이다.
 */

/** 토스트의 결. `success`는 됐다는 확인, `error`는 막혀서 다른 길을 안내하는 말이다. */
export type ToastTone = 'success' | 'error';

/** 떠 있는 토스트 하나. */
export interface ToastMessage {
  /** 토스트마다 새 값. 같은 글자가 다시 와도 새 토스트로 그려 스크린 리더가 다시 읽게 한다. */
  id: number;
  text: string;
  tone: ToastTone;
}

/** 토스트가 떠 있는 시간(ms). */
export const TOAST_MS = 2000;

/** 지금 떠 있는 토스트. 없으면 `null`. 한 번에 하나만 뜬다. */
export const $toast = atom<ToastMessage | null>(null);

let sequence = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
/** 닫힐 때까지 남은 시간(ms)과 시계를 마지막으로 켠 때. 멈췄다 다시 셀 때 쓴다. */
let remaining = 0;
let startedAt = 0;
let paused = false;

function startClock(ms: number): void {
  clearTimeout(timer);
  remaining = ms;
  startedAt = Date.now();
  timer = setTimeout(dismissToast, ms);
}

/**
 * 토스트를 띄운다. 앞 토스트가 떠 있으면 바로 바꾸고, 이 토스트부터 다시 약 2초 센다.
 * 멈춘 채로 새 토스트가 오면 시계는 멈춘 채로 둔다(포인터가 아직 토스트 위에 있다).
 */
export function showToast(text: string, tone: ToastTone): void {
  sequence += 1;
  $toast.set({ id: sequence, text, tone });
  if (paused) {
    clearTimeout(timer);
    remaining = TOAST_MS;
  } else {
    startClock(TOAST_MS);
  }
}

/**
 * 닫힘 시계를 멈춘다. 포인터가 토스트 위에 있거나, 포커스가 토스트에 있거나, 창이 포커스를 잃었을 때
 * `Toaster`가 부른다(Radix Toast의 `onPause`).
 */
export function pauseToast(): void {
  if (paused || $toast.get() === null) return;
  paused = true;
  clearTimeout(timer);
  remaining -= Date.now() - startedAt;
}

/** 멈춘 시계를 남은 시간부터 다시 센다(Radix Toast의 `onResume`). */
export function resumeToast(): void {
  if (!paused) return;
  paused = false;
  if ($toast.get() !== null) startClock(Math.max(remaining, 0));
}

/** 떠 있는 토스트를 바로 내린다. */
export function dismissToast(): void {
  clearTimeout(timer);
  timer = undefined;
  paused = false;
  $toast.set(null);
}
