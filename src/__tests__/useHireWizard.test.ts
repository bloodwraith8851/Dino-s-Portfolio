import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useHireWizard } from '../terminal/hooks/useHireWizard';

describe('useHireWizard', () => {
  const mockAddLine = vi.fn();
  const mockSupabase = {} as any;
  const mockFetch = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('initializes with no step', () => {
    const { result } = renderHook(() => useHireWizard(mockAddLine, mockSupabase, 'visitor'));
    expect(result.current.hireStep).toBeNull();
  });

  it('initiateHire starts the wizard', () => {
    const { result } = renderHook(() => useHireWizard(mockAddLine, mockSupabase, 'visitor'));
    
    act(() => {
      result.current.initiateHire();
    });

    expect(result.current.hireStep).toBe('name');
    expect(mockAddLine).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('What is your name'),
    }));
  });

  it('progresses through steps and submits', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    mockSupabase.from = vi.fn().mockReturnThis();
    mockSupabase.insert = vi.fn().mockResolvedValue({});

    const { result } = renderHook(() => useHireWizard(mockAddLine, mockSupabase, 'visitor'));
    
    act(() => {
      result.current.initiateHire();
    });

    // Step 1: Name
    await act(async () => {
      await result.current.processHireInput('Alice');
    });
    expect(result.current.hireStep).toBe('email');

    // Step 2: Email (invalid)
    await act(async () => {
      await result.current.processHireInput('not-an-email');
    });
    expect(result.current.hireStep).toBe('email');
    expect(mockAddLine).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('valid email address'),
    }));

    // Step 2: Email (valid)
    await act(async () => {
      await result.current.processHireInput('alice@example.com');
    });
    expect(result.current.hireStep).toBe('msg');

    // Step 3: Message
    await act(async () => {
      await result.current.processHireInput('I want to hire you.');
    });
    expect(result.current.hireStep).toBe('ok');

    // Step 4: Confirm OK
    await act(async () => {
      await result.current.processHireInput('y');
    });

    // Submits
    expect(result.current.hireStep).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/notifications/send'), expect.any(Object));
    expect(mockAddLine).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('delivered successfully'),
    }));
  });

  it('handles cancellation', async () => {
    const { result } = renderHook(() => useHireWizard(mockAddLine, mockSupabase, 'visitor'));
    
    act(() => {
      result.current.initiateHire();
    });

    await act(async () => {
      await result.current.processHireInput('cancel');
    });

    expect(result.current.hireStep).toBeNull();
    expect(mockAddLine).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('wizard cancelled'),
    }));
  });
});
