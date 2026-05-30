/**
 * Neon DB analytics client (thin wrapper over fetch to Edge API route)
 * Used by browser-side components to log analytics events without
 * exposing the Neon connection string to the client.
 */

interface TrackOptions {
  event_type?: string;
  metadata?: Record<string, any>;
  visitor_alias?: string;
}

export async function trackEvent(options: TrackOptions = {}): Promise<void> {
  const { event_type = 'page_view', metadata = {}, visitor_alias = 'anonymous' } = options;

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type, metadata, visitor_alias }),
      // Don't block page rendering — fire and forget
      keepalive: true,
    });
  } catch {
    // Silently fail — analytics should never break the app
  }
}
