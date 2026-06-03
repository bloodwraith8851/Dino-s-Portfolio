import { describe, it, expect, vi } from 'vitest';
import { processCommand } from '../terminal/commandProcessor';
import type { CommandContext } from '../terminal/types';

describe('processCommand', () => {
  const mockAddLine = vi.fn();
  const mockAddLines = vi.fn();
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({}),
  };

  const defaultCtx: CommandContext = {
    addLine: mockAddLine,
    addLines: mockAddLines,
    isAdmin: false,
    visitorName: 'visitor',
    history: [],
    supabase: mockSupabase as any,
    sanitizeHTML: (s) => s,
  };

  const defaultActions = {
    clearLines: vi.fn(),
    setVisitorName: vi.fn(),
    initiateAuth: vi.fn(),
    initiateHire: vi.fn(),
    enterChat: vi.fn(),
    toggleLogs: vi.fn(),
    toggleWatch: vi.fn(),
    disableAllFeeds: vi.fn(),
    setSnakeMode: vi.fn(),
    setMapMode: vi.fn(),
    setHelpMode: vi.fn(),
    logout: vi.fn(),
  };

  it('handles empty input', async () => {
    await processCommand('', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    expect(mockAddLine).not.toHaveBeenCalled();
  });

  it('registers identity on first time', async () => {
    await processCommand('John', defaultCtx, defaultActions, { isFirstTime: true, isHelpMode: false });
    expect(defaultActions.setVisitorName).toHaveBeenCalledWith('John');
    expect(mockAddLine).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('Identity confirmed'),
    }));
  });

  it('handles help mode interactions', async () => {
    await processCommand('1', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: true });
    expect(mockAddLine).toHaveBeenCalledWith(expect.objectContaining({ text: expect.any(String) }));
  });

  it('quits help mode on q', async () => {
    await processCommand('q', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: true });
    expect(defaultActions.setHelpMode).toHaveBeenCalledWith(false);
  });

  it('routes about command', async () => {
    await processCommand('about', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    expect(mockAddLine).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('Rakesh Sarkar'),
    }));
  });

  it('denies admin command to non-admin', async () => {
    await processCommand('admin', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    expect(mockAddLine).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('Permission denied'),
    }));
  });

  it('allows admin command to admin', async () => {
    const adminCtx = { ...defaultCtx, isAdmin: true };
    await processCommand('admin', adminCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    expect(mockAddLine).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('Admin Tools:'),
    }));
  });

  it('triggers clear action', async () => {
    await processCommand('clear', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    expect(defaultActions.clearLines).toHaveBeenCalled();
    expect(defaultActions.disableAllFeeds).toHaveBeenCalled();
  });

  it('triggers hire wizard', async () => {
    await processCommand('hire', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    expect(defaultActions.initiateHire).toHaveBeenCalled();
  });
});
