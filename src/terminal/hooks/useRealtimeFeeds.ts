import { useState, useEffect } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AddLine } from '../types';
import { sanitizeHTML } from '../sanitize';

/** Shape of a command_logs INSERT row from Supabase realtime. */
interface CommandLogPayload {
  new: { created_at: string; command: string };
}

/** Shape of a guestbook or messages INSERT row from Supabase realtime. */
interface FeedPayload {
  eventType: string;
  new: { visitor_alias?: string; name?: string };
}

/**
 * Subscribes to two optional Supabase realtime feeds:
 * - `log_tail`: streams new command_logs rows as they are inserted.
 * - `global_feed`: streams guestbook and messages inserts.
 *
 * Both feeds are opt-in via `toggleLogs` / `toggleWatch`.
 *
 * @param addLine  - Terminal line appender.
 * @param supabase - Typed Supabase client instance.
 */
export function useRealtimeFeeds(addLine: AddLine, supabase: SupabaseClient) {
  const [isTailingLogs, setIsTailingLogs] = useState(false);
  const [isWatchingDb, setIsWatchingDb] = useState(false);

  useEffect(() => {
    let logSub: ReturnType<typeof supabase.channel> | null = null;
    let dbSub: ReturnType<typeof supabase.channel> | null = null;

    if (isTailingLogs) {
      logSub = supabase
        .channel('log_tail')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'command_logs' },
          (payload: CommandLogPayload) => {
            addLine({
              type: 'output',
              text: ` <span class="t-dim">[${new Date(payload.new.created_at).toLocaleTimeString()}]</span> <span class="t-cyan">VISITOR</span> <span class="t-green">executed:</span> <span class="t-white">${sanitizeHTML(payload.new.command)}</span>`,
            });
          },
        )
        .subscribe();
    }

    if (isWatchingDb) {
      dbSub = supabase
        .channel('global_feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'guestbook' }, (payload: FeedPayload) => {
          if (payload.eventType === 'INSERT') {
            addLine({
              type: 'output',
              text: ` <span class="t-purple font-bold">[WEBHOOK]</span> <span class="t-dim">New guestbook signature from</span> <span class="t-cyan">${sanitizeHTML(payload.new.visitor_alias ?? 'Anonymous')}</span>`,
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: FeedPayload) => {
          if (payload.eventType === 'INSERT') {
            addLine({
              type: 'output',
              text: ` <span class="t-red font-bold">[SECURE]</span> <span class="t-dim">New incoming message from</span> <span class="t-cyan">${sanitizeHTML(payload.new.name ?? 'Unknown')}</span>`,
            });
          }
        })
        .subscribe();
    }

    return () => {
      if (logSub) supabase.removeChannel(logSub);
      if (dbSub) supabase.removeChannel(dbSub);
    };
  }, [isTailingLogs, isWatchingDb, supabase, addLine]);

  const toggleLogs = () => {
    setIsTailingLogs((prev) => {
      const next = !prev;
      addLine({
        type: 'output',
        text: ` <span class="t-${next ? 'green' : 'dim'}">Live telemetry tailing ${next ? 'enabled' : 'disabled'}.</span>`,
      });
      return next;
    });
  };

  const toggleWatch = (state?: boolean) => {
    setIsWatchingDb((prev) => {
      const next = state !== undefined ? state : !prev;
      addLine({
        type: 'output',
        text: ` <span class="t-${next ? 'green' : 'dim'}">Global database webhook feed ${next ? 'enabled' : 'disabled'}.</span>`,
      });
      return next;
    });
  };

  const disableAll = () => {
    setIsTailingLogs(false);
    setIsWatchingDb(false);
  };

  return { isTailingLogs, isWatchingDb, toggleLogs, toggleWatch, disableAll };
}
