/// <reference types="vite/client" />

/**
 * A single visitor presence entry tracked via Supabase Realtime.
 * All string fields default to 'Unknown' when geo resolution fails.
 */
export interface VisitorPresence {
  alias: string;
  online_at: string;
  ip: string;
  city: string;
  org: string;
  lat: number;
  lng: number;
}

/**
 * Cached geo-IP data written by usePresence for use by identity_updated
 * handlers without re-fetching.
 */
interface GeoData {
  ip: string;
  city: string;
  org: string;
  lat: number;
  lng: number;
}

declare global {
  interface Window {
    /** Total number of active visitors (minimum 1). */
    __ACTIVE_VISITORS__: number;
    /** Array of all current visitor presence records. */
    __VISITOR_PRESENCE__: VisitorPresence[];
    /** Latest resolved geo-IP data for this visitor. */
    __GEO_DATA__?: GeoData;
    /** Optional message-of-the-day set by admin via the `set motd` command. */
    __MOTD__?: string;
  }
}
