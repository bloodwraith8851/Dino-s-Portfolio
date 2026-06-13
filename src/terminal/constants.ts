/**
 * All static text content, ASCII art, help menus, and boot sequence data
 * for the terminal interface.
 */

/* ─── ASCII art ──────────────────────────────────────────────────── */
const ASCII_NAME = `
 ██████╗  █████╗ ██╗  ██╗███████╗███████╗██╗  ██╗
 ██╔══██╗██╔══██╗██║ ██╔╝██╔════╝██╔════╝██║  ██║
 ██████╔╝███████║█████╔╝ █████╗  ███████╗███████║
 ██╔══██╗██╔══██║██╔═██╗ ██╔══╝  ╚════██║██╔══██║
 ██║  ██║██║  ██║██║  ██╗███████╗███████║██║  ██║
 ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝
`;

/* ─── fun data ───────────────────────────────────────────────────── */

export const FORTUNES = [
  `🔮 <span class="t-purple">You will merge to main on the first try today.</span>`,
  `🔮 <span class="t-purple">A wild bug will appear, but you will catch it swiftly.</span>`,
  `🔮 <span class="t-purple">Your next pull request will receive 0 comments. It's perfect.</span>`,
  `🔮 <span class="t-purple">Today's stack overflow search will yield the answer on the first link.</span>`,
  `🔮 <span class="t-purple">You shall receive an unexpected GitHub star. Rejoice.</span>`,
  `🔮 <span class="t-purple">A recruiter will slide into your DMs. But this one is actually good.</span>`,
  `🔮 <span class="t-purple">You will write code so clean, future-you will thank present-you.</span>`,
];

export const MATRIX_ART = `
 <span class="t-green" style="opacity:0.3">01001000 01100101 01101100 01101100 01101111</span>
 <span class="t-green" style="opacity:0.5">01010111 01101111 01110010 01101100 01100100</span>
 <span class="t-green" style="opacity:0.7">01010100 01101000 01100101 01001101 01100001</span>
 <span class="t-green" style="opacity:0.85">01110100 01110010 01101001 01111000 01001000</span>
 <span class="t-green">01100001 01110011 01011001 01101111 01110101</span>

 <span class="t-green font-bold">Wake up, visitor... The Matrix has you.</span>
 <span class="t-green">Follow the white rabbit. 🐇</span>`;

export const COFFEE_ART = `
      <span class="t-yellow">   ( (
    ) )
  ........
  |      |]
  \\\\      /
   \`----'</span>

 <span class="t-dim">Brewing coffee... ☕</span>
 <span class="t-yellow">Here's a virtual coffee to keep you going!</span>
 <span class="t-dim">Fun fact: This portfolio was fueled by 247 cups of chai.</span>`;

export const FLIP_ART = `
 <span class="t-cyan">╯°□°）╯︵ ┻━┻</span>

 <span class="t-dim">Table flipped! Frustration level: over 9000!</span>
 <span class="t-yellow">┬─┬ ノ( ゜-゜ノ)</span>  <span class="t-dim">...okay, putting it back.</span>`;

/* ─── help menus ─────────────────────────────────────────────────── */

export const HELP_INDEX = `
 <span class="t-dim">Help Menu Categories:</span>
 <span class="t-dim">─────────────────────────────────────────</span>
  <span class="t-cyan">1.</span> <span class="t-yellow">General & Contact</span>     <span class="t-dim">→</span> Basic commands & info
  <span class="t-cyan">2.</span> <span class="t-yellow">Multiplayer & Chat</span>    <span class="t-dim">→</span> Games, chat, guestbook
  <span class="t-cyan">3.</span> <span class="t-yellow">System & CI/CD</span>        <span class="t-dim">→</span> Diagnostics & logs
  <span class="t-cyan">4.</span> <span class="t-yellow">Easter Eggs</span>           <span class="t-dim">→</span> Hidden secrets
 <span class="t-dim">─────────────────────────────────────────</span>`;

export const HELP_GENERAL = `
 <span class="t-dim">General & Contact:</span>
 <span class="t-dim">─────────────────────────────────────────</span>
  <span class="t-green">about</span>       <span class="t-dim">→</span> Who is Rakesh?
  <span class="t-green">contact</span>     <span class="t-dim">→</span> Show contact details
  <span class="t-green">social</span>      <span class="t-dim">→</span> Social media links
  <span class="t-green">skills</span>      <span class="t-dim">→</span> Technical skills
  <span class="t-green">hire</span>        <span class="t-dim">→</span> Send a message
  <span class="t-green">clear</span>       <span class="t-dim">→</span> Clear terminal
 <span class="t-dim">─────────────────────────────────────────</span>`;

export const HELP_INTERACTIVE = `
 <span class="t-dim">Multiplayer & Interactive:</span>
 <span class="t-dim">─────────────────────────────────────────</span>
  <span class="t-cyan">snake</span>       <span class="t-dim">→</span> Play terminal Snake
  <span class="t-cyan">topscores</span>   <span class="t-dim">→</span> View global Snake leaderboard
  <span class="t-cyan">map</span>         <span class="t-dim">→</span> Live visitor world map 🗺️
  <span class="t-cyan">polls</span>       <span class="t-dim">→</span> View community polls
  <span class="t-cyan">vote [p] [o]</span><span class="t-dim">→</span> Vote on a poll
  <span class="t-cyan">chat</span>        <span class="t-dim">→</span> Enter global live chat
  <span class="t-cyan">dino</span>        <span class="t-dim">→</span> Talk to Dino AI (Gemini 2.0 Flash)
  <span class="t-cyan">who</span>         <span class="t-dim">→</span> View online visitors
  <span class="t-cyan">sign [msg]</span>  <span class="t-dim">→</span> Sign the public guestbook
  <span class="t-cyan">guestbook</span>   <span class="t-dim">→</span> Read the public guestbook
  <span class="t-cyan">echo [txt]</span>  <span class="t-dim">→</span> Print text to the screen
  <span class="t-cyan">calc [num]</span>  <span class="t-dim">→</span> Mathematical calculator
 <span class="t-dim">─────────────────────────────────────────</span>`;

export const HELP_SYSTEM = `
 <span class="t-dim">System & CI/CD:</span>
 <span class="t-dim">─────────────────────────────────────────</span>
  <span class="t-purple">status</span>      <span class="t-dim">→</span> View server health & latency
  <span class="t-purple">stats</span>       <span class="t-dim">→</span> Live dashboard metrics (DB & Cache)
  <span class="t-purple">commits</span>     <span class="t-dim">→</span> View live GitHub deployments
  <span class="t-purple">resume</span>      <span class="t-dim">→</span> Download latest CV
  <span class="t-purple">neofetch</span>    <span class="t-dim">→</span> System info
  <span class="t-purple">history</span>     <span class="t-dim">→</span> Command history
  <span class="t-purple">time</span>        <span class="t-dim">→</span> Current time
 <span class="t-dim">─────────────────────────────────────────</span>`;

export const HELP_FUN = `
 <span class="t-dim">Easter eggs — try these for fun:</span>
 <span class="t-dim">─────────────────────────────────────────</span>
  <span class="t-yellow">github</span>      <span class="t-dim">→</span> Live GitHub stats
  <span class="t-yellow">crypto</span>      <span class="t-dim">→</span> Live crypto prices
  <span class="t-yellow">news</span>        <span class="t-dim">→</span> Top tech news
  <span class="t-yellow">trivia</span>      <span class="t-dim">→</span> Random tech trivia
  <span class="t-yellow">weather</span>     <span class="t-dim">→</span> Current weather forecast
  <span class="t-yellow">joke</span>        <span class="t-dim">→</span> Random dev joke
  <span class="t-yellow">quote</span>       <span class="t-dim">→</span> Inspirational quote
  <span class="t-yellow">pokemon</span>     <span class="t-dim">→</span> Catch a random Pokemon
  <span class="t-yellow">hack</span>        <span class="t-dim">→</span> <span class="t-red">⚠ CLASSIFIED</span>
  <span class="t-yellow">matrix</span>      <span class="t-dim">→</span> Enter the Matrix
  <span class="t-yellow">coffee</span>      <span class="t-dim">→</span> Brew a virtual coffee
  <span class="t-yellow">flip</span>        <span class="t-dim">→</span> Flip a table
  <span class="t-yellow">sudo hire</span>   <span class="t-dim">→</span> 😏
 <span class="t-dim">─────────────────────────────────────────</span>`;

/* ─── static content ─────────────────────────────────────────────── */

export const ABOUT_TEXT = ` Hi, my name is <span class="t-white font-bold">Rakesh Sarkar</span>!

 I'm a <span class="t-white font-bold">full-stack developer</span> based in New Delhi, India.
 I am passionate about crafting pixel-perfect interfaces and
 building scalable web applications to solve real-world problems.

 Currently pursuing <span class="t-cyan">B.Tech AI</span> @ <span class="t-cyan">IIT Bombay</span>
 <span class="t-green">● Available for work</span>
 
 <span class="t-dim">To contact Rakesh, type '</span><span class="t-yellow font-bold bg-white/10 px-1 rounded">hire me</span><span class="t-dim">' in the terminal.</span>`;

export const CONTACT_TEXT = ` <span class="t-yellow">📧  Email</span>      <span class="t-dim">→</span> <a href="mailto:rakeshsarkar9711@gmail.com" class="t-link">rakeshsarkar9711@gmail.com</a>
 <span class="t-yellow">📱  WhatsApp</span>   <span class="t-dim">→</span> <a href="https://wa.me/918851624488" target="_blank" class="t-link">+91 8851624488</a>
 <span class="t-yellow">💼  LinkedIn</span>   <span class="t-dim">→</span> <a href="https://www.linkedin.com/in/rakesh-sarkar-9711/" target="_blank" class="t-link">in/rakesh-sarkar-9711</a>
 <span class="t-yellow">🐙  GitHub</span>     <span class="t-dim">→</span> <a href="https://github.com/bloodwraith8851" target="_blank" class="t-link">@bloodwraith8851</a>`;

export const SOCIAL_TEXT = ` <span class="t-dim">Connect with me:</span>
 <span class="t-dim">─────────────────────────────────────────</span>
  <a href="https://www.linkedin.com/in/rakesh-sarkar-9711/" target="_blank" class="t-link">→ LinkedIn</a>     <span class="t-dim">Professional network</span>
  <a href="https://github.com/bloodwraith8851" target="_blank" class="t-link">→ GitHub</a>       <span class="t-dim">Open source & projects</span>
  <a href="https://wa.me/918851624488" target="_blank" class="t-link">→ WhatsApp</a>     <span class="t-dim">Quick chat</span>
  <a href="mailto:rakeshsarkar9711@gmail.com" class="t-link">→ Email</a>        <span class="t-dim">Business inquiries</span>`;

export const SKILLS_TEXT = ` <span class="t-yellow">Frontend</span>    <span class="t-dim">│</span> React · Next.js · TypeScript · Tailwind CSS
 <span class="t-yellow">Backend</span>     <span class="t-dim">│</span> Node.js · Express · Python · FastAPI
 <span class="t-yellow">Database</span>    <span class="t-dim">│</span> PostgreSQL · MongoDB · Redis
 <span class="t-yellow">GenAI</span>       <span class="t-dim">│</span> LangChain · OpenAI · RAG Systems
 <span class="t-yellow">Design</span>      <span class="t-dim">│</span> Figma · UI/UX · Motion Design
 <span class="t-yellow">DevOps</span>      <span class="t-dim">│</span> Docker · AWS · CI/CD · Git`;

export const NEOFETCH = ` <span class="t-green">       ▄▄▄▄▄▄▄</span>       <span class="t-white font-bold">visitor</span><span class="t-dim">@</span><span class="t-purple">rakesh.dev</span>
 <span class="t-green">    ▄█████████▄</span>      <span class="t-dim">──────────────────────</span>
 <span class="t-green">  ▄██▀▀▀▀▀▀▀██▄</span>     <span class="t-yellow">OS:</span>       Portfolio v2.0.26
 <span class="t-green">  ███       ███</span>     <span class="t-yellow">Host:</span>     rakesh.dev
 <span class="t-green">  ███       ███</span>     <span class="t-yellow">Kernel:</span>   React 18 + Vite 5
 <span class="t-green">  ▀██▄▄▄▄▄▄▄██▀</span>     <span class="t-yellow">Uptime:</span>   Since 2002
 <span class="t-green">    ▀█████████▀</span>      <span class="t-yellow">Shell:</span>    TypeScript 5.x
 <span class="t-green">       ▀▀▀▀▀▀▀</span>       <span class="t-yellow">Theme:</span>   Dark Mode [always]
                       <span class="t-yellow">Langs:</span>    TS · JS · Python · Go
                       <span class="t-yellow">Cups:</span>     247 chai ☕
                       <span class="t-yellow">Status:</span>   <span class="t-green">● Available</span>`;

export const ADMIN_MENU = `
 <span class="t-dim">Admin Tools:</span>
 <span class="t-dim">─────────────────────────────────────────</span>
  <span class="t-yellow">stats</span>       <span class="t-dim">→</span> Real-time traffic & analytics
  <span class="t-yellow">logs</span>        <span class="t-dim">→</span> Server event stream
  <span class="t-yellow">watch</span>       <span class="t-dim">→</span> Live global database feed
  <span class="t-yellow">telemetry</span>   <span class="t-dim">→</span> Visitor command history
  <span class="t-yellow">users</span>       <span class="t-dim">→</span> View active connections
  <span class="t-yellow">top</span>         <span class="t-dim">→</span> Task manager
  <span class="t-yellow">deploy</span>      <span class="t-dim">→</span> Trigger production build
  <span class="t-yellow">config</span>      <span class="t-dim">→</span> View system configuration
  <span class="t-yellow">set [k] [v]</span> <span class="t-dim">→</span> Update global settings
  <span class="t-yellow">ban [ip]</span>    <span class="t-dim">→</span> Ban an IP address
  <span class="t-yellow">logout</span>      <span class="t-dim">→</span> End admin session
 <span class="t-dim">─────────────────────────────────────────</span>`;

/* ─── boot sequence ──────────────────────────────────────────────── */

export const BOOT: { cmd?: string; out?: string; ascii?: string; d: number }[] = [
  { cmd: 'welcome', d: 0 },
  { ascii: ASCII_NAME, d: 400 },
  {
    out: ` Welcome to Rakesh's terminal portfolio. <span class="t-dim">(v2.0.26)</span>\n <span class="t-dim">─────────────────────────────────────────</span>\n For a list of available commands, type '<span class="t-green">help</span>'.`,
    d: 100,
  },
  { cmd: 'about', d: 700 },
  { out: ABOUT_TEXT, d: 250 },
];
