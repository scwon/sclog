import { atom } from 'nanostores';

/**
 * 상태줄 알림 채널. 창 틀 밖(페이지 스크립트)에서도 상태줄 왼쪽 글자 자리(열기 요약 자리)에 잠깐 뜨는 알림을
 * 띄운다. 창 틀(`Shell`)이 구독해 `aria-live="polite"` 영역에 그린다. 열기 요약은 이 채널을 쓰지 않고
 * 스크린 리더에 읽히지 않는다.
 */
export interface StatusNotice {
  /** 알림마다 새 값. 같은 글자가 다시 와도 새 알림으로 그려 스크린 리더가 다시 읽게 한다. */
  id: number;
  text: string;
}

/** 알림이 떠 있는 시간(ms). */
export const STATUS_NOTICE_MS = 2000;

/** 지금 떠 있는 알림. 없으면 `null`. */
export const $statusNotice = atom<StatusNotice | null>(null);

let sequence = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

/** 알림을 띄운다. 앞 알림이 떠 있으면 바로 바꾸고, 이 알림부터 다시 약 2초 센다. */
export function showStatusNotice(text: string): void {
  clearTimeout(timer);
  sequence += 1;
  $statusNotice.set({ id: sequence, text });
  timer = setTimeout(clearStatusNotice, STATUS_NOTICE_MS);
}

/** 떠 있는 알림을 바로 내린다. 창 틀은 새 파일을 열 때 불러 열기 요약에 자리를 내준다. */
export function clearStatusNotice(): void {
  clearTimeout(timer);
  timer = undefined;
  $statusNotice.set(null);
}
