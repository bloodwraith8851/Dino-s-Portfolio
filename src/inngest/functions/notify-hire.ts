import { inngest } from '../client';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Triggered when someone uses the 'hire' wizard in the terminal
export const notifyHire = inngest.createFunction(
  {
    id: 'notify-hire-message',
    name: 'Hire Request Notification',
    retries: 3,
    triggers: [{ event: 'portfolio/hire.message' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { name, email, message, ip, timestamp } = event.data;

    // Step 1: Send rich hire-request email to owner
    const { data, error } = await step.run('send-hire-email', async () => {
      return resend.emails.send({
        // Use onboarding@resend.dev since the custom domain is not yet verified in Resend
        from: 'Portfolio Terminal <onboarding@resend.dev>',
        to: ['rakeshsarkar9711@gmail.com'],
        replyTo: email,
        subject: `🚀 New Lead: ${name} wants to hire you!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Courier New', monospace; background: #0C0C0C; color: #D7E2EA; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 40px auto; background: #111; border: 1px solid #1e3a4a; border-radius: 16px; overflow: hidden; }
              .header { background: linear-gradient(135deg, #0d1f0f, #1a3a1f, #0f3320); padding: 32px; text-align: center; }
              .header h1 { color: #00ff88; font-size: 24px; margin: 0; letter-spacing: 2px; }
              .badge { display: inline-block; background: #00ff8820; border: 1px solid #00ff88; color: #00ff88; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 8px; }
              .body { padding: 32px; }
              .field { margin-bottom: 24px; }
              .label { color: #6b8899; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
              .value { color: #D7E2EA; font-size: 15px; background: #1a1a1a; padding: 14px 18px; border-radius: 8px; border-left: 3px solid #00ff88; line-height: 1.6; }
              .cta { text-align: center; margin-top: 32px; }
              .cta a { background: #00ff88; color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; letter-spacing: 1px; }
              .footer { padding: 20px 32px; border-top: 1px solid #1e3a4a; text-align: center; color: #3a5a6a; font-size: 12px; }
              .meta { background: #0d0d0d; padding: 16px 32px; border-top: 1px solid #1e3a4a; }
              .meta-row { display: flex; justify-content: space-between; font-size: 12px; color: #4a6a7a; margin-bottom: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚀 NEW HIRE REQUEST</h1>
                <div class="badge">HIGH PRIORITY</div>
              </div>
              <div class="body">
                <div class="field">
                  <div class="label">👤 From</div>
                  <div class="value">${name}</div>
                </div>
                <div class="field">
                  <div class="label">📧 Email</div>
                  <div class="value"><a href="mailto:${email}" style="color:#00d4ff">${email}</a></div>
                </div>
                <div class="field">
                  <div class="label">💬 Message</div>
                  <div class="value">${message}</div>
                </div>
                <div class="cta">
                  <a href="mailto:${email}?subject=Re: Your inquiry via Portfolio Terminal">Reply to ${name} →</a>
                </div>
              </div>
              <div class="meta">
                <div class="meta-row"><span>Received via</span><span>Terminal Portfolio — hire wizard</span></div>
                <div class="meta-row"><span>Timestamp</span><span>${new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span></div>
                <div class="meta-row"><span>Visitor IP</span><span>${ip}</span></div>
              </div>
              <div class="footer">rakesh.dev terminal portfolio · reply directly to this email to respond</div>
            </div>
          </body>
          </html>
        `,
      });
    });

    if (error) {
      throw new Error(`Failed to send hire email: ${error.message}`);
    }

    // Step 2: Send confirmation back to the lead
    // NOTE: This is currently disabled because Resend free tier does not allow sending emails
    // to arbitrary addresses (like the visitor's email) without a verified domain.
    // Once you verify rakesh.dev on Resend, you can uncomment this block.
    /*
    await step.run('send-confirmation-to-lead', async () => {
      return resend.emails.send({
        from: 'Rakesh Sarkar <hello@rakesh.dev>',
        to: [email],
        subject: `Got your message, ${name}! 🙌`,
        html: `...`
      });
    });
    */

    return { success: true, emailId: data?.id, leadEmail: email };
  }
);
