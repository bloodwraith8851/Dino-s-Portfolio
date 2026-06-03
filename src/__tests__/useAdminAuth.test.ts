import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAdminAuth } from '../terminal/hooks/useAdminAuth';

// Mock fetch for the API route
global.fetch = vi.fn();

describe('useAdminAuth', () => {
  const mockAddLine = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('initializes with false if no token in sessionStorage', () => {
    const { result } = renderHook(() => useAdminAuth(mockAddLine));
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.authStep).toBeNull();
  });

  it('initializes with true if token exists', () => {
    sessionStorage.setItem('admin_token', 'test_token');
    const { result } = renderHook(() => useAdminAuth(mockAddLine));
    expect(result.current.isAdmin).toBe(true);
  });

  it('initiateAuth starts the password flow if not admin', () => {
    const { result } = renderHook(() => useAdminAuth(mockAddLine));
    act(() => {
      result.current.initiateAuth();
    });
    expect(result.current.authStep).toBe('password');
    expect(mockAddLine).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('Password:'),
    }));
  });

  it('initiateAuth does nothing if already admin', () => {
    sessionStorage.setItem('admin_token', 'test_token');
    const { result } = renderHook(() => useAdminAuth(mockAddLine));
    act(() => {
      result.current.initiateAuth();
    });
    expect(result.current.authStep).toBeNull();
    expect(mockAddLine).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('already logged in'),
    }));
  });

  it('handles successful password submit', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'new_token' }),
    });

    const { result } = renderHook(() => useAdminAuth(mockAddLine));
    
    act(() => {
      result.current.initiateAuth();
    });

    await act(async () => {
      await result.current.handlePasswordSubmit('correct_password');
    });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.authStep).toBeNull();
    expect(sessionStorage.getItem('admin_token')).toBe('new_token');
    expect(mockAddLine).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('Access granted'),
    }));
  });

  it('handles failed password submit', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    const { result } = renderHook(() => useAdminAuth(mockAddLine));
    
    act(() => {
      result.current.initiateAuth();
    });

    await act(async () => {
      await result.current.handlePasswordSubmit('wrong_password');
    });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.authStep).toBeNull();
    expect(mockAddLine).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('Access denied'),
    }));
  });

  it('handles abort via cancel as wrong password', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    const { result } = renderHook(() => useAdminAuth(mockAddLine));
    
    act(() => {
      result.current.initiateAuth();
    });

    await act(async () => {
      await result.current.handlePasswordSubmit('cancel');
    });

    expect(result.current.authStep).toBeNull();
    expect(mockAddLine).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining('Access denied'),
    }));
  });
});
