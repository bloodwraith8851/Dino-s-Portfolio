import { useEffect } from 'react';
import { trackEvent } from '../lib/neon';

/**
 * Fires a single `page_view` analytics event to the Neon DB edge function
 * on mount.  Uses the stored visitor alias when available, falls back to
 * `'anonymous'`.
 */
export function usePageTracking(): void {
  useEffect(() => {
    const trackView = async () => {
      const stored = localStorage.getItem('visitorName');
      await trackEvent({
        event_type: 'page_view',
        visitor_alias: stored ?? 'anonymous',
        metadata: {
          referrer: document.referrer,
          ua: navigator.userAgent.substring(0, 80),
        },
      });
    };
    trackView();
  }, []);
}
