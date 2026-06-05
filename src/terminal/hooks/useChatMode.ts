import { useState, useEffect, useRef } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AddLine } from '../types';
import { sanitizeHTML } from '../sanitize';

/** Payload shape broadcast over the global_chat_room channel. */
interface ChatPayload {
  payload: {
    alias: string;
    text: string;
  };
}

/**
 * Manages the global real-time chat mode for the terminal.
 * Subscribes to / unsubscribes from the Supabase broadcast channel
 * based on the `isChatMode` state flag.
 *
 * @param addLine     - Terminal line appender.
 * @param supabase    - Typed Supabase client instance.
 * @param visitorName - Current visitor alias shown in outgoing messages.
 */
export function useChatMode(addLine: AddLine, supabase: SupabaseClient, visitorName: string) {
  const [isChatMode, setIsChatMode] = useState(false);
  const chatChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (isChatMode && !chatChannelRef.current) {
      const channel = supabase
        .channel('global_chat_room')
        .on('broadcast', { event: 'chat_msg' }, (payload: ChatPayload) => {
          if (payload.payload.alias !== visitorName) {
            addLine({
              type: 'output',
              text: ` <span class="t-cyan font-bold">${sanitizeHTML(payload.payload.alias)}:</span> <span class="t-white">${sanitizeHTML(payload.payload.text)}</span>`,
            });
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            addLine({ type: 'output', text: ` <span class="t-green">✓ Connected to global chat.</span>` });
          }
        });
      chatChannelRef.current = channel;
    } else if (!isChatMode && chatChannelRef.current) {
      supabase.removeChannel(chatChannelRef.current);
      chatChannelRef.current = null;
    }
  }, [isChatMode, supabase, visitorName, addLine]);

  const enterChat = () => {
    setIsChatMode(true);
    addLine({
      type: 'output',
      text: ` <span class="t-dim">Connecting to global chat channel...</span>\\n <span class="t-dim">Type 'exit' or 'quit' to leave chat mode.</span>`,
    });
  };

  const processChatInput = async (cmd: string) => {
    if (cmd.toLowerCase() === 'exit' || cmd.toLowerCase() === 'quit') {
      setIsChatMode(false);
      addLine({ type: 'output', text: ` <span class="t-dim">Left global chat.</span>` });
      return;
    }
    if (!cmd.trim()) return;

    addLine({
      type: 'output',
      text: ` <span class="t-green font-bold">You:</span> <span class="t-white">${sanitizeHTML(cmd)}</span>`,
    });
    if (chatChannelRef.current) {
      await chatChannelRef.current.send({
        type: 'broadcast',
        event: 'chat_msg',
        payload: { alias: visitorName, text: cmd },
      });
    }
  };

  return { isChatMode, enterChat, processChatInput };
}
