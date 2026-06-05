import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Checks whether the current visitor's IP is in the banned_ips table.
 * Retries once after 2 seconds on failure; fails open (allows access) if
 * both attempts throw so a network hiccup never locks out real visitors.
 *
 * @param setIsBanned - State setter received from the parent component.
 */
export function useBanCheck(setIsBanned: (banned: boolean) => void): void {
  useEffect(() => {
    const attemptBanCheck = async (): Promise<void> => {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.ip) {
        const { data: banData } = await supabase.from('banned_ips').select('ip').eq('ip', data.ip).maybeSingle();
        if (banData) {
          setIsBanned(true);
          return;
        }
      }
      setIsBanned(false);
    };

    const checkBan = async () => {
      try {
        await attemptBanCheck();
      } catch {
        // Retry once after 2 seconds before giving up
        try {
          await new Promise((r) => setTimeout(r, 2000));
          await attemptBanCheck();
        } catch {
          // If both attempts fail, allow access (fail-open)
          setIsBanned(false);
        }
      }
    };

    checkBan();
    // setIsBanned is stable (from useState), so it's safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
