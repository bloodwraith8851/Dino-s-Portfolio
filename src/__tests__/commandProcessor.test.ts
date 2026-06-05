import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles empty input', async () => {
    await processCommand('', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    expect(mockAddLine).not.toHaveBeenCalled();
  });

  it('registers identity on first time', async () => {
    await processCommand('John', defaultCtx, defaultActions, { isFirstTime: true, isHelpMode: false });
    expect(defaultActions.setVisitorName).toHaveBeenCalledWith('John');
    expect(mockAddLine).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Identity confirmed'),
      }),
    );
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
    expect(mockAddLine).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Rakesh Sarkar'),
      }),
    );
  });

  it('denies admin command to non-admin', async () => {
    await processCommand('admin', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    expect(mockAddLine).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Permission denied'),
      }),
    );
  });

  it('allows admin command to admin', async () => {
    const adminCtx = { ...defaultCtx, isAdmin: true };
    await processCommand('admin', adminCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    expect(mockAddLine).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Admin Tools:'),
      }),
    );
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

  // --- New test cases ---

  it('prints command not found for unknown command', async () => {
    await processCommand('foobarxyz', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    expect(mockAddLine).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('command not found'),
      }),
    );
  });

  it('weather command calls addLine with output', async () => {
    await processCommand('weather', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    // weather is async (API call) — just verify addLine was eventually called
    // The actual text depends on the API but should contain some output
    expect(mockAddLine).toHaveBeenCalled();
  });

  it('chat command triggers enterChat', async () => {
    await processCommand('chat', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    expect(defaultActions.enterChat).toHaveBeenCalledOnce();
  });

  it('snake command triggers setSnakeMode(true)', async () => {
    await processCommand('snake', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    expect(defaultActions.setSnakeMode).toHaveBeenCalledWith(true);
  });

  it('map command triggers setMapMode(true)', async () => {
    await processCommand('map', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    expect(defaultActions.setMapMode).toHaveBeenCalledWith(true);
  });

  it('help command triggers setHelpMode(true)', async () => {
    await processCommand('help', defaultCtx, defaultActions, { isFirstTime: false, isHelpMode: false });
    expect(defaultActions.setHelpMode).toHaveBeenCalledWith(true);
  });
});
