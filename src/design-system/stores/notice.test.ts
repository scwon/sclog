import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { $statusNotice, clearStatusNotice, showStatusNotice, STATUS_NOTICE_MS } from './notice';

describe('status notice channel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearStatusNotice();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a notice for about two seconds', () => {
    showStatusNotice('✓ 주소 복사됨 · #why');
    expect($statusNotice.get()?.text).toBe('✓ 주소 복사됨 · #why');

    vi.advanceTimersByTime(STATUS_NOTICE_MS - 1);
    expect($statusNotice.get()?.text).toBe('✓ 주소 복사됨 · #why');

    vi.advanceTimersByTime(1);
    expect($statusNotice.get()).toBeNull();
    expect(STATUS_NOTICE_MS).toBe(2000);
  });

  it('replaces the previous notice at once and restarts the clock', () => {
    showStatusNotice('first');
    vi.advanceTimersByTime(1500);
    showStatusNotice('second');
    expect($statusNotice.get()?.text).toBe('second');

    vi.advanceTimersByTime(1500);
    expect($statusNotice.get()?.text).toBe('second');
    vi.advanceTimersByTime(500);
    expect($statusNotice.get()).toBeNull();
  });

  it('gives a repeated text a new identity so it is announced again', () => {
    showStatusNotice('same');
    const first = $statusNotice.get();
    showStatusNotice('same');
    expect($statusNotice.get()?.id).not.toBe(first?.id);
  });

  it('can be cleared before it ends', () => {
    showStatusNotice('gone');
    clearStatusNotice();
    expect($statusNotice.get()).toBeNull();
  });
});
