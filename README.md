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

## Development Commands

We maintain a strict CI/CD pipeline and code quality standard. The following npm scripts are available:

- `npm run dev` — Starts the Vite development server.
- `npm run build` — Builds the production bundle (with rollup-plugin-visualizer analytics).
- `npm run lint` — Runs ESLint to check for strict typing violations (configured for 0 warnings).
- `npm run typecheck` — Runs the TypeScript compiler to strictly check types without emitting files.
- `npm run test` — Runs the unit test suite using Vitest.
- `npm run test:e2e` — Runs end-to-end browser tests using Playwright.
- `npm run knip` — Runs dead-code analysis to find unused files, dependencies, and exports.
- `npm run prepare` — Automatically installs Husky git hooks.

## Terminal Commands

The portfolio features a fully interactive custom terminal. Below is the complete list of supported commands you can execute in the terminal interface:

### General & Contact
- `help` — Opens the main help menu categorizing all commands.
- `about` — Displays information about Rakesh.
- `contact` — Shows email, phone, and direct contact details.
- `social` — Lists external social media and professional links (LinkedIn, GitHub).
- `skills` — Prints a matrix of technical skills and languages.
- `hire` — Initiates the multi-step interactive wizard to send a secure job inquiry or message.
- `clear` / `cls` — Clears the terminal screen.

### Multiplayer & Interactive
- `snake` — Launches an interactive, playable terminal Snake game.
- `topscores` — Displays the global high-score leaderboard for the Snake game.
- `map` — Opens a 3D WebGL globe plotting live global visitor locations.
- `chat` — Connects to the real-time global multiplayer chat room.
- `who` — Lists all currently active concurrent visitors on the site.
- `sign [message]` — Carves a permanent signature into the public guestbook.
- `guestbook` — Fetches and reads recent entries from the public guestbook.
- `polls` — Views active community polls and current vote distributions.
- `vote [poll_id] [option_id]` — Casts a live vote on an active community poll.
- `echo [text]` — Prints text back to the terminal screen.
- `calc [expression]` — Evaluates a mathematical expression.

### System & Diagnostics
- `neofetch` — Prints detailed system, host, and kernel information in a classic neofetch layout.
- `status` — Pings the edge API to view server health, latency, and uptime metrics.
- `stats` — Displays live dashboard metrics including database rows and cache size.
- `commits` — Fetches and displays recent live deployment commits from GitHub.
- `history` — Shows your local command execution history.
- `time` / `date` — Displays the current system time and date.

### Easter Eggs & Fun
- `hack` — Triggers an elaborate, simulated ransomware / mainframe hacking sequence.
- `matrix` — Enters the Matrix (dynamic green text raining simulation).
- `github` — Fetches live GitHub profile stats and repository counts.
- `crypto` — Fetches live cryptocurrency prices from CoinGecko.
- `news` — Retrieves the top headlines from HackerNews.
- `weather` — Checks the current real-world weather forecast based on IP geolocation.
- `joke` — Tells a random programming joke.
- `trivia` — Provides a random piece of tech trivia.
- `quote` — Displays an inspirational tech or programming quote.
- `pokemon` — Catches and displays a random Pokémon via the PokéAPI.
- `coffee` — Brews a virtual cup of coffee.
- `flip` — Flips a virtual table in frustration.
- `sudo hire` — Triggers an Easter egg override of the hire flow.

### Admin Tools
*(Requires authentication via `su` or `admin` command)*
- `stats` — Real-time traffic and analytics overview.
- `logs` — Tails the live server event stream.
- `watch` — Connects to the live global database feed via webhook.
- `telemetry` — Views visitor command execution history.
- `users` — Views detailed active connections.
- `top` — Simulated task manager.
- `deploy` — Triggers a simulated production build.
- `config` — Views system configuration variables.
- `set [key] [value]` — Updates global remote settings (e.g., MOTD).
- `ban [ip]` — Blacklists an IP address from the terminal.
- `logout` — Ends the active admin session.

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
