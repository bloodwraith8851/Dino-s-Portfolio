/**
 * Inngest function: Notify resume download
 *
 * Triggered when someone downloads your resume via GET /api/resume/download.
 * Sends you a real-time email alert with the visitor's IP, timestamp, and referrer.
 * Retries 3 times on failure.
 */
import { inngest } from '../client';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const notifyResumeDownload = inngest.createFunction(
  {
    id: 'notify-resume-download',
    name: 'Resume Download Alert',
    retries: 3,
    triggers: [{ event: 'portfolio/resume.downloaded' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { ip, user_agent, referrer, timestamp } = event.data;
    const time = new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const { data, error } = await step.run('send-download-alert', async () => {
      return resend.emails.send({
        from: 'Portfolio Terminal <onboarding@resend.dev>',
        to: ['rakeshsarkar9711@gmail.com'],
        subject: `📄 Resume downloaded — ${time} IST`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Courier New', monospace; background: #0C0C0C; color: #D7E2EA; margin: 0; padding: 0; }
              .container { max-width: 560px; margin: 40px auto; background: #111; border: 1px solid #1e3a4a; border-radius: 12px; overflow: hidden; }
              .header { background: linear-gradient(135deg, #0a1628, #0f2540, #162d4a); padding: 28px 32px; }
              .header h1 { color: #79c0ff; font-size: 20px; margin: 0; letter-spacing: 2px; }
              .header p { color: #6b8899; margin: 6px 0 0; font-size: 13px; }
              .body { padding: 28px 32px; }
              .field { margin-bottom: 18px; }
              .label { color: #6b8899; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
              .value { color: #D7E2EA; font-size: 14px; background: #1a1a1a; padding: 10px 14px; border-radius: 6px; border-left: 3px solid #79c0ff; word-break: break-all; }
              .footer { padding: 16px 32px; border-top: 1px solid #1e3a4a; text-align: center; color: #3a5a6a; font-size: 11px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📄 RESUME DOWNLOADED</h1>
                <p>${time} IST · rakesh.dev</p>
              </div>
              <div class="body">
                <div class="field">
                  <div class="label">Visitor IP</div>
                  <div class="value">${ip}</div>
                </div>
                <div class="field">
                  <div class="label">Referrer</div>
                  <div class="value">${referrer || '(direct)'}</div>
                </div>
                <div class="field">
                  <div class="label">User Agent</div>
                  <div class="value">${user_agent || 'unknown'}</div>
                </div>
              </div>
              <div class="footer">rakesh.dev terminal portfolio · resume download alert</div>
            </div>
          </body>
          </html>
        `,
      });
    });

    if (error) throw new Error(`Failed to send download alert: ${error.message}`);
    return { success: true, emailId: data?.id };
  },
);
