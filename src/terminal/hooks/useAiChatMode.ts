import { useState } from 'react';
import type { AddLine } from '../types';
import { sanitizeHTML } from '../sanitize';

const API_URL = import.meta.env.DEV ? 'http://localhost:5173' : '';

/**
 * Manages the AI chat mode for the terminal.
 * Communicates with the /api/ai/chat endpoint.
 */
export function useAiChatMode(addLine: AddLine) {
  const [isAiChatMode, setIsAiChatMode] = useState(false);

  const enterAiChat = () => {
    setIsAiChatMode(true);
    addLine({
      type: 'output',
      text: ` <span class="t-dim">Connecting to Dino AI (Gemini 1.5 Flash)...</span>\\n <span class="t-green">✓ Connected. Ask me anything about Rakesh!</span>\\n <span class="t-dim">Type 'exit' or 'quit' to leave AI mode.</span>`,
    });
  };

  const processAiChatInput = async (cmd: string) => {
    if (cmd.toLowerCase() === 'exit' || cmd.toLowerCase() === 'quit') {
      setIsAiChatMode(false);
      addLine({ type: 'output', text: ` <span class="t-dim">Disconnected from Dino AI.</span>` });
      return;
    }
    if (!cmd.trim()) return;

    addLine({
      type: 'output',
      text: ` <span class="t-cyan font-bold">You:</span> <span class="t-white">${sanitizeHTML(cmd)}</span>`,
    });

    addLine({ type: 'output', text: ` <span class="t-dim">Dino is typing...</span>` });

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cmd }),
      });

      const data = await res.json();

      if (!res.ok) {
        addLine({
          type: 'output',
          text: ` <span class="t-red">✗ ${sanitizeHTML(data.error || 'Failed to get response')}</span>`,
        });
        return;
      }

      addLine({
        type: 'output',
        text: ` <span class="t-green font-bold">Dino:</span> <span class="t-white">${sanitizeHTML(data.reply)}</span>`,
      });
    } catch {
      addLine({ type: 'output', text: ` <span class="t-red">✗ Connection error. AI might be sleeping.</span>` });
    }
  };

  return { isAiChatMode, enterAiChat, processAiChatInput };
}
