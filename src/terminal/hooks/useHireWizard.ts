import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AddLine, HireStep, HireData } from '../types';
import { sanitizeHTML } from '../sanitize';

export function useHireWizard(addLine: AddLine, supabase: SupabaseClient, visitorName: string) {
  const [hireStep, setHireStep] = useState<HireStep>(null);
  const [hireData, setHireData] = useState<HireData>({ name: '', email: '', msg: '' });

  const initiateHire = () => {
    setHireStep('name');
    setHireData({ name: visitorName || '', email: '', msg: '' });
    addLine({ type: 'output', text: ` <span class="t-cyan font-bold">--- HIRE WIZARD ---</span>` });
    addLine({
      type: 'output',
      text: ` <span class="t-dim">Let's get some basic details. Type 'cancel' at any time to abort.</span>`,
    });
    if (visitorName) {
      addLine({
        type: 'output',
        text: ` <span class="t-dim">I see you're already registered as ${visitorName}. Press Enter to keep this name, or type a new one.</span>`,
      });
    }
    addLine({ type: 'output', text: `\\n <span class="t-green">What is your name / company name?</span>` });
  };

  const processHireInput = async (cmd: string) => {
    if (cmd.toLowerCase() === 'cancel') {
      setHireStep(null);
      addLine({ type: 'output', text: ` <span class="t-red">Hire wizard cancelled.</span>` });
      return;
    }

    if (hireStep === 'name') {
      const name = cmd || visitorName;
      if (!name) {
        addLine({ type: 'output', text: ` <span class="t-red">Name is required. Please enter your name:</span>` });
        return;
      }
      setHireData((prev) => ({ ...prev, name }));
      setHireStep('email');
      addLine({ type: 'output', text: ` <span class="t-green">What is your email address?</span>` });
    } else if (hireStep === 'email') {
      if (!cmd || !cmd.includes('@')) {
        addLine({ type: 'output', text: ` <span class="t-red">Please enter a valid email address:</span>` });
        return;
      }
      setHireData((prev) => ({ ...prev, email: cmd }));
      setHireStep('msg');
      addLine({
        type: 'output',
        text: ` <span class="t-green">What would you like to discuss?</span> <span class="t-dim">(e.g. project details, full-time role)</span>`,
      });
    } else if (hireStep === 'msg') {
      if (!cmd) {
        addLine({ type: 'output', text: ` <span class="t-red">Message cannot be empty:</span>` });
        return;
      }
      setHireData((prev) => ({ ...prev, msg: cmd }));
      setHireStep('ok');
      addLine({
        type: 'output',
        text: `\\n <span class="t-cyan font-bold">--- REVIEW ---</span>\\n <span class="t-dim">Name:</span>  ${hireData.name || visitorName}\\n <span class="t-dim">Email:</span> ${hireData.email || cmd}\\n <span class="t-dim">Msg:</span>   ${sanitizeHTML(cmd)}\\n\\n <span class="t-green">Send this message? (y/n)</span>`,
      });
    } else if (hireStep === 'ok') {
      if (cmd.toLowerCase() === 'y' || cmd.toLowerCase() === 'yes') {
        setHireStep(null);
        addLine({ type: 'output', text: ` <span class="t-dim">Sending secure transmission...</span>` });
        try {
          await supabase.from('messages').insert([hireData]);
          // Notify via Inngest + Resend
          const API_URL = import.meta.env.DEV ? 'https://dino-s-portfolio.vercel.app' : '';
          fetch(`${API_URL}/api/notifications/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'hire', ...hireData }),
          }).catch(() => {});

          addLine({
            type: 'output',
            text: ` <span class="t-green font-bold">✓ Message delivered successfully.</span>\\n <span class="t-dim">Rakesh will get back to you shortly at ${sanitizeHTML(hireData.email)}.</span>`,
          });
        } catch {
          addLine({
            type: 'output',
            text: ` <span class="t-red">✗ Transmission failed.</span> <span class="t-dim">Please email me directly at rakeshsarkar9711@gmail.com</span>`,
          });
        }
      } else {
        setHireStep(null);
        addLine({ type: 'output', text: ` <span class="t-red">Message discarded.</span>` });
      }
    }
  };

  return { hireStep, initiateHire, processHireInput };
}
