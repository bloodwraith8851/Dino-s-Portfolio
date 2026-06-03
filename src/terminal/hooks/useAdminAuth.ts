import { useState, useEffect } from 'react';
import type { AddLine, AuthStep } from '../types';

export function useAdminAuth(addLine: AddLine) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>(null);

  // Check session storage on mount
  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (token) setIsAdmin(true);
  }, []);

  const initiateAuth = () => {
    if (isAdmin) {
      addLine({ type: 'output', text: ` <span class="t-green">You are already logged in as root. Type 'admin' for options.</span>` });
      return;
    }
    setAuthStep('password');
    addLine({ type: 'output', text: ` <span class="t-dim">Authentication required for root access.</span>` });
    addLine({ type: 'output', text: ` Password: ` });
  };

  const handlePasswordSubmit = async (password: string) => {
    setAuthStep(null);
    addLine({ type: 'output', text: ` <span class="t-dim">Verifying credentials...</span>` });
    try {
      const API_URL = import.meta.env.DEV ? 'https://dino-s-portfolio.vercel.app' : '';
      const res = await fetch(`${API_URL}/api/auth/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res.ok) throw new Error('Unauthorized');
      
      const { token } = await res.json();
      sessionStorage.setItem('admin_token', token);
      setIsAdmin(true);
      addLine({ type: 'output', text: ` <span class="t-green font-bold">Access granted. Root privileges activated.</span>\\n Type '<span class="t-yellow">admin</span>' for tools.` });
    } catch {
      addLine({ type: 'output', text: ` <span class="t-red">Access denied.</span> <span class="t-dim">This incident will be reported.</span>` });
    }
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('admin_token');
    addLine({ type: 'output', text: ` <span class="t-dim">Logged out. Session terminated.</span>` });
  };

  return { isAdmin, authStep, initiateAuth, handlePasswordSubmit, logout };
}
