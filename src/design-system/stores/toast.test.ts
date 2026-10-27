import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { $toast, dismissToast, pauseToast, resumeToast, showToast, TOAST_MS } from './toast';

describe('toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    dismissToast();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a toast for about two seconds', () => {
    showToast('복사했어요', 'success');
    expect($toast.get()).toMatchObject({ text: '복사했어요', tone: 'success' });

    vi.advanceTimersByTime(TOAST_MS - 1);
    expect($toast.get()?.text).toBe('복사했어요');

    vi.advanceTimersByTime(1);
    expect($toast.get()).toBeNull();
    expect(TOAST_MS).toBe(2000);
  });

  it('replaces a toast shown back to back and restarts the clock', () => {
    showToast('복사했어요', 'success');
    vi.advanceTimersByTime(1500);
    showToast('클립보드에 넣지 못했어요', 'error');
    expect($toast.get()).toMatchObject({ text: '클립보드에 넣지 못했어요', tone: 'error' });

    vi.advanceTimersByTime(1500);
    expect($toast.get()?.text).toBe('클립보드에 넣지 못했어요');
    vi.advanceTimersByTime(500);
    expect($toast.get()).toBeNull();
  });

  it('gives a repeated text a new identity so it is announced again', () => {
    showToast('복사했어요', 'success');
    const first = $toast.get();
    showToast('복사했어요', 'success');
    expect($toast.get()?.id).not.toBe(first?.id);
  });

  it('holds while paused and closes after the time that was left', () => {
    showToast('복사했어요', 'success');
    vi.advanceTimersByTime(500);
    pauseToast();
    vi.advanceTimersByTime(10_000);
    expect($toast.get()?.text).toBe('복사했어요');

    resumeToast();
    vi.advanceTimersByTime(TOAST_MS - 500 - 1);
    expect($toast.get()?.text).toBe('복사했어요');
    vi.advanceTimersByTime(1);
    expect($toast.get()).toBeNull();
  });

  it('can be dismissed before it ends', () => {
    showToast('복사했어요', 'success');
    dismissToast();
    expect($toast.get()).toBeNull();
  });
});
