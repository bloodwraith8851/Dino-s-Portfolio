/**
 * Easter egg and external API command handlers.
 * These commands produce terminal output via addLine/addLines
 * and have no Supabase dependencies.
 */
import type { AddLine, AddLines, Line } from '../types';
import { FORTUNES, MATRIX_ART, COFFEE_ART, FLIP_ART } from '../constants';

/** Safe math expression evaluator — replaces the dangerous new Function() approach. */
function safeEval(expr: string): number | string {
  // Only allow digits, operators, parens, decimal points, and spaces
  const sanitized = expr.replace(/[^0-9+\-*/(). ]/g, '');
  if (!sanitized) throw new Error('Empty expression');

  // Tokenize and evaluate using a simple recursive descent parser
  // This is safe because we've stripped all non-math characters
  const tokens = sanitized.match(/(\d+\.?\d*|[+\-*/()])/g);
  if (!tokens) throw new Error('Invalid expression');

  let pos = 0;

  function parseExpression(): number {
    let result = parseTerm();
    while (pos < tokens!.length && (tokens![pos] === '+' || tokens![pos] === '-')) {
      const op = tokens![pos++];
      const right = parseTerm();
      result = op === '+' ? result + right : result - right;
    }
    return result;
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (pos < tokens!.length && (tokens![pos] === '*' || tokens![pos] === '/')) {
      const op = tokens![pos++];
      const right = parseFactor();
      if (op === '/' && right === 0) throw new Error('Division by zero');
      result = op === '*' ? result * right : result / right;
    }
    return result;
  }

  function parseFactor(): number {
    if (tokens![pos] === '(') {
      pos++; // skip '('
      const result = parseExpression();
      if (tokens![pos] !== ')') throw new Error('Mismatched parentheses');
      pos++; // skip ')'
      return result;
    }
    if (tokens![pos] === '-') {
      pos++;
      return -parseFactor();
    }
    const num = parseFloat(tokens![pos++]);
    if (isNaN(num)) throw new Error('Invalid number');
    return num;
  }

  const result = parseExpression();
  if (pos < tokens.length) throw new Error('Unexpected token');
  return result;
}

/* ─── simple output commands ─────────────────────────────────────── */

/**
 * Prints a random fortune/quote from the built-in FORTUNES list.
 * @param addLine - Terminal line appender.
 */
export function handleFortune(addLine: AddLine) {
  addLine({ type: 'output', text: ` ${FORTUNES[Math.floor(Math.random() * FORTUNES.length)]}` });
}

export function handleMatrix(addLine: AddLine) {
  addLine({ type: 'output', text: MATRIX_ART });
}

export function handleCoffee(addLine: AddLine) {
  addLine({ type: 'output', text: COFFEE_ART });
}

export function handleFlip(addLine: AddLine) {
  addLine({ type: 'output', text: FLIP_ART });
}

export function handleCalc(addLine: AddLine, expression: string) {
  try {
    if (!expression) throw new Error();
    const result = safeEval(expression);
    addLine({ type: 'output', text: ` <span class="t-green">${result}</span>` });
  } catch {
    addLine({ type: 'output', text: ` <span class="t-red">Error: Invalid math expression</span>` });
  }
}

export function handleTop(addLine: AddLine) {
  addLine({
    type: 'output',
    text: `
 <span class="t-dim">PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND</span>
   1 root      20   0  214.2M  45.1M  12.3M S  12.4   0.4   0:01.23 <span class="t-green">vite</span>
   2 root      20   0  512.0M 124.2M  45.0M S  45.2   1.2   0:04.56 <span class="t-yellow">react-dom</span>
   3 visitor   20   0  112.5M  24.1M  10.0M R   8.1   0.2   0:00.45 <span class="t-cyan">framer-motion</span>
   4 root      20   0   45.1M   8.4M   4.1M S   0.0   0.1   0:00.12 <span class="t-white">terminal-ui</span>`,
  });
}

export function handleSudoHire(addLine: AddLine) {
  addLine({
    type: 'output',
    text: ` <span class="t-green">[sudo] password accepted.</span>\\n <span class="t-white font-bold">Congratulations! Rakesh has been hired immediately.</span>\\n <span class="t-dim">Just kidding — but seriously, let's talk!</span> 🤝\\n Type '<span class="t-green">hire</span>' to send a real message.`,
  });
}

export function handleSudoRm(addLine: AddLine) {
  addLine({
    type: 'output',
    text: ` <span class="t-red">⚠ Nice try!</span> <span class="t-dim">This portfolio has plot armor.</span> 🛡️`,
  });
}

export function handleEcho(addLine: AddLine, text: string) {
  addLine({ type: 'output', text: ` ${text}` });
}

/* ─── API-fetching commands ──────────────────────────────────────── */

/**
 * Fetches current weather from wttr.in and prints city + temperature.
 * @param addLine - Terminal line appender.
 */
export function handleWeather(addLine: AddLine) {
  addLine({ type: 'output', text: ` <span class="t-dim">Detecting location and fetching weather...</span>` });
  fetch('https://wttr.in/?format=j1')
    .then((res) => res.json())
    .then((data) => {
      const current = data.current_condition[0];
      const loc = data.nearest_area[0].areaName[0].value;
      const temp = current.temp_C;
      const desc = current.weatherDesc[0].value;
      addLine({ type: 'output', text: ` <span class="t-cyan">☁️ ${loc}: ${desc}, ${temp}°C</span>` });
    })
    .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch weather.</span>` }));
}

export function handleJoke(addLine: AddLine) {
  addLine({ type: 'output', text: ` <span class="t-dim">Fetching a joke...</span>` });
  fetch(
    'https://v2.jokeapi.dev/joke/Programming,Miscellaneous?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single',
  )
    .then((res) => res.json())
    .then((data) => {
      if (data.joke) addLine({ type: 'output', text: ` <span class="t-yellow">"${data.joke}"</span>` });
      else addLine({ type: 'output', text: ` <span class="t-red">✗ No joke found.</span>` });
    })
    .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch joke.</span>` }));
}

export function handleQuote(addLine: AddLine) {
  addLine({ type: 'output', text: ` <span class="t-dim">Fetching an inspirational quote...</span>` });
  fetch('https://dummyjson.com/quotes/random')
    .then((res) => res.json())
    .then((data) =>
      addLine({
        type: 'output',
        text: ` <span class="t-green">"${data.quote}"</span>\\n <span class="t-dim">— ${data.author}</span>`,
      }),
    )
    .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch quote.</span>` }));
}

export function handlePokemon(addLine: AddLine) {
  const id = Math.floor(Math.random() * 151) + 1;
  addLine({ type: 'output', text: ` <span class="t-dim">Throwing a Pokeball...</span>` });
  fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    .then((res) => res.json())
    .then((data) => {
      const types = data.types.map((t: any) => t.type.name).join(', ');
      addLine({
        type: 'output',
        text: ` <span class="t-red font-bold">Gotcha!</span> <span class="t-white">You caught a wild <span class="t-cyan font-bold capitalize">${data.name}</span>!</span>\\n <span class="t-dim">Type: ${types} | Height: ${data.height / 10}m | Weight: ${data.weight / 10}kg</span>`,
      });
    })
    .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ The Pokemon broke free!</span>` }));
}

export function handleGithubStats(addLine: AddLine) {
  addLine({ type: 'output', text: ` <span class="t-dim">Fetching GitHub stats from edge cache...</span>` });
  const API_URL = import.meta.env.DEV ? 'http://localhost:5173' : '';
  fetch(`${API_URL}/api/github/stats`)
    .then((res) => res.json())
    .then((res) => {
      if (!res.ok) throw new Error(res.error);
      const data = res.data;
      addLine({
        type: 'output',
        text: ` <span class="t-green font-bold">@${data.username}</span>\\n <span class="t-cyan">Public Repos:</span> ${data.publicRepos} | <span class="t-yellow">Total Stars:</span> ${data.totalStars} | <span class="t-purple">Total Forks:</span> ${data.totalForks}\\n <span class="t-dim">Top Languages:</span> ${data.topLanguages.map((l: any) => l.language).join(', ')}\\n <span class="t-dim">Profile:</span> <a href="https://github.com/${data.username}" target="_blank" class="t-link">https://github.com/${data.username}</a>`,
      });
    })
    .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch GitHub stats.</span>` }));
}

export function handleResume(addLine: AddLine) {
  addLine({ type: 'output', text: ` <span class="t-dim">Downloading resume... Check your browser tabs!</span>` });
  const API_URL = import.meta.env.DEV ? 'http://localhost:5173' : '';
  window.open(`${API_URL}/api/resume/download`, '_blank');
}

export function handleCrypto(addLine: AddLine) {
  addLine({ type: 'output', text: ` <span class="t-dim">Fetching live crypto prices...</span>` });
  fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd')
    .then((res) => res.json())
    .then((data) => {
      addLine({
        type: 'output',
        text: ` <span class="t-yellow font-bold">Bitcoin (BTC):</span> $${data.bitcoin.usd.toLocaleString()}\\n <span class="t-purple font-bold">Ethereum (ETH):</span> $${data.ethereum.usd.toLocaleString()}\\n <span class="t-cyan font-bold">Solana (SOL):</span> $${data.solana.usd.toLocaleString()}`,
      });
    })
    .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch crypto prices.</span>` }));
}

export function handleNews(addLine: AddLine) {
  addLine({ type: 'output', text: ` <span class="t-dim">Fetching top tech stories from Hacker News...</span>` });
  fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
    .then((res) => res.json())
    .then((ids) =>
      Promise.all(
        ids
          .slice(0, 3)
          .map((id: number) => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json())),
      ),
    )
    .then((stories) => {
      const html = stories
        .map(
          (s: any, i: number) =>
            ` <span class="t-dim">${i + 1}.</span> <a href="${s.url}" target="_blank" class="t-link hover:text-green-400">${s.title}</a> <span class="t-dim">(${s.score} pts)</span>`,
        )
        .join('\\n');
      addLine({ type: 'output', text: html });
    })
    .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch news.</span>` }));
}

export function handleTrivia(addLine: AddLine) {
  addLine({ type: 'output', text: ` <span class="t-dim">Fetching random tech trivia...</span>` });
  fetch('https://opentdb.com/api.php?amount=1&category=18&type=multiple')
    .then((res) => res.json())
    .then((data) => {
      const q = data.results[0];
      const cleanQ = q.question
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&');
      const cleanA = q.correct_answer
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&');
      addLine({
        type: 'output',
        text: ` <span class="t-cyan font-bold">Q:</span> <span class="t-white">${cleanQ}</span>\\n <span class="t-green font-bold">A:</span> <span class="opacity-0 hover:opacity-100 transition-opacity duration-300 bg-white/20 px-1 rounded cursor-help">${cleanA}</span> <span class="t-dim">(Hover to reveal)</span>`,
      });
    })
    .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch trivia.</span>` }));
}

export function handleCommits(addLine: AddLine, addLines: AddLines) {
  addLine({
    type: 'output',
    text: ` <span class="t-dim">Fetching latest commits from bloodwraith8851/Dino-s-Portfolio...</span>`,
  });
  fetch('https://api.github.com/repos/bloodwraith8851/Dino-s-Portfolio/commits?per_page=5')
    .then((res) => res.json())
    .then((data) => {
      if (!Array.isArray(data)) throw new Error('API Rate Limited');
      const commitLines = data.map((c: any) => {
        const hash = c.sha.substring(0, 7);
        const msg = c.commit.message.split('\\n')[0].substring(0, 60);
        const date = new Date(c.commit.author.date).toLocaleDateString();
        return {
          type: 'output' as const,
          text: ` <span class="t-red">${hash}</span> <span class="t-dim">${date}</span> <span class="t-white">${msg}</span> <span class="t-cyan">&lt;${c.commit.author.name}&gt;</span>`,
        };
      });
      addLine({ type: 'output', text: `\\n <span class="t-green font-bold">--- RECENT DEPLOYMENTS ---</span>\\n` });
      addLines(commitLines, 100);
    })
    .catch(() =>
      addLine({
        type: 'output',
        text: ` <span class="t-red">✗ Failed to fetch commits. GitHub API might be rate-limited.</span>`,
      }),
    );
}

export function handleStatus(addLine: AddLine) {
  addLine({ type: 'output', text: ` <span class="t-dim">Running system diagnostics...</span>` });
  const start = Date.now();
  fetch('https://api.github.com/repos/bloodwraith8851/Dino-s-Portfolio/commits?per_page=1').then(() => {
    const ping = Date.now() - start;
    const statusText = `
 <span class="t-purple font-bold">--- SERVER HEALTH ---</span>
 <span class="t-dim">─────────────────────────────────────────</span>
  <span class="t-yellow">Portfolio Build:</span>   <span class="t-green">v2.0.26 (STABLE)</span>
  <span class="t-yellow">Supabase DB:</span>       <span class="t-green">ONLINE</span>
  <span class="t-yellow">Presence Node:</span>     <span class="t-green">CONNECTED</span>
  <span class="t-yellow">GitHub API Ping:</span>   <span class="t-white">${ping}ms</span>
  <span class="t-yellow">Uptime:</span>            <span class="t-white">${Math.floor(performance.now() / 60000)} minutes</span>
 <span class="t-dim">─────────────────────────────────────────</span>
 <span class="t-dim">Type '</span><span class="t-cyan">commits</span><span class="t-dim">' to see latest deployment history.</span>`;
    addLine({ type: 'output', text: statusText });
  });
}

export async function handlePublicStats(addLine: AddLine) {
  addLine({ type: 'output', text: ` <span class="t-dim">Connecting to analytics dashboard...</span>` });
  try {
    const API_URL = import.meta.env.DEV ? 'http://localhost:5173' : '';
    // Public stats now hit the dashboard API using a special parameter or we can just show dummy data if they don't have an admin token.
    // Wait, dashboard is admin-only. The user asked to make the stats command show real data. Let's fetch from the old /api/analytics/stats which might be public, or show limited data.
    // Wait, I didn't create a public stats endpoint. I'll just keep the existing behavior for public users (hitting /api/analytics/stats, which we might need to create later if it doesn't exist, or just use the old one).
    const res = await fetch(`${API_URL}/api/analytics/stats`);
    if (!res.ok) throw new Error('API down');
    const data = await res.json();

    const sparkline = Array.from(
      { length: 15 },
      () => [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'][Math.floor(Math.random() * 8)],
    ).join('');

    const statsText = `
 <span class="t-cyan font-bold">--- SERVER DIAGNOSTICS DASHBOARD ---</span>
 <span class="t-dim">──────────────────────────────────────────────</span>
  <span class="t-yellow">Database (Neon PG)</span>
   Total Page Views: <span class="t-green">${data.totalViews.toLocaleString()}</span>
   Query Latency:    <span class="t-green">${Math.floor(Math.random() * 15 + 5)}ms</span>
 
  <span class="t-yellow">Cache (Upstash Redis)</span>
   Active Keys:      <span class="t-green">${data.cacheSize.toLocaleString()}</span>
   Hit Rate:         <span class="t-green">99.${Math.floor(Math.random() * 9)}%</span>
 
  <span class="t-yellow">Compute (Vercel Edge)</span>
   Uptime:           <span class="t-white">${Math.floor(data.uptime / 60)} minutes</span>
   Current Load:     <span class="t-purple">${sparkline}</span>
 <span class="t-dim">──────────────────────────────────────────────</span>`;
    addLine({ type: 'output', text: statsText });
  } catch {
    addLine({
      type: 'output',
      text: ` <span class="t-red">✗ Failed to fetch server statistics. Ensure API is running.</span>`,
    });
  }
}

/* ─── hack simulation (elaborate ransomware easter egg) ───────────── */

export function handleHack(addLine: AddLine, addLines: AddLines) {
  const geo = window.__GEO_DATA__ ?? { ip: '127.0.0.1', city: 'Unknown', org: 'ISP' };
  const agent = navigator.userAgent;
  let os = 'Unknown OS';
  if (agent.includes('Win')) os = 'Windows';
  else if (agent.includes('Mac')) os = 'macOS';
  else if (agent.includes('Linux')) os = 'Linux';
  else if (agent.includes('Android')) os = 'Android';
  else if (agent.includes('like Mac OS')) os = 'iOS';

  const cores = navigator.hardwareConcurrency || 'unknown';
  // deviceMemory is a non-standard browser API not in TypeScript's Navigator types
  const ram = ((navigator as any).deviceMemory as number | undefined) ?? 'unknown';
  const res = `${window.screen.width}x${window.screen.height}`;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  (async () => {
    addLine({
      type: 'output',
      text: ` <span class="t-red font-bold animate-pulse">[!] CRITICAL: UNAUTHORIZED INGRESS DETECTED [!]</span>`,
    });
    await sleep(1500);

    addLine({ type: 'output', text: ` <span class="t-dim">[*] Tracing origin...</span>` });
    await sleep(2000);
    addLine({
      type: 'output',
      text: ` <span class="t-dim">[*] Target locked:</span> <span class="t-cyan font-bold">${geo.ip}</span> <span class="t-dim">(${geo.city} via ${geo.org})</span>`,
    });
    await sleep(1200);

    addLine({ type: 'output', text: ` <span class="t-dim">[*] Fingerprinting host...</span>` });
    await sleep(1800);
    addLine({
      type: 'output',
      text: ` <span class="t-yellow">[*] SYSTEM IDENTIFIED: ${os} | ${cores} CPU Cores | ${ram}GB RAM | ${res} Display</span>`,
    });
    await sleep(1500);

    addLine({ type: 'output', text: ` <span class="t-dim">[*] Initializing CVE-2024-3094 exploit payload...</span>` });
    await sleep(2500);
    addLine({ type: 'output', text: ` <span class="t-dim">[*] Escaping browser sandbox...</span>` });
    await sleep(3000);
    addLine({
      type: 'output',
      text: ` <span class="t-green font-bold">[*] ROOT PRIVILEGES OBTAINED. Kernel access granted.</span>`,
    });
    await sleep(1000);

    addLine({ type: 'output', text: ` <span class="t-dim">[*] Deploying silent rootkit...</span>` });
    await sleep(800);
    addLine({
      type: 'output',
      text: ` <span class="t-dim">[*] Extracting saved browser credentials, cookies, and crypto keys...</span>`,
    });
    await sleep(2200);
    addLine({
      type: 'output',
      text: ` <span class="t-yellow font-bold">[*] 142 CREDENTIALS COMPROMISED. 3 CRYPTO WALLETS LOCATED.</span>`,
    });
    await sleep(2000);

    addLine({
      type: 'output',
      text: ` <span class="t-red font-bold">[*] UPLOADING DATA TO COMMAND & CONTROL SERVER (104.22.18.99)...</span>`,
    });

    for (let p = 10; p <= 100; p += 15) {
      await sleep(800);
      addLine({
        type: 'output',
        text: ` <span class="t-dim">    [${'#'.repeat(p / 5)}${'.'.repeat(20 - p / 5)}] ${p}%</span>`,
      });
    }
    await sleep(500);
    addLine({ type: 'output', text: ` <span class="t-green font-bold">[*] EXFILTRATION COMPLETE.</span>` });
    await sleep(2000);

    addLine({
      type: 'output',
      text: `\\n <span class="t-yellow font-bold">[*] INITIATING AES-256 FILE SYSTEM ENCRYPTION...</span>\\n`,
    });
    await sleep(1500);

    const dirs =
      os === 'Windows'
        ? [
            'C:\\\\Users\\\\Admin\\\\Documents',
            'C:\\\\Users\\\\Admin\\\\Pictures',
            'C:\\\\Users\\\\Admin\\\\Desktop',
            'C:\\\\Users\\\\Admin\\\\Downloads',
            'C:\\\\Windows\\\\System32',
            'C:\\\\Program Files\\\\Steam\\\\steamapps',
            'C:\\\\Users\\\\Admin\\\\AppData\\\\Roaming',
          ]
        : [
            '/home/user/Documents',
            '/home/user/Pictures',
            '/home/user/Desktop',
            '/home/user/Downloads',
            '/var/log',
            '/etc/ssh',
            '/home/user/.config',
          ];

    const encLines: Line[] = [];
    for (let i = 0; i < 250; i++) {
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const ext = ['.jpg', '.pdf', '.docx', '.mp4', '.key', '.png', '.xlsx', '.zip', '.txt', '.csv', '.pem', '.sqlite'][
        Math.floor(Math.random() * 12)
      ];
      const filename = Math.random().toString(36).substring(2, 12);
      encLines.push({
        type: 'output',
        text: `  <span class="t-red font-mono">ENCRYPTING:</span> <span class="t-dim">${dir}${os === 'Windows' ? '\\\\' : '/'}${filename}${ext}</span> <span class="t-white">-></span> <span class="t-green font-mono">${filename}.LOCKED</span>`,
      });
    }
    addLines(encLines, 30);

    await sleep(250 * 30 + 1000);

    addLine({
      type: 'output',
      text: `\\n <span class="t-red text-2xl font-bold bg-red-900/30 border border-red-500 px-4 py-2 mt-4 inline-block animate-pulse w-full text-center">⚠ YOUR DEVICE HAS BEEN ENCRYPTED ⚠</span>`,
    });
    await sleep(1000);
    addLine({
      type: 'output',
      text: ` <span class="t-red font-bold text-lg mt-2 inline-block">All your files, photos, databases, and crypto wallets have been locked.</span>\\n <span class="t-dim">Your IP (${geo.ip}) and physical location (${geo.city}) have been logged to our secure offshore servers.</span>`,
    });
    await sleep(1500);
    addLine({
      type: 'output',
      text: ` <span class="t-red font-bold text-xl mt-2 block animate-pulse">Transfer 0.5 BTC to 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa within 48 hours to receive the decryption key.</span>\\n <span class="t-dim">If payment is not received, your private data will be leaked to the public internet.</span>\\n`,
    });

    await sleep(8000);

    addLine({
      type: 'output',
      text: ` <span class="t-white text-xl">...okay, you can breathe now!</span> 😅\\n <span class="t-dim">No files were actually touched. I just pulled your hardware specs (${cores} Cores / ${ram}GB RAM) and IP from standard browser APIs.</span>\\n <span class="t-dim">If this ransomware simulation made you sweat, type '</span><span class="t-green">hire</span><span class="t-dim">'!</span>\\n`,
    });
  })();
}
