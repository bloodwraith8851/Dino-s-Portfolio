[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bloodwraith8851/Dino-s-Portfolio)

# Rakesh Sarkar — Terminal Portfolio

A cinematic, dark-themed developer portfolio featuring an interactive terminal interface, multi-step hire wizard, global chat room, and hidden easter eggs.

## Features

- **Interactive Terminal**: Custom-built shell with 30+ interactive commands.
- **Global Chat**: Real-time multiplayer chat using Supabase broadcast channels.
- **Hire Wizard**: Multi-step terminal flow to send secure messages.
- **Dynamic Guestbook**: Public guestbook with realtime notifications.
- **Live Diagnostics**: Server health metrics, live visitor tracking, and logs.
- **Easter Eggs**: ASCII art, a hidden snake game, and an elaborate ransomware simulation.
- **API Integrations**: Live data from GitHub, CoinGecko, HackerNews, and more.

## Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | React 18, Vite 5, TypeScript | Core application framework |
| **Styling** | Tailwind CSS, Framer Motion | Utilities, parallax, animations |
| **3D/Mapping** | three.js, react-globe.gl | Interactive visitor map |
| **Database** | Supabase, Neon (PostgreSQL) | Persistence and realtime events |
| **Caching/Rate Limits**| Upstash Redis | API rate limiting and edge caching |
| **Background Jobs** | Inngest | Asynchronous event processing |
| **Email** | Resend | Transactional notifications |
| **Authentication** | jose (JWT) | Admin dashboard security |

## Prerequisites

- Node.js 18+
- npm or pnpm
- Vercel CLI (optional, for edge functions)

## Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/bloodwraith8851/Dino-s-Portfolio.git
   cd Dino-s-Portfolio
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in the required variables (see below)
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development server**
   - For frontend only:
     ```bash
     npm run dev
     ```
   - For full stack (including `/api/*` edge functions):
     ```bash
     npx vercel dev
     ```

## Environment Variables

See \`.env.example\` for the full list. Key required variables include:
- \`VITE_SUPABASE_URL\` / \`VITE_SUPABASE_ANON_KEY\` (Supabase DB)
- \`NEON_DATABASE_URL\` (Analytics)
- \`UPSTASH_REDIS_REST_URL\` / \`UPSTASH_REDIS_REST_TOKEN\` (Rate limiting)
- \`JWT_SECRET\` / \`ADMIN_PASSWORD\` (Admin auth)

## Architecture

The project is structured as a SPA (Single Page Application) backed by serverless edge functions.
- **\`src/\`**: React components, hooks, and terminal modules. The \`ContactSection\` acts as the terminal host, while \`src/terminal/\` contains the isolated command processor, hooks, and UI components.
- **\`api/\`**: Vercel Edge Functions providing secure endpoints for authentication, analytics tracking, and notifications.
- **\`src/inngest/\`**: Background job handlers triggered by the edge functions.

## Deployment

The project is pre-configured for deployment on Vercel. Push to the \`main\` branch to trigger a production build. The \`vercel.json\` file manages routing and security headers.

## License

MIT
