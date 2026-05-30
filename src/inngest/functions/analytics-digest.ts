import { inngest } from '../client';
import { Resend } from 'resend';
import { neon } from '@neondatabase/serverless';

const resend = new Resend(process.env.RESEND_API_KEY);

// Runs daily at 8:00 AM IST (2:30 AM UTC) — sends analytics digest to owner
export const analyticsDigest = inngest.createFunction(
  {
    id: 'daily-analytics-digest',
    name: 'Daily Analytics Digest',
    retries: 2,
    triggers: [{ cron: '30 2 * * *' }], // 8:00 AM IST = 2:30 AM UTC
  },
  async ({ step }: { step: any }) => {
    // Step 1: Gather yesterday's stats from Neon DB
    const stats = await step.run('fetch-neon-stats', async () => {
      const sql = neon(process.env.NEON_DATABASE_URL!);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      const [viewRow] = await sql`
        SELECT count FROM page_views WHERE view_date = ${dateStr}
      `;

      const topCommands = await sql`
        SELECT event_type, COUNT(*) as count
        FROM analytics_events
        WHERE created_at >= NOW() - INTERVAL '1 day'
          AND event_type = 'command'
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 10
      `;

      const newEvents = await sql`
        SELECT event_type, COUNT(*) as count
        FROM analytics_events
        WHERE created_at >= NOW() - INTERVAL '1 day'
        GROUP BY event_type
        ORDER BY count DESC
      `;

      return {
        date: dateStr,
        pageViews: viewRow?.count ?? 0,
        events: newEvents,
        topCommands,
      };
    });

    // Step 2: Send digest email
    const { data, error } = await step.run('send-digest-email', async () => {
      const eventRows = stats.events
        .map((e: any) => `<tr><td style="padding:8px 16px;color:#8ab4c4">${e.event_type}</td><td style="padding:8px 16px;color:#D7E2EA;text-align:right">${e.count}</td></tr>`)
        .join('');

      return resend.emails.send({
        from: 'Portfolio Analytics <digest@rakesh.dev>',
        to: ['rakeshsarkar9711@gmail.com'],
        subject: `📊 Daily Portfolio Digest — ${stats.date}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Courier New', monospace; background: #0C0C0C; color: #D7E2EA; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 40px auto; background: #111; border: 1px solid #1e3a4a; border-radius: 16px; overflow: hidden; }
              .header { background: linear-gradient(135deg, #1a0a2e, #16213e, #0f3460); padding: 32px; text-align: center; }
              .header h1 { color: #a855f7; font-size: 24px; margin: 0; }
              .header p { color: #6b7280; margin: 8px 0 0; font-size: 14px; }
              .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 24px 32px; }
              .stat-card { background: #1a1a1a; border: 1px solid #1e3a4a; border-radius: 12px; padding: 20px; text-align: center; }
              .stat-value { font-size: 36px; font-weight: bold; color: #a855f7; }
              .stat-label { font-size: 12px; color: #6b8899; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
              .section { padding: 0 32px 24px; }
              .section h3 { color: #6b8899; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #1e3a4a; padding-bottom: 12px; }
              table { width: 100%; border-collapse: collapse; }
              tr:nth-child(even) { background: #0d0d0d; }
              .footer { padding: 20px 32px; text-align: center; color: #3a5a6a; font-size: 12px; border-top: 1px solid #1e3a4a; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📊 DAILY ANALYTICS DIGEST</h1>
                <p>${stats.date} · rakesh.dev</p>
              </div>
              <div class="stat-grid">
                <div class="stat-card">
                  <div class="stat-value">${stats.pageViews}</div>
                  <div class="stat-label">Page Views</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${stats.events.reduce((a: number, e: any) => a + parseInt(e.count), 0)}</div>
                  <div class="stat-label">Events Logged</div>
                </div>
              </div>
              <div class="section">
                <h3>Event Breakdown</h3>
                <table>
                  <tbody>${eventRows || '<tr><td colspan="2" style="padding:16px;color:#4a6a7a;text-align:center">No events recorded</td></tr>'}</tbody>
                </table>
              </div>
              <div class="footer">
                Automated daily digest · rakesh.dev terminal portfolio<br>
                Powered by Inngest + Neon DB + Resend
              </div>
            </div>
          </body>
          </html>
        `,
      });
    });

    if (error) {
      throw new Error(`Failed to send digest: ${error.message}`);
    }

    return { success: true, date: stats.date, emailId: data?.id };
  }
);
