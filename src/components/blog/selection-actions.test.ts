import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { $toast, dismissToast, type SelectionContext } from '@/design-system';
import { copySelection } from './selection-actions';

const ctx: SelectionContext = { text: '고른 대목 그대로', slug: 'post', headingId: null };

describe('copy action', () => {
  beforeEach(() => dismissToast());

  afterEach(() => {
    vi.unstubAllGlobals();
    dismissToast();
  });

  it('copies the plain text and confirms it with a toast', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(async () => {});
    vi.stubGlobal('navigator', { platform: 'MacIntel', clipboard: { writeText } });

    expect(await copySelection.run(ctx)).toBe(true);
    expect(writeText).toHaveBeenCalledWith('고른 대목 그대로');
    expect($toast.get()).toMatchObject({ text: '복사했어요', tone: 'success' });
  });

  it('points to the copy key of the platform when the clipboard is blocked', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(async () => {
      throw new DOMException('denied', 'NotAllowedError');
    });

    vi.stubGlobal('navigator', { platform: 'MacIntel', clipboard: { writeText } });
    expect(await copySelection.run(ctx)).toBe(false);
    expect($toast.get()).toMatchObject({ tone: 'error' });
    expect($toast.get()?.text).toContain('⌘C');

    vi.stubGlobal('navigator', { platform: 'Win32', clipboard: { writeText } });
    await copySelection.run(ctx);
    expect($toast.get()?.text).toContain('Ctrl+C');
  });
});
