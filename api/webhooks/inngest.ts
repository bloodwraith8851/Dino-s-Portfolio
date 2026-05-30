import { serve } from 'inngest/edge';
import { inngest } from '../../src/inngest/client';
import { notifyGuestbook } from '../../src/inngest/functions/notify-guestbook';
import { notifyHire } from '../../src/inngest/functions/notify-hire';
import { analyticsDigest } from '../../src/inngest/functions/analytics-digest';

export const config = { runtime: 'edge' };

// Inngest v4 Edge handler — serve() returns a Request→Response handler directly.
// signingKey is automatically read from INNGEST_SIGNING_KEY env var (no need to pass explicitly).
// Do NOT destructure { GET, POST, PUT } — that pattern is Next.js App Router only.
export default serve({
  client: inngest,
  functions: [notifyGuestbook, notifyHire, analyticsDigest],
});
