import { inngest } from '../client';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Triggered when someone signs the public guestbook via the terminal
export const notifyGuestbook = inngest.createFunction(
  {
    id: 'notify-guestbook-signature',
    name: 'Guestbook Signature Notification',
    retries: 3,
    triggers: [{ event: 'portfolio/guestbook.signed' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { visitor_alias, message, ip, timestamp } = event.data;

    // Step 1: Send email notification to owner
    const { data, error } = await step.run('send-email-notification', async () => {
      return resend.emails.send({
        from: 'Portfolio Terminal <notifications@rakesh.dev>',
        to: ['rakeshsarkar9711@gmail.com'],
        subject: `✍️ New Guestbook Entry from ${visitor_alias}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Courier New', monospace; background: #0C0C0C; color: #D7E2EA; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 40px auto; background: #111; border: 1px solid #1e3a4a; border-radius: 16px; overflow: hidden; }
              .header { background: linear-gradient(135deg, #0f2027, #203a43, #2c5364); padding: 32px; text-align: center; }
              .header h1 { color: #00d4ff; font-size: 24px; margin: 0; letter-spacing: 2px; }
              .body { padding: 32px; }
              .field { margin-bottom: 20px; }
              .label { color: #6b8899; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
              .value { color: #D7E2EA; font-size: 16px; background: #1a1a1a; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #00d4ff; }
              .footer { padding: 20px 32px; border-top: 1px solid #1e3a4a; text-align: center; color: #3a5a6a; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✍️ NEW GUESTBOOK ENTRY</h1>
              </div>
              <div class="body">
                <div class="field">
                  <div class="label">Visitor</div>
                  <div class="value">${visitor_alias}</div>
                </div>
                <div class="field">
                  <div class="label">Message</div>
                  <div class="value">"${message}"</div>
                </div>
                <div class="field">
                  <div class="label">Timestamp</div>
                  <div class="value">${new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
                </div>
                <div class="field">
                  <div class="label">IP Address</div>
                  <div class="value">${ip}</div>
                </div>
              </div>
              <div class="footer">rakesh.dev terminal portfolio · automated notification</div>
            </div>
          </body>
          </html>
        `,
      });
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, emailId: data?.id };
  }
);
