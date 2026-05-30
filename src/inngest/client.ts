import { Inngest } from 'inngest';

// Inngest client — shared between the webhook handler and all functions
export const inngest = new Inngest({
  id: 'rakesh-portfolio',
  name: "Rakesh's Portfolio",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
