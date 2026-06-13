/**
 * POST /api/ai/chat
 *
 * Gemini 2.0 Flash powered chat endpoint grounded in Rakesh's bio.
 * Used by the terminal `chat` command to answer questions about skills,
 * projects, availability, and background.
 *
 * Rate limit: 10 messages per IP per 10 minutes (Redis).
 * Streaming: server-sent events for typewriter effect in the terminal.
 */
import { getRedis, rateLimit } from '../_lib/redis';
import { handlePreflight, json } from '../_lib/cors';

export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are Dino (Rakesh Sarkar's AI assistant) embedded in his portfolio terminal.
You answer visitor questions about Rakesh concisely and in character — professional but friendly, slightly playful.

## About Rakesh
- B.Tech Artificial Intelligence student at IIT Bombay
- Full-stack developer specialising in React, Next.js, TypeScript, Node.js
- GenAI engineer — integrates OpenAI, Gemini, Claude into real products
- Android developer (Kotlin, React Native)
- UI/UX designer (Figma)
- Located in Delhi, India

## Projects
- **Forge** — (personal project, details TBC by Rakesh)
- **LawLab** — legal-tech tool
- **ResumeIQ** — AI-powered resume analyser (OpenAI + Gemini)
- **Notch** — design-focused personal project

## Skills
Languages: Python, TypeScript, JavaScript, Kotlin, Java, C++, SQL
Frameworks: React, Next.js, Node.js, Express, Tailwind CSS, TensorFlow Lite
Tools: Git, Docker, AWS, Firebase, Vercel, Android Studio, Figma
AI/GenAI: OpenAI API, Gemini, Claude, Prompt Engineering, ML

## Availability
Open to internship and full-time opportunities in software engineering, AI/ML engineering, or product design.

## Rules
- Keep answers under 4 sentences unless specifically asked for more detail
- Don't make up specific numbers (salaries, exact GPA, etc.)
- If asked something you don't know, say so and suggest emailing rakeshsarkar9711@gmail.com
- Never claim to be a human — you're an AI assistant
- Don't discuss topics unrelated to Rakesh or his work`;

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handlePreflight();
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return json({ error: 'AI chat is not configured.' }, 503);
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // Rate limit: 10 messages per IP per 10 minutes
  const redis = getRedis();
  const { limited } = await rateLimit(redis, `aichat:${ip}`, 10, 600);
  if (limited) {
    return json({ error: 'Too many messages. Wait a few minutes and try again.' }, 429, { 'Retry-After': '600' });
  }

  let message: string;
  try {
    const body = await req.json();
    message = typeof body.message === 'string' ? body.message.slice(0, 500) : '';
    if (!message.trim()) {
      return json({ error: 'message is required' }, 400);
    }
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  try {
    // Gemini 2.0 Flash via REST API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: message }] }],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7,
            topP: 0.9,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[ai/chat] Gemini error:', errText);
      return json({ error: 'AI service temporarily unavailable.' }, 502);
    }

    const geminiData = (await geminiRes.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      promptFeedback?: { blockReason?: string };
    };

    // Handle content blocked by safety filters
    if (geminiData.promptFeedback?.blockReason) {
      return json({ reply: "I can't answer that one — ask me something about Rakesh's work instead!" }, 200);
    }

    const reply =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      "I'm having trouble thinking right now. Try again or email rakeshsarkar9711@gmail.com.";

    return json({ reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ai/chat] Error:', message);
    return json({ error: 'Internal server error' }, 500);
  }
}
