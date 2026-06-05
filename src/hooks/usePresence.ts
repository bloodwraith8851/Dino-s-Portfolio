import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { VisitorPresence } from '../vite-env';

/**
 * Geo-IP data cached on the window for re-use by identity updates.
 * Stored separately from VisitorPresence so it survives re-tracks.
 */
interface GeoData {
  ip: string;
  city: string;
  org: string;
  lat: number;
  lng: number;
}

/**
 * Sets up the Supabase Realtime presence channel that tracks all active
 * visitors.  On subscription it performs a three-step geo-IP resolution:
 *
 *  1. ipify.org  — gets the raw public IP (most reliable, CORS-safe)
 *  2. ipinfo.io  — enriches with city / org / lat-lng
 *  3. ipapi.co   — fallback if ipinfo.io fails or rate-limits
 *
 * The resolved data is stored on `window.__GEO_DATA__` so that subsequent
 * `identity_updated` events can re-track with the same geo payload without
 * performing additional API calls.
 *
 * Cleans up by removing the Supabase channel and the DOM event listener on
 * unmount.
 */
export function usePresence(): void {
  useEffect(() => {
    const channel = supabase.channel('global_visitors');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        let total = 0;
        const presences: VisitorPresence[] = [];
        for (const id in state) {
          total += state[id].length;
          // Supabase types presenceState as {presence_ref: string}[];
          // cast through unknown because the actual runtime shape is our tracked payload.
          presences.push(...(state[id] as unknown as VisitorPresence[]));
        }
        window.__ACTIVE_VISITORS__ = Math.max(1, total);
        window.__VISITOR_PRESENCE__ = presences;
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;

        const stored = localStorage.getItem('visitorName');
        let alias = stored ?? 'Anonymous Node';
        let ip = 'Unknown';
        let city = 'Unknown';
        let org = 'ISP';
        let lat = 0;
        let lng = 0;

        try {
          // Step 1: resolve public IP via ipify (reliable, no rate limit)
          const ipRes = await fetch('https://api.ipify.org?format=json');
          const ipData = (await ipRes.json()) as { ip?: string };
          if (ipData.ip) ip = ipData.ip;

          try {
            // Step 2: enrich with ipinfo.io
            const geoRes = await fetch(`https://ipinfo.io/${ip}/json`);
            const geoData = (await geoRes.json()) as {
              city?: string;
              org?: string;
              loc?: string;
            };
            if (geoData.city) city = geoData.city;
            if (geoData.org) org = geoData.org.replace(/^AS\d+\s/, '').substring(0, 15);
            if (geoData.loc) {
              const [lt, lg] = geoData.loc.split(',');
              lat = parseFloat(lt);
              lng = parseFloat(lg);
            }
          } catch {
            // Step 3: fallback to ipapi.co if ipinfo.io fails / rate-limits
            try {
              const geoRes2 = await fetch(`https://ipapi.co/${ip}/json/`);
              const geoData2 = (await geoRes2.json()) as {
                city?: string;
                org?: string;
                latitude?: string | number;
                longitude?: string | number;
              };
              if (geoData2.city) city = geoData2.city;
              if (geoData2.org) org = geoData2.org.substring(0, 15);
              if (geoData2.latitude) lat = parseFloat(String(geoData2.latitude));
              if (geoData2.longitude) lng = parseFloat(String(geoData2.longitude));
            } catch {
              // Both geo providers failed — continue with defaults
            }
          }

          // Cache geo data so identity_updated handler can re-use it
          const geoData: GeoData = { ip, city, org, lat, lng };
          window.__GEO_DATA__ = geoData;
          if (!stored && city !== 'Unknown') alias = `${city} Visitor`;
        } catch {
          // ipify itself failed — continue with all defaults
        }

        await channel.track({
          alias,
          online_at: new Date().toISOString(),
          ip,
          city,
          org,
          lat,
          lng,
        });
      });

    // Listen for identity updates dispatched by the terminal's `identify` command
    const handleIdentity = async (e: Event) => {
      if (channel.state !== 'joined') return;
      const geo: GeoData = window.__GEO_DATA__ ?? {
        ip: 'Unknown',
        city: 'Unknown',
        org: 'ISP',
        lat: 0,
        lng: 0,
      };
      const customEvent = e as CustomEvent<string>;
      await channel.track({
        alias: customEvent.detail,
        online_at: new Date().toISOString(),
        ip: geo.ip,
        city: geo.city,
        org: geo.org,
        lat: geo.lat,
        lng: geo.lng,
      });
    };

    window.addEventListener('identity_updated', handleIdentity);

    return () => {
      window.removeEventListener('identity_updated', handleIdentity);
      supabase.removeChannel(channel);
    };
  }, []);
}
