import { useState, useEffect } from 'react';
import type { AddLine } from '../types';
import { sanitizeHTML } from '../sanitize';

export function useRealtimeFeeds(addLine: AddLine, supabase: any) {
  const [isTailingLogs, setIsTailingLogs] = useState(false);
  const [isWatchingDb, setIsWatchingDb] = useState(false);

  useEffect(() => {
    let logSub: any = null;
    let dbSub: any = null;

    if (isTailingLogs) {
      logSub = supabase.channel('log_tail')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'command_logs' }, (payload: any) => {
          addLine({ 
            type: 'output', 
            text: ` <span class="t-dim">[${new Date(payload.new.created_at).toLocaleTimeString()}]</span> <span class="t-cyan">VISITOR</span> <span class="t-green">executed:</span> <span class="t-white">${sanitizeHTML(payload.new.command)}</span>` 
          });
        })
        .subscribe();
    }

    if (isWatchingDb) {
      dbSub = supabase.channel('global_feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'guestbook' }, (payload: any) => {
          if (payload.eventType === 'INSERT') {
            addLine({ 
              type: 'output', 
              text: ` <span class="t-purple font-bold">[WEBHOOK]</span> <span class="t-dim">New guestbook signature from</span> <span class="t-cyan">${sanitizeHTML(payload.new.visitor_alias)}</span>` 
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
          if (payload.eventType === 'INSERT') {
            addLine({ 
              type: 'output', 
              text: ` <span class="t-red font-bold">[SECURE]</span> <span class="t-dim">New incoming message from</span> <span class="t-cyan">${sanitizeHTML(payload.new.name)}</span>` 
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
    setIsTailingLogs(prev => {
      const next = !prev;
      addLine({ type: 'output', text: ` <span class="t-${next ? 'green' : 'dim'}">Live telemetry tailing ${next ? 'enabled' : 'disabled'}.</span>` });
      return next;
    });
  };

  const toggleWatch = (state?: boolean) => {
    setIsWatchingDb(prev => {
      const next = state !== undefined ? state : !prev;
      addLine({ type: 'output', text: ` <span class="t-${next ? 'green' : 'dim'}">Global database webhook feed ${next ? 'enabled' : 'disabled'}.</span>` });
      return next;
    });
  };

  const disableAll = () => {
    setIsTailingLogs(false);
    setIsWatchingDb(false);
  };

  return { isTailingLogs, isWatchingDb, toggleLogs, toggleWatch, disableAll };
}
