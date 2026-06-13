/**
 * Inngest function: Stale message follow-up reminder
 *
 * Runs every day at 9:00 AM IST (3:30 AM UTC).
 * Checks for hire request messages that are still 'new' after 48 hours
 * and emails you a reminder so no leads go cold.
 */
import { inngest } from '../client';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const staleMessageReminder = inngest.createFunction(
  {
    id: 'stale-message-reminder',
    name: 'Stale Hire Request Reminder',
    retries: 2,
    triggers: [{ cron: '30 3 * * *' }], // 9:00 AM IST = 3:30 AM UTC
  },
  async ({ step }: { step: any }) => {
    // Step 1: Query Supabase for unanswered messages older than 48 hours
    const staleMessages = await step.run('fetch-stale-messages', async () => {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) return [];

      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const res = await fetch(
        `${supabaseUrl}/rest/v1/messages?status=eq.new&created_at=lt.${encodeURIComponent(cutoff)}&select=id,name,email,msg,created_at&order=created_at.asc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        },
      );

      if (!res.ok) return [];
      return res.json();
    });

    // Step 2: Skip if no stale messages
    if (!staleMessages || staleMessages.length === 0) {
      return { skipped: true, reason: 'No stale messages' };
    }

    // Step 3: Send reminder email
    const { data, error } = await step.run('send-reminder-email', async () => {
      const messageRows = staleMessages
        .map(
          (m: { name: string; email: string; msg: string; created_at: string }) => `
          <tr>
            <td style="padding:10px 16px;color:#D7E2EA;border-bottom:1px solid #1e3a4a">${m.name}</td>
            <td style="padding:10px 16px;color:#79c0ff;border-bottom:1px solid #1e3a4a">
              <a href="mailto:${m.email}" style="color:#79c0ff">${m.email}</a>
            </td>
            <td style="padding:10px 16px;color:#8b949e;border-bottom:1px solid #1e3a4a;font-size:12px">
              ${new Date(m.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </td>
          </tr>
        `,
        )
        .join('');

      return resend.emails.send({
        from: 'Portfolio Terminal <onboarding@resend.dev>',
        to: ['rakeshsarkar9711@gmail.com'],
        subject: `⏰ ${staleMessages.length} unanswered hire request${staleMessages.length > 1 ? 's' : ''} — follow up now`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Courier New', monospace; background: #0C0C0C; color: #D7E2EA; margin: 0; padding: 0; }
              .container { max-width: 640px; margin: 40px auto; background: #111; border: 1px solid #3a1e1e; border-radius: 12px; overflow: hidden; }
              .header { background: linear-gradient(135deg, #1f0a0a, #3a1515, #2a0f0f); padding: 28px 32px; }
              .header h1 { color: #f47067; font-size: 20px; margin: 0; letter-spacing: 2px; }
              .header p { color: #6b8899; margin: 6px 0 0; font-size: 13px; }
              .body { padding: 24px 32px; }
              .body p { color: #D7E2EA; font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th { padding: 10px 16px; text-align: left; color: #6b8899; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #1e3a4a; }
              .cta { margin: 24px 0; text-align: center; }
              .cta a { background: #f47067; color: #000; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; }
              .footer { padding: 16px 32px; border-top: 1px solid #1e3a4a; text-align: center; color: #3a5a6a; font-size: 11px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ FOLLOW UP NEEDED</h1>
                <p>${staleMessages.length} hire request${staleMessages.length > 1 ? 's' : ''} unanswered for 48+ hours</p>
              </div>
              <div class="body">
                <p>These leads reached out through your portfolio terminal and haven't heard back yet. Don't let them go cold.</p>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>${messageRows}</tbody>
                </table>
                <div class="cta">
                  <a href="mailto:${staleMessages[0]?.email}">Reply to the oldest lead →</a>
                </div>
              </div>
              <div class="footer">rakesh.dev terminal portfolio · daily follow-up reminder</div>
            </div>
          </body>
          </html>
        `,
      });
    });

    if (error) throw new Error(`Failed to send reminder: ${error.message}`);
    return { success: true, staleCount: staleMessages.length, emailId: data?.id };
  },
);
