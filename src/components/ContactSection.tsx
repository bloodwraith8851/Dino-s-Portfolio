import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { supabase } from '../lib/supabase';
import SnakeGame from './SnakeGame';
import VisitorMap from './VisitorMap';

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

const FORTUNES = [
  `🔮 <span class="t-purple">You will merge to main on the first try today.</span>`,
  `🔮 <span class="t-purple">A wild bug will appear, but you will catch it swiftly.</span>`,
  `🔮 <span class="t-purple">Your next pull request will receive 0 comments. It's perfect.</span>`,
  `🔮 <span class="t-purple">Today's stack overflow search will yield the answer on the first link.</span>`,
  `🔮 <span class="t-purple">You shall receive an unexpected GitHub star. Rejoice.</span>`,
  `🔮 <span class="t-purple">A recruiter will slide into your DMs. But this one is actually good.</span>`,
  `🔮 <span class="t-purple">You will write code so clean, future-you will thank present-you.</span>`,
];

const MATRIX_ART = `
 <span class="t-green" style="opacity:0.3">01001000 01100101 01101100 01101100 01101111</span>
 <span class="t-green" style="opacity:0.5">01010111 01101111 01110010 01101100 01100100</span>
 <span class="t-green" style="opacity:0.7">01010100 01101000 01100101 01001101 01100001</span>
 <span class="t-green" style="opacity:0.85">01110100 01110010 01101001 01111000 01001000</span>
 <span class="t-green">01100001 01110011 01011001 01101111 01110101</span>

 <span class="t-green font-bold">Wake up, visitor... The Matrix has you.</span>
 <span class="t-green">Follow the white rabbit. 🐇</span>`;

const COFFEE_ART = `
      <span class="t-yellow">   ( (
    ) )
  ........
  |      |]
  \\      /
   \`----'</span>

 <span class="t-dim">Brewing coffee... ☕</span>
 <span class="t-yellow">Here's a virtual coffee to keep you going!</span>
 <span class="t-dim">Fun fact: This portfolio was fueled by 247 cups of chai.</span>`;

const FLIP_ART = `
 <span class="t-cyan">╯°□°）╯︵ ┻━┻</span>

 <span class="t-dim">Table flipped! Frustration level: over 9000!</span>
 <span class="t-yellow">┬─┬ ノ( ゜-゜ノ)</span>  <span class="t-dim">...okay, putting it back.</span>`;

const HACK_LINES = [
  'Accessing mainframe...',
  'Bypassing firewall ████████░░ 78%',
  'Decrypting passwords... ██████████ 100%',
  'Downloading internet...',
  'Injecting CSS into the Matrix...',
  'Reticulating splines...',
  'Compiling quantum flux capacitor...',
];

/* ─── terminal data ──────────────────────────────────────────────── */
const HELP_INDEX = `
 <span class="t-dim">Help Menu Categories:</span>
 <span class="t-dim">─────────────────────────────────────────</span>
  <span class="t-cyan">1.</span> <span class="t-yellow">General & Contact</span>     <span class="t-dim">→</span> Basic commands & info
  <span class="t-cyan">2.</span> <span class="t-yellow">Multiplayer & Chat</span>    <span class="t-dim">→</span> Games, chat, guestbook
  <span class="t-cyan">3.</span> <span class="t-yellow">System & CI/CD</span>        <span class="t-dim">→</span> Diagnostics & logs
  <span class="t-cyan">4.</span> <span class="t-yellow">Easter Eggs</span>           <span class="t-dim">→</span> Hidden secrets
 <span class="t-dim">─────────────────────────────────────────</span>`;

const HELP_GENERAL = `
 <span class="t-dim">General & Contact:</span>
 <span class="t-dim">─────────────────────────────────────────</span>
  <span class="t-green">about</span>       <span class="t-dim">→</span> Who is Rakesh?
  <span class="t-green">contact</span>     <span class="t-dim">→</span> Show contact details
  <span class="t-green">social</span>      <span class="t-dim">→</span> Social media links
  <span class="t-green">skills</span>      <span class="t-dim">→</span> Technical skills
  <span class="t-green">hire</span>        <span class="t-dim">→</span> Send a message
  <span class="t-green">clear</span>       <span class="t-dim">→</span> Clear terminal
 <span class="t-dim">─────────────────────────────────────────</span>`;

const HELP_INTERACTIVE = `
 <span class="t-dim">Multiplayer & Interactive:</span>
 <span class="t-dim">─────────────────────────────────────────</span>
  <span class="t-cyan">snake</span>       <span class="t-dim">→</span> Play terminal Snake
  <span class="t-cyan">topscores</span>   <span class="t-dim">→</span> View global Snake leaderboard
  <span class="t-cyan">map</span>         <span class="t-dim">→</span> Live visitor world map 🗺️
  <span class="t-cyan">polls</span>       <span class="t-dim">→</span> View community polls
  <span class="t-cyan">vote [p] [o]</span><span class="t-dim">→</span> Vote on a poll
  <span class="t-cyan">chat</span>        <span class="t-dim">→</span> Enter global live chat
  <span class="t-cyan">who</span>         <span class="t-dim">→</span> View online visitors
  <span class="t-cyan">sign [msg]</span>  <span class="t-dim">→</span> Sign the public guestbook
  <span class="t-cyan">guestbook</span>   <span class="t-dim">→</span> Read the public guestbook
  <span class="t-cyan">echo [txt]</span>  <span class="t-dim">→</span> Print text to the screen
  <span class="t-cyan">calc [num]</span>  <span class="t-dim">→</span> Mathematical calculator
 <span class="t-dim">─────────────────────────────────────────</span>`;

const HELP_SYSTEM = `
 <span class="t-dim">System & CI/CD:</span>
 <span class="t-dim">─────────────────────────────────────────</span>
  <span class="t-purple">status</span>      <span class="t-dim">→</span> View server health & latency
  <span class="t-purple">commits</span>     <span class="t-dim">→</span> View live GitHub deployments
  <span class="t-purple">neofetch</span>    <span class="t-dim">→</span> System info
  <span class="t-purple">history</span>     <span class="t-dim">→</span> Command history
  <span class="t-purple">time</span>        <span class="t-dim">→</span> Current time
 <span class="t-dim">─────────────────────────────────────────</span>`;

const HELP_FUN = `
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

const ABOUT_TEXT = ` Hi, my name is <span class="t-white font-bold">Rakesh Sarkar</span>!

 I'm a <span class="t-white font-bold">full-stack developer</span> based in New Delhi, India.
 I am passionate about crafting pixel-perfect interfaces and
 building scalable web applications to solve real-world problems.

 Currently pursuing <span class="t-cyan">B.Tech AI</span> @ <span class="t-cyan">IIT Bombay</span>
 <span class="t-green">● Available for work</span>
 
 <span class="t-dim">To contact Rakesh, type '</span><span class="t-yellow font-bold bg-white/10 px-1 rounded">hire me</span><span class="t-dim">' in the terminal.</span>`;

const CONTACT_TEXT = ` <span class="t-yellow">📧  Email</span>      <span class="t-dim">→</span> <a href="mailto:rakeshsarkar9711@gmail.com" class="t-link">rakeshsarkar9711@gmail.com</a>
 <span class="t-yellow">📱  WhatsApp</span>   <span class="t-dim">→</span> <a href="https://wa.me/918851624488" target="_blank" class="t-link">+91 8851624488</a>
 <span class="t-yellow">💼  LinkedIn</span>   <span class="t-dim">→</span> <a href="https://www.linkedin.com/in/rakesh-sarkar-9711/" target="_blank" class="t-link">in/rakesh-sarkar-9711</a>
 <span class="t-yellow">🐙  GitHub</span>     <span class="t-dim">→</span> <a href="https://github.com/bloodwraith8851" target="_blank" class="t-link">@bloodwraith8851</a>`;

const SOCIAL_TEXT = ` <span class="t-dim">Connect with me:</span>
 <span class="t-dim">─────────────────────────────────────────</span>
  <a href="https://www.linkedin.com/in/rakesh-sarkar-9711/" target="_blank" class="t-link">→ LinkedIn</a>     <span class="t-dim">Professional network</span>
  <a href="https://github.com/bloodwraith8851" target="_blank" class="t-link">→ GitHub</a>       <span class="t-dim">Open source & projects</span>
  <a href="https://wa.me/918851624488" target="_blank" class="t-link">→ WhatsApp</a>     <span class="t-dim">Quick chat</span>
  <a href="mailto:rakeshsarkar9711@gmail.com" class="t-link">→ Email</a>        <span class="t-dim">Business inquiries</span>`;

const SKILLS_TEXT = ` <span class="t-yellow">Frontend</span>    <span class="t-dim">│</span> React · Next.js · TypeScript · Tailwind CSS
 <span class="t-yellow">Backend</span>     <span class="t-dim">│</span> Node.js · Express · Python · FastAPI
 <span class="t-yellow">Database</span>    <span class="t-dim">│</span> PostgreSQL · MongoDB · Redis
 <span class="t-yellow">GenAI</span>       <span class="t-dim">│</span> LangChain · OpenAI · RAG Systems
 <span class="t-yellow">Design</span>      <span class="t-dim">│</span> Figma · UI/UX · Motion Design
 <span class="t-yellow">DevOps</span>      <span class="t-dim">│</span> Docker · AWS · CI/CD · Git`;

const NEOFETCH = ` <span class="t-green">       ▄▄▄▄▄▄▄</span>       <span class="t-white font-bold">visitor</span><span class="t-dim">@</span><span class="t-purple">rakesh.dev</span>
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

type Line = { type: 'command' | 'output' | 'ascii'; text: string; isTyping?: boolean; isAuth?: boolean; isHire?: boolean; };

/* ─── typewriter ─────────────────────────────────────────────────── */
const TypewriterSpan = ({ text, speed = 22 }: { text: string; speed?: number }) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++; setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return <span className="t-body">{displayed}</span>;
};

const sanitizeHTML = (str: string) => {
  if (!str) return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

/* ─── boot ───────────────────────────────────────────────────────── */
const BOOT: { cmd?: string; out?: string; ascii?: string; d: number }[] = [
  { cmd: 'welcome', d: 0 },
  { ascii: ASCII_NAME, d: 400 },
  { out: ` Welcome to Rakesh's terminal portfolio. <span class="t-dim">(v2.0.26)</span>\n <span class="t-dim">─────────────────────────────────────────</span>\n For a list of available commands, type '<span class="t-green">help</span>'.`, d: 100 },
  { cmd: 'about', d: 700 },
  { out: ABOUT_TEXT, d: 250 },
];

/* ─── component ──────────────────────────────────────────────────── */
const ContactSection = () => {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const termRef   = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const isVisible = useInView(wrapRef, { once: true, amount: 0.08 });

  const [lines, setLines]   = useState<Line[]>([]);
  const [input, setInput]   = useState('');
  const [ready, setReady]   = useState(false);
  const [booted, setBooted] = useState(false);
  const [hireStep, setHire] = useState<null | 'name' | 'email' | 'msg' | 'ok'>(null);
  const [hireData, setHD]   = useState({ name: '', email: '', msg: '' });
  const [history, setHist]  = useState<string[]>([]);
  const [histIdx, setHistI] = useState(-1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authStep, setAuthStep] = useState<null | 'password'>(null);
  const [isTailingLogs, setIsTailingLogs] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [isSnakeMode, setIsSnakeMode] = useState(false);
  const [isMapMode, setIsMapMode] = useState(false);
  const [visitorName, setVisitorName] = useState(() => localStorage.getItem('visitorName') || '');
  const [identityStep, setIdentityStep] = useState(!localStorage.getItem('visitorName'));
  const [isWatching, setIsWatching] = useState(false);
  const [helpStep, setHelpStep] = useState(false);
  const chatChannelRef = useRef<any>(null);
  const lastCmdTime = useRef<number>(0);

  /* scroll transforms */
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start end', 'start 0.15'] });
  const termY     = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const termScale = useTransform(scrollYProgress, [0, 1], [0.93, 1]);
  const termOp    = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const glowOp    = useTransform(scrollYProgress, [0.5, 1], [0, 0.6]);

  const scrollBot = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
  }, []);

  const addLine = useCallback((l: Line) => { setLines(p => [...p, l]); scrollBot(); }, [scrollBot]);
  const addLines = useCallback((ls: Line[], gapMs = 200) => {
    ls.forEach((l, i) => setTimeout(() => { setLines(p => [...p, l]); scrollBot(); }, i * gapMs));
  }, [scrollBot]);

  /* boot */
  useEffect(() => {
    supabase.from('admin_settings').select('value').eq('key', 'motd').single().then(({ data }) => {
      if (data) (window as any).__MOTD__ = data.value;
    });
  }, []);

  useEffect(() => {
    if (isVisible && identityStep && lines.length === 0) {
      addLine({ type: 'output', text: ` <span class="t-cyan">SYSTEM INITIATION</span>\n <span class="t-dim">Visitor identity required.</span>` });
    }
  }, [isVisible, identityStep, lines.length, addLine]);

  useEffect(() => {
    if (!isVisible || booted || identityStep) return;
    setBooted(true);
    let t = 0;
    BOOT.forEach(b => {
      t += b.d;
      if (b.cmd) {
        const c = b.cmd;
        setTimeout(() => addLine({ type: 'command', text: c, isTyping: true }), t);
        t += c.length * 28 + 300;
      }
      if (b.ascii) { const a = b.ascii; setTimeout(() => addLine({ type: 'ascii', text: a }), t); }
      if (b.out)   { const o = b.out;   setTimeout(() => addLine({ type: 'output', text: o }), t); t += 100; }
    });
    setTimeout(() => setReady(true), t + 400);
  }, [isVisible, booted, addLine, identityStep]);

  // Live log tailing effect
  useEffect(() => {
    if (!isTailingLogs) return;
    const channel = supabase.channel('realtime_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'command_logs' }, payload => {
        const newLog = payload.new;
        addLine({
          type: 'output',
          text: ` <span class="t-dim">[${new Date(newLog.created_at || Date.now()).toLocaleTimeString()}]</span> <span class="t-yellow">${newLog.visitor_ip}</span> <span class="t-white">executed:</span> <span class="t-cyan">${newLog.command}</span>`
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isTailingLogs, addLine]);

  // Global Live Feed
  useEffect(() => {
    if (!isWatching) return;
    const channel = supabase.channel('global-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'command_logs' }, payload => {
        const row = payload.new;
        addLine({
          type: 'output',
          text: ` <span class="t-dim">[LIVE ${new Date(row.created_at).toLocaleTimeString()}]</span> <span class="t-cyan">cmd</span> <span class="t-white">${sanitizeHTML(row.visitor_ip)}</span> <span class="t-green">→</span> <span class="t-yellow">${sanitizeHTML(row.command)}</span>`
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guestbook' }, payload => {
        const row = payload.new;
        addLine({
          type: 'output',
          text: ` <span class="t-dim">[LIVE ${new Date(row.created_at).toLocaleTimeString()}]</span> <span class="t-purple">sign</span> <span class="t-white">${sanitizeHTML(row.visitor_alias)}</span> <span class="t-green">→</span> <span class="t-yellow">"${sanitizeHTML(row.message)}"</span>`
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isWatching, addLine]);

  // Live Chat effect
  useEffect(() => {
    if (!isChatMode) return;
    const channel = supabase.channel('global_chat_room')
      .on('broadcast', { event: 'chat_msg' }, payload => {
        addLine({
          type: 'output',
          text: ` <span class="t-dim">[${new Date().toLocaleTimeString()}]</span> <span class="t-cyan">${payload.payload.alias}:</span> <span class="t-white">${payload.payload.text}</span>`
        });
      });
    
    channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          addLine({ type: 'output', text: ` <span class="t-green">✓ Connected to Global Chat Server.</span>\n <span class="t-dim">Type your messages below. Type 'exit' to leave chat mode.</span>` });
        }
    });

    chatChannelRef.current = channel;

    return () => { 
      supabase.removeChannel(channel); 
      chatChannelRef.current = null;
    };
  }, [isChatMode, addLine]);

  /* exec */
  const exec = useCallback(async (raw: string) => {
    const now = Date.now();
    if (now - lastCmdTime.current < 300) {
      addLine({ type: 'output', text: ` <span class="t-red font-bold">⚠ RATE LIMIT EXCEEDED</span> <span class="t-dim">Please slow down your requests.</span>` });
      return;
    }
    lastCmdTime.current = now;

    const cmd = raw.trim();
    
    /* ── identity registration ── */
    if (identityStep) {
      if (!cmd) return;
      const name = sanitizeHTML(cmd.substring(0, 20).replace(/[^a-zA-Z0-9 _-]/g, ''));
      if (name.length < 2) {
        addLine({ type: 'output', text: ` <span class="t-red">Name must be at least 2 alphanumeric characters.</span>` });
        return;
      }
      setVisitorName(name);
      localStorage.setItem('visitorName', name);
      window.dispatchEvent(new CustomEvent('identity_updated', { detail: name }));
      setIdentityStep(false);
      addLine({ type: 'output', text: ` <span class="t-green">Identity verified. Welcome to the grid, ${name}.</span>` });
      return;
    }

    /* ── help menu ── */
    if (helpStep) {
      const option = cmd.trim();
      
      if (['1', '2', '3', '4', 'q', 'quit', 'exit'].includes(option.toLowerCase())) {
        addLine({ type: 'command', text: option });
        
        if (option === 'q' || option.toLowerCase() === 'quit' || option.toLowerCase() === 'exit') {
          setHelpStep(false);
          addLine({ type: 'output', text: ` <span class="t-dim">Exited help menu.</span>` });
          return;
        }
        
        let text = '';
        if (option === '1') text = HELP_GENERAL;
        else if (option === '2') text = HELP_INTERACTIVE;
        else if (option === '3') text = HELP_SYSTEM;
        else if (option === '4') text = HELP_FUN;
        
        addLine({ type: 'output', text });
        setHelpStep(false);
        return;
      }
      
      // Not a help menu option, silently exit help and let the normal command processor handle it
      setHelpStep(false);
    }

    const lo  = cmd.toLowerCase();

    // Telemetry Logging
    if (cmd && !isAdmin && !authStep && !hireStep) {
      supabase.from('command_logs').insert([{ visitor_ip: visitorName || 'visitor', command: cmd }]).then(() => {});
    }

    /* ── chat mode ── */
    if (isChatMode) {
      if (lo === 'exit' || lo === 'quit') {
        setIsChatMode(false);
        addLine({ type: 'output', text: ` <span class="t-yellow">Left global chat.</span>` });
      } else if (cmd && chatChannelRef.current) {
        try {
           chatChannelRef.current.send({
             type: 'broadcast',
             event: 'chat_msg',
             payload: { alias: visitorName, text: sanitizeHTML(cmd) }
           });
           
           addLine({
              type: 'output',
              text: ` <span class="t-dim">[${new Date().toLocaleTimeString()}]</span> <span class="t-yellow">You:</span> <span class="t-white">${sanitizeHTML(cmd)}</span>`
           });
        } catch(e) {}
      }
      return;
    }

    /* ── auth step ── */
    if (authStep === 'password') {
      addLine({ type: 'command', text: '•'.repeat(cmd.length), isAuth: true });
      // Authenticate via Edge Function (JWT-based, server-side)
      try {
        addLine({ type: 'output', text: ` <span class="t-dim">Authenticating with server...</span>` });
        const res = await fetch('/api/auth/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: cmd }),
        });
        if (res.ok) {
          const { token } = await res.json();
          sessionStorage.setItem('admin_token', token);
          setIsAdmin(true);
          addLine({ type: 'output', text: ` <span class="t-green">✓ Authentication successful. Welcome, Admin.</span>\n Type '<span class="t-yellow">admin</span>' for tools.` });
        } else {
          addLine({ type: 'output', text: ` <span class="t-red">✗ Authentication failed. This incident will be reported.</span>` });
        }
      } catch {
        // Fallback for local dev without vercel dev
        if (cmd === 'admin' || cmd === 'root' || cmd === 'sudo') {
          setIsAdmin(true);
          addLine({ type: 'output', text: ` <span class="t-green">✓ Authentication successful (dev mode).</span>` });
        } else {
          addLine({ type: 'output', text: ` <span class="t-red">✗ Authentication failed.</span>` });
        }
      }
      setAuthStep(null);
      return;
    }

    addLine({ type: 'command', text: cmd, isHire: !!hireStep });
    if (cmd) { setHist(p => [...p, cmd]); setHistI(-1); }

    /* hire wizard */
    if (hireStep) {
      switch (hireStep) {
        case 'email': setHD(p => ({ ...p, email: cmd })); addLine({ type: 'output', text: ` Great! Now type your <span class="t-yellow">message</span>:` }); setHire('msg'); break;
        case 'msg':   setHD(p => ({ ...p, msg: cmd })); addLine({ type: 'output', text: `\n <span class="t-green">✓ Message preview:</span>\n <span class="t-dim">─────────────────────────────────────────</span>\n  <span class="t-yellow">From:</span>    ${hireData.name}\n  <span class="t-yellow">Email:</span>   ${hireData.email}\n  <span class="t-yellow">Message:</span> ${cmd}\n <span class="t-dim">─────────────────────────────────────────</span>\n Type '<span class="t-green">yes</span>' to send or '<span class="t-red">no</span>' to cancel.` }); setHire('ok'); break;
        case 'ok':
          if (lo === 'yes' || lo === 'y') {
            addLine({ type: 'output', text: ` <span class="t-dim">Saving to secure database...</span>` });
            
            // 1. Insert into Supabase
            supabase.from('messages').insert([{
              name: hireData.name,
              email: hireData.email,
              message: hireData.msg
            }]).then(({ error }) => {
              if (error) addLine({ type: 'output', text: ` <span class="t-red">✗ Database error: ${error.message}</span>` });
              else addLine({ type: 'output', text: ` <span class="t-green">✓ Saved to Database.</span>` });
            });

            // 2. Queue email via Inngest (server-side Resend) — replaces Web3Forms
            addLine({ type: 'output', text: ` <span class="t-dim">Dispatching notification via background job...</span>` });
            fetch('/api/notifications/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'hire',
                name: hireData.name,
                email: hireData.email,
                message: hireData.msg,
              }),
            }).then(res => {
              if (res.ok) addLine({ type: 'output', text: ` <span class="t-green">✓ Email notification queued via Inngest + Resend!</span>` });
              else addLine({ type: 'output', text: ` <span class="t-yellow">⚠ Notification queued (Inngest key pending).</span>` });
            }).catch(() => {
              // Fallback to Web3Forms if Edge Function unavailable (local dev)
              const accessKey = (import.meta as any).env.VITE_WEB3FORMS_KEY;
              if (accessKey) {
                fetch('https://api.web3forms.com/submit', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                  body: JSON.stringify({ access_key: accessKey, subject: '🚀 New Lead!', Name: hireData.name, Email: hireData.email, Message: hireData.msg }),
                }).then(r => r.json()).then(r => { if (r.success) addLine({ type: 'output', text: ` <span class="t-green">✓ Email dispatched (fallback).</span>` }); }).catch(() => {});
              }
            });

            addLine({ type: 'output', text: ` <span class="t-green font-bold">✓ Process complete! I'll get back to you soon 🚀</span>` });
          } else {
            addLine({ type: 'output', text: ` <span class="t-red">✗ Cancelled.</span>` });
          }
          setHire(null); setHD({ name: '', email: '', msg: '' }); break;
      }
      return;
    }

    if (lo.startsWith('echo ')) {
      addLine({ type: 'output', text: ` ${cmd.substring(5)}` });
      return;
    }
    if (lo.startsWith('sign ')) {
      const msg = sanitizeHTML(cmd.substring(5).trim());
      if (!msg) { addLine({ type: 'output', text: ` <span class="t-red">Usage: sign [your message]</span>` }); return; }
      
      addLine({ type: 'output', text: ` <span class="t-dim">Carving your message into the guestbook...</span>` });
      
      try {
        await supabase.from('guestbook').insert([{ visitor_alias: visitorName || 'Anonymous', message: msg }]);
        addLine({ type: 'output', text: ` <span class="t-green">✓ Your mark has been left. Type 'guestbook' to see it!</span>` });
        // Fire Inngest notification event (non-blocking)
        fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'guestbook', visitor_alias: visitorName || 'Anonymous', message: msg }),
        }).catch(() => {});
      } catch (e) {
        addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to sign the guestbook.</span>` });
      }
      return;
    }
    if (lo.startsWith('ban ')) {
      if (!isAdmin) { addLine({ type: 'output', text: ` <span class="t-red">✗ Permission denied.</span>` }); return; }
      const ip = cmd.substring(4).trim();
      addLine({ type: 'output', text: ` <span class="t-dim">Adding IP ${ip} to global banlist...</span>` });
      try {
        await supabase.from('banned_ips').insert([{ ip }]);
        addLine({ type: 'output', text: ` <span class="t-green">✓ IP ${ip} has been permanently banned from the server.</span>` });
      } catch (e) {
        addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to ban IP (Table might not exist).</span>` });
      }
      return;
    }
    if (lo.startsWith('unban ')) {
      if (!isAdmin) { addLine({ type: 'output', text: ` <span class="t-red">✗ Permission denied.</span>` }); return; }
      const ip = cmd.substring(6).trim();
      try {
        await supabase.from('banned_ips').delete().eq('ip', ip);
        addLine({ type: 'output', text: ` <span class="t-green">✓ IP ${ip} has been removed from the banlist.</span>` });
      } catch (e) {}
      return;
    }
    if (lo.startsWith('calc ')) {
      try {
        const expr = cmd.substring(5).replace(/[^0-9+\-*/(). ]/g, '');
        if (!expr) throw new Error();
        const res = new Function(`return ${expr}`)();
        addLine({ type: 'output', text: ` <span class="t-green">${res}</span>` });
      } catch (e) {
        addLine({ type: 'output', text: ` <span class="t-red">Error: Invalid math expression</span>` });
      }
      return;
    }
    if (lo.startsWith('vote ')) {
      const parts = cmd.substring(5).trim().split(' ');
      if (parts.length < 2) { addLine({ type: 'output', text: ` <span class="t-red">Usage: vote [poll_id] [option_index]</span>` }); return; }
      const pollId = parseInt(parts[0]);
      const optionIndex = parseInt(parts[1]);
      if (isNaN(pollId) || isNaN(optionIndex)) { addLine({ type: 'output', text: ` <span class="t-red">Error: IDs must be numbers.</span>` }); return; }
      
      addLine({ type: 'output', text: ` <span class="t-dim">Casting your vote...</span>` });
      supabase.from('poll_votes').insert([{ poll_id: pollId, voter_ip: visitorName || 'visitor', option_index: optionIndex }]).then(({ error }) => {
        if (error) {
          if (error.code === '23505') addLine({ type: 'output', text: ` <span class="t-yellow">⚠ You have already voted on this poll!</span>` });
          else addLine({ type: 'output', text: ` <span class="t-red">✗ Database error: ${error.message}</span>` });
        } else {
          addLine({ type: 'output', text: ` <span class="t-green">✓ Vote successfully cast! Type 'polls' to see updated results.</span>` });
        }
      });
      return;
    }

    if (lo === 'commits' || lo === 'git log') {
      addLine({ type: 'output', text: ` <span class="t-dim">Fetching latest commits from bloodwraith8851/Dino-s-Portfolio...</span>` });
      fetch('https://api.github.com/repos/bloodwraith8851/Dino-s-Portfolio/commits?per_page=5')
        .then(res => res.json())
        .then(data => {
          if (!Array.isArray(data)) throw new Error('API Rate Limited');
          const commitLines = data.map((c: any) => {
            const hash = c.sha.substring(0, 7);
            const msg = c.commit.message.split('\\n')[0].substring(0, 60);
            const date = new Date(c.commit.author.date).toLocaleDateString();
            return { type: 'output' as const, text: ` <span class="t-red">${hash}</span> <span class="t-dim">${date}</span> <span class="t-white">${msg}</span> <span class="t-cyan">&lt;${c.commit.author.name}&gt;</span>` };
          });
          addLine({ type: 'output', text: `\n <span class="t-green font-bold">--- RECENT DEPLOYMENTS ---</span>\n` });
          addLines(commitLines, 100);
        })
        .catch(e => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch commits. GitHub API might be rate-limited.</span>` }));
      return;
    }

    if (lo === 'status') {
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
      }).catch(() => {
        addLine({ type: 'output', text: ` <span class="t-red">✗ Diagnostics failed. Partial outage detected.</span>` });
      });
      return;
    }

    switch (lo) {
      case 'help': case 'h': 
        addLine({ type: 'output', text: HELP_INDEX }); 
        setHelpStep(true);
        break;
      case 'about':   addLine({ type: 'output', text: ABOUT_TEXT }); break;
      case 'contact': addLine({ type: 'output', text: CONTACT_TEXT }); break;
      case 'social':  addLine({ type: 'output', text: SOCIAL_TEXT }); break;
      case 'skills':  addLine({ type: 'output', text: SKILLS_TEXT }); break;
      case 'hire': case 'hire me':    addLine({ type: 'output', text: ` Let's get in touch, ${visitorName}! 🤝\n Enter your <span class="t-yellow">email</span>:` }); setHD({ name: visitorName, email: '', msg: '' }); setHire('email'); break;
      case 'clear':   setLines([]); setIsTailingLogs(false); setIsWatching(false); return;
      case 'watch':
        if (!isAdmin) { addLine({ type: 'output', text: ` <span class="t-red">✗ Permission denied.</span>` }); break; }
        setIsWatching(true);
        addLine({ type: 'output', text: ` <span class="t-dim">Subscribing to Global Database Webhooks...</span>\n <span class="t-green font-bold">✓ Connected to Matrix Feed. Type 'unwatch' to disconnect.</span>\n` });
        break;
      case 'unwatch':
        if (!isAdmin) { addLine({ type: 'output', text: ` <span class="t-red">✗ Permission denied.</span>` }); break; }
        setIsWatching(false);
        addLine({ type: 'output', text: ` <span class="t-yellow">Disconnected from Global Matrix Feed.</span>` });
        break;
      case 'welcome': 
        addLine({ type: 'ascii', text: ASCII_NAME }); 
        addLine({ type: 'output', text: ` Welcome back! Type '<span class="t-green">help</span>' for commands.` }); 
        if ((window as any).__MOTD__) addLine({ type: 'output', text: `\n <span class="t-yellow font-bold">MOTD:</span> <span class="t-white">${(window as any).__MOTD__}</span>\n` });
        break;
      case 'chat':    setIsChatMode(true); addLine({ type: 'output', text: ` <span class="t-dim">Connecting to global chat...</span>` }); return;
      case 'guestbook': {
        addLine({ type: 'output', text: ` <span class="t-dim">Fetching the ancient scrolls...</span>` });
        try {
          const { data } = await supabase.from('guestbook').select('*').order('created_at', { ascending: false }).limit(10);
          if (data && data.length > 0) {
            const gbLines = data.map(entry => ({
              type: 'output' as const,
              text: ` <span class="t-cyan">${entry.visitor_alias}</span> <span class="t-dim">[${new Date(entry.created_at).toLocaleDateString()}]</span>\n  <span class="t-white">"${entry.message}"</span>\n`
            }));
            addLine({ type: 'output', text: `\n <span class="t-purple font-bold">--- THE PUBLIC GUESTBOOK ---</span>\n` });
            addLines(gbLines.reverse(), 200);
          } else {
            addLine({ type: 'output', text: ` <span class="t-dim">The guestbook is empty. Be the first to 'sign [message]'!</span>` });
          }
        } catch (e) {
            addLine({ type: 'output', text: ` <span class="t-red">✗ Could not read guestbook.</span>` });
        }
        break;
      }
      case 'polls': {
        addLine({ type: 'output', text: ` <span class="t-dim">Fetching active community polls...</span>` });
        try {
          const { data } = await supabase.from('polls').select('*').eq('active', true);
          if (data && data.length > 0) {
            for (const poll of data) {
              const { data: votes } = await supabase.from('poll_votes').select('option_index').eq('poll_id', poll.id);
              const voteCounts = (poll.options as string[]).map(() => 0);
              votes?.forEach(v => { if (voteCounts[v.option_index] !== undefined) voteCounts[v.option_index]++; });
              const totalVotes = votes?.length || 0;

              addLine({ type: 'output', text: `\n <span class="t-yellow font-bold">POLL #${poll.id}</span> <span class="t-white">${poll.question}</span>` });
              const lines = poll.options.map((opt: string, i: number) => {
                const count = voteCounts[i];
                const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
                const bar = '█'.repeat(Math.round(pct / 5)).padEnd(20, '░');
                return { type: 'output' as const, text: `  <span class="t-cyan">[${i}]</span> ${opt.padEnd(12)} <span class="t-dim">${bar}</span> ${pct}% (${count})` };
              });
              addLines(lines, 100);
            }
            addLine({ type: 'output', text: `\n <span class="t-dim">Type </span><span class="t-green">vote [poll_id] [option_index]</span><span class="t-dim"> to cast your vote!</span>\n` });
          } else {
            addLine({ type: 'output', text: ` <span class="t-dim">No active polls right now.</span>` });
          }
        } catch (e) {
          addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch polls.</span>` });
        }
        break;
      }
      case 'snake':
        setIsSnakeMode(true); return;
      case 'map':
        setIsMapMode(true);
        addLine({ type: 'output', text: ` <span class="t-dim">Rendering live visitor map...</span>` });
        return;
      case 'topscores': {
        addLine({ type: 'output', text: ` <span class="t-dim">Fetching global Snake leaderboard...</span>` });
        try {
          const { data } = await supabase.from('scores').select('*').order('score', { ascending: false }).limit(5);
          if (data && data.length > 0) {
            const scoreLines = data.map((entry, i) => ({
              type: 'output' as const,
              text: ` <span class="t-yellow">${i + 1}.</span> <span class="t-cyan">${entry.player_alias.padEnd(20)}</span> <span class="t-green font-bold">${entry.score}</span>`
            }));
            addLine({ type: 'output', text: `\n <span class="t-purple font-bold">--- SNAKE HIGH SCORES ---</span>\n` });
            addLines(scoreLines, 200);
          } else {
            addLine({ type: 'output', text: ` <span class="t-dim">No high scores yet! Type 'snake' to be the first!</span>` });
          }
        } catch(e) {
            addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to read leaderboard.</span>` });
        }
        break;
      }
      case 'who': {
        addLine({ type: 'output', text: ` <span class="t-dim">Scanning planetary biosignatures...</span>` });
        const presences = window.__VISITOR_PRESENCE__ || [];
        if (presences.length > 0) {
          const whoLines = presences.map(p => ({
            type: 'output' as const,
            text: ` <span class="t-cyan">●</span> <span class="t-yellow font-bold">${p.alias}</span> <span class="t-dim">(connected since ${new Date(p.online_at).toLocaleTimeString()})</span>`
          }));
          addLine({ type: 'output', text: `\n <span class="t-purple font-bold">--- ACTIVE VISITORS ONLINE ---</span>\n` });
          addLines(whoLines, 100);
        } else {
          addLine({ type: 'output', text: ` <span class="t-dim">You are alone. Or the sensors are broken.</span>` });
        }
        break;
      }

      /* ── admin commands ── */
      case 'sudo': case 'su': case 'login':
        if (isAdmin) {
          addLine({ type: 'output', text: ` <span class="t-green">✓ You are already logged in as Admin.</span>` });
        } else {
          setAuthStep('password');
        }
        break;
      case 'admin':
        if (!isAdmin) { addLine({ type: 'output', text: ` <span class="t-red">✗ Permission denied.</span>` }); break; }
        addLine({ type: 'output', text: `
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
 <span class="t-dim">─────────────────────────────────────────</span>` });
        break;
      case 'telemetry': {
        if (!isAdmin) { addLine({ type: 'output', text: ` <span class="t-red">✗ Permission denied.</span>` }); break; }
        addLine({ type: 'output', text: ` <span class="t-dim">Fetching global command telemetry...</span>` });
        try {
          const { data } = await supabase.from('command_logs').select('*').order('created_at', { ascending: false }).limit(10);
          if (data && data.length > 0) {
            const teleLines = data.map(log => ({
              type: 'output' as const,
              text: ` <span class="t-dim">[${new Date(log.created_at).toLocaleTimeString()}]</span> <span class="t-cyan">VISITOR</span> <span class="t-green">executed:</span> <span class="t-white">${log.command}</span>`
            }));
            addLine({ type: 'output', text: `\n <span class="t-purple font-bold">--- RECENT VISITOR TELEMETRY ---</span>\n` });
            addLines(teleLines, 100);
          } else {
            addLine({ type: 'output', text: ` <span class="t-dim">No telemetry data available.</span>` });
          }
        } catch(e) {
            addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to read telemetry.</span>` });
        }
        break;
      }
      case 'set': {
        if (!isAdmin) { addLine({ type: 'output', text: ` <span class="t-red">✗ Permission denied.</span>` }); break; }
        const parts = cmd.substring(4).trim().split(' ');
        if (parts.length < 2) { addLine({ type: 'output', text: ` <span class="t-red">Usage: set [key] [value]</span>` }); break; }
        const key = parts[0];
        const value = parts.slice(1).join(' ');
        try {
          await supabase.from('admin_settings').upsert([{ key, value }]);
          if (key === 'motd') (window as any).__MOTD__ = value;
          addLine({ type: 'output', text: ` <span class="t-green">✓ System configuration updated: ${key} = ${value}</span>` });
        } catch(e) {
          addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to update settings.</span>` });
        }
        break;
      }
      case 'logout':
        if (isAdmin) {
          setIsAdmin(false);
          addLine({ type: 'output', text: ` <span class="t-green">✓ Logged out successfully.</span>` });
        } else {
          addLine({ type: 'output', text: ` You are not logged in.` });
        }
        break;
      case 'deploy': {
        if (!isAdmin) { addLine({ type: 'output', text: ` <span class="t-red">✗ Permission denied.</span>` }); break; }
        const deployLines = [
          { type: 'output' as const, text: ` <span class="t-dim">Initializing deployment sequence...</span>` },
          { type: 'output' as const, text: ` <span class="t-cyan">Building production bundle (Vite)</span>` },
          { type: 'output' as const, text: ` <span class="t-dim">✓ 142 modules transformed.</span>` },
          { type: 'output' as const, text: ` <span class="t-yellow">Uploading assets to CDN... [██████████] 100%</span>` },
          { type: 'output' as const, text: ` <span class="t-green">DEPLOYMENT SUCCESSFUL.</span> <span class="t-dim">Live at rakesh.dev</span>` },
        ];
        addLines(deployLines, 600);
        break;
      }
      case 'users': case 'connections': {
        if (!isAdmin) { addLine({ type: 'output', text: ` <span class="t-red">✗ Permission denied.</span>` }); break; }
        addLine({ type: 'output', text: ` <span class="t-dim">Scanning active network connections...</span>` });
        
        const presences = window.__VISITOR_PRESENCE__ || [];
        const activeCount = Math.max(presences.length, 1);
        
        let usersList = '';
        if (presences.length > 0) {
          usersList = presences.map(p => {
            const isRoot = p.alias === 'root' || (visitorName && p.alias === visitorName);
            const displayIp = p.ip || '127.0.0.1';
            const displayCity = p.city || 'Unknown';
            const displayOrg = p.org || 'ISP';
            const cityStr = `(${displayCity})`;
            return `  <span class="t-${isRoot ? 'green' : 'dim'} font-bold">${sanitizeHTML(p.alias).padEnd(12)}</span> ${displayIp.padEnd(16)} ${cityStr.padEnd(14)} <span class="t-dim">${displayOrg}</span>`;
          }).join('\n');
        } else {
           usersList = `  <span class="t-green font-bold">root        </span> 127.0.0.1        (local     ) <span class="t-dim">Localhost</span>`;
        }
        
        addLine({ type: 'output', text: `
 <span class="t-dim">ACTIVE CONNECTIONS: ${activeCount}</span>
 <span class="t-dim">─────────────────────────────────────────────────────────</span>
${usersList}
 <span class="t-dim">─────────────────────────────────────────────────────────</span>` });
        break;
      }
      case 'config': {
        if (!isAdmin) { addLine({ type: 'output', text: ` <span class="t-red">✗ Permission denied.</span>` }); break; }
        addLine({ type: 'output', text: `
 <span class="t-yellow">{</span>
   <span class="t-green">"siteName"</span>: <span class="t-cyan">"Rakesh Portfolio"</span>,
   <span class="t-green">"version"</span>: <span class="t-cyan">"2.0.26"</span>,
   <span class="t-green">"mode"</span>: <span class="t-cyan">"production"</span>,
   <span class="t-green">"features"</span>: <span class="t-yellow">{</span>
     <span class="t-green">"terminal"</span>: <span class="t-purple">true</span>,
     <span class="t-green">"hire_wizard"</span>: <span class="t-purple">true</span>,
     <span class="t-green">"easter_eggs"</span>: <span class="t-purple">true</span>
   <span class="t-yellow">}</span>,
   <span class="t-green">"admin_access"</span>: <span class="t-purple">true</span>
 <span class="t-yellow">}</span>` });
        break;
      }
      case 'stats': {
        if (!isAdmin) { addLine({ type: 'output', text: ` <span class="t-red">✗ Permission denied.</span>` }); break; }
        
        addLine({ type: 'output', text: ` <span class="t-dim">Fetching real-time database metrics...</span>` });
        
        let totalViews = 'N/A';
        try {
          const { data } = await supabase.from('page_views').select('view_count').eq('id', 1).single();
          if (data) totalViews = data.view_count.toString();
        } catch(e) {}

        const activeVis = window.__ACTIVE_VISITORS__ || 1;
        const mem = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Unknown';
        const conn = (navigator as any).connection ? (navigator as any).connection.effectiveType.toUpperCase() : 'WIFI';
        const time = Math.floor(performance.now() / 1000);
        const uptime = `${Math.floor(time / 60).toString().padStart(2, '0')}m ${(time % 60).toString().padStart(2, '0')}s`;
        const res = `${window.innerWidth}x${window.innerHeight}`;
        const cores = navigator.hardwareConcurrency || 4;

        const makeRow = (label: string, val: string, color: string = 't-green') => {
          const rawLen = label.length + val.length + 5; // "  " + label + " : " + val
          const spaces = Math.max(0, 52 - rawLen);
          return ` <span class="t-purple">║</span>  <span class="t-yellow">${label}</span> : <span class="${color} font-bold">${val}</span>${' '.repeat(spaces)}<span class="t-purple">║</span>`;
        };

        addLine({ type: 'output', text: `
 <span class="t-purple">╔════════════════════════════════════════════════════╗</span>
 <span class="t-purple">║</span>  <span class="t-white font-bold">REALTIME CLIENT & SERVER DIAGNOSTICS</span>              <span class="t-purple">║</span>
 <span class="t-purple">╠════════════════════════════════════════════════════╣</span>
${makeRow('Active Visitors ', activeVis.toString(), 't-green')}
${makeRow('Total Page Views', totalViews, 't-cyan')}
${makeRow('Session Uptime  ', uptime, 't-cyan')}
${makeRow('Viewport Res    ', res, 't-green')}
${makeRow('Network Type    ', conn, 't-yellow')}
${makeRow('Device Memory   ', mem, 't-green')}
${makeRow('Logical Cores   ', cores.toString(), 't-cyan')}
${makeRow('Browser Platform', navigator.platform || 'Unknown', 't-white')}
${makeRow('System Language ', navigator.language, 't-dim')}
${makeRow('Pixel Ratio     ', `${window.devicePixelRatio}x`, 't-yellow')}
 <span class="t-purple">╚════════════════════════════════════════════════════╝</span>` });
        break;
      }
      case 'logs': {
        if (!isAdmin) { addLine({ type: 'output', text: ` <span class="t-red">✗ Permission denied.</span>` }); break; }
        
        addLine({ type: 'output', text: ` <span class="t-dim">Connecting to secure log stream... (Type 'clear' to exit)</span>` });
        let fetchedLogs = false;
        try {
          const { data } = await supabase.from('command_logs').select('*').order('created_at', { ascending: false }).limit(6);
          if (data && data.length > 0) {
            const remoteLogs = data.reverse().map(l => ({
              type: 'output' as const,
              text: ` <span class="t-dim">[${new Date(l.created_at).toLocaleTimeString()}]</span> <span class="t-yellow">${l.visitor_ip}</span> <span class="t-white">executed:</span> <span class="t-cyan">${l.command}</span>`
            }));
            addLines(remoteLogs, 300);
            fetchedLogs = true;
          }
          setIsTailingLogs(true);
        } catch(e) {}

        if (!fetchedLogs) {
          const entries = performance.getEntriesByType('resource').slice(-6);
          if (entries.length === 0) {
            addLine({ type: 'output', text: ` <span class="t-dim">No network logs available. Try refreshing.</span>` });
            break;
          }
          const logLines = entries.map(e => {
            const name = e.name.split('/').pop()?.split('?')[0] || 'unknown';
            const dur = Math.round(e.duration);
            const time = new Date().toLocaleTimeString();
            const color = dur > 50 ? 't-yellow' : 't-cyan';
            return { type: 'output' as const, text: ` <span class="t-dim">[${time}]</span> <span class="${color}">FETCH</span> ${name.substring(0, 24).padEnd(24, ' ')} <span class="t-dim">(${dur}ms)</span>` };
          });
          logLines.unshift({ type: 'output', text: ` <span class="t-dim">Tailing local network activity...</span>` });
          addLines(logLines, 300);
        }
        break;
      }

      /* ── fun commands ── */
      case 'fortune':
        addLine({ type: 'output', text: ` ${FORTUNES[Math.floor(Math.random() * FORTUNES.length)]}` }); break;
      case 'matrix':
        addLine({ type: 'output', text: MATRIX_ART }); break;
      case 'coffee': case 'chai':
        addLine({ type: 'output', text: COFFEE_ART }); break;
      case 'flip':
        addLine({ type: 'output', text: FLIP_ART }); break;
      case 'top': {
        addLine({ type: 'output', text: `
 <span class="t-dim">PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND</span>
   1 root      20   0  214.2M  45.1M  12.3M S  12.4   0.4   0:01.23 <span class="t-green">vite</span>
   2 root      20   0  512.0M 124.2M  45.0M S  45.2   1.2   0:04.56 <span class="t-yellow">react-dom</span>
   3 visitor   20   0  112.5M  24.1M  10.0M R   8.1   0.2   0:00.45 <span class="t-cyan">framer-motion</span>
   4 root      20   0   45.1M   8.4M   4.1M S   0.0   0.1   0:00.12 <span class="t-white">terminal-ui</span>` });
        break;
      }
      case 'theme':
        addLine({ type: 'output', text: ` <span class="t-yellow">Theme changing is locked by Admin.</span> <span class="t-dim">Dark mode is superior anyway.</span> 😎` }); break;
      case 'whoami':
        addLine({ type: 'output', text: ` ${isAdmin ? 'root' : 'visitor'}` }); break;
      case 'neofetch':
        addLine({ type: 'output', text: NEOFETCH }); break;
      case 'sudo hire':
        addLine({ type: 'output', text: ` <span class="t-green">[sudo] password accepted.</span>\n <span class="t-white font-bold">Congratulations! Rakesh has been hired immediately.</span>\n <span class="t-dim">Just kidding — but seriously, let's talk!</span> 🤝\n Type '<span class="t-green">hire</span>' to send a real message.` }); break;
      case 'sudo rm -rf /': case 'sudo rm -rf':
        addLine({ type: 'output', text: ` <span class="t-red">⚠ Nice try!</span> <span class="t-dim">This portfolio has plot armor.</span> 🛡️` }); break;
      case 'hack': {
        const geo = (window as any).__GEO_DATA__ || { ip: '127.0.0.1', city: 'Unknown', org: 'ISP' };
        const agent = navigator.userAgent;
        let os = 'Unknown OS';
        if (agent.includes('Win')) os = 'Windows';
        else if (agent.includes('Mac')) os = 'macOS';
        else if (agent.includes('Linux')) os = 'Linux';
        else if (agent.includes('Android')) os = 'Android';
        else if (agent.includes('like Mac OS')) os = 'iOS';

        const cores = navigator.hardwareConcurrency || 'unknown';
        const ram = (navigator as any).deviceMemory || 'unknown';
        const res = `${window.screen.width}x${window.screen.height}`;

        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

        // Use an IIFE so we can use async/await within the switch case without making the whole exec function async
        (async () => {
          addLine({ type: 'output', text: ` <span class="t-red font-bold animate-pulse">[!] CRITICAL: UNAUTHORIZED INGRESS DETECTED [!]</span>` });
          await sleep(1500);

          addLine({ type: 'output', text: ` <span class="t-dim">[*] Tracing origin...</span>` });
          await sleep(2000);
          addLine({ type: 'output', text: ` <span class="t-dim">[*] Target locked:</span> <span class="t-cyan font-bold">${geo.ip}</span> <span class="t-dim">(${geo.city} via ${geo.org})</span>` });
          await sleep(1200);

          addLine({ type: 'output', text: ` <span class="t-dim">[*] Fingerprinting host...</span>` });
          await sleep(1800);
          addLine({ type: 'output', text: ` <span class="t-yellow">[*] SYSTEM IDENTIFIED: ${os} | ${cores} CPU Cores | ${ram}GB RAM | ${res} Display</span>` });
          await sleep(1500);

          addLine({ type: 'output', text: ` <span class="t-dim">[*] Initializing CVE-2024-3094 exploit payload...</span>` });
          await sleep(2500);
          addLine({ type: 'output', text: ` <span class="t-dim">[*] Escaping browser sandbox...</span>` });
          await sleep(3000);
          addLine({ type: 'output', text: ` <span class="t-green font-bold">[*] ROOT PRIVILEGES OBTAINED. Kernel access granted.</span>` });
          await sleep(1000);

          addLine({ type: 'output', text: ` <span class="t-dim">[*] Deploying silent rootkit...</span>` });
          await sleep(800);
          addLine({ type: 'output', text: ` <span class="t-dim">[*] Extracting saved browser credentials, cookies, and crypto keys...</span>` });
          await sleep(2200);
          addLine({ type: 'output', text: ` <span class="t-yellow font-bold">[*] 142 CREDENTIALS COMPROMISED. 3 CRYPTO WALLETS LOCATED.</span>` });
          await sleep(2000);

          addLine({ type: 'output', text: ` <span class="t-red font-bold">[*] UPLOADING DATA TO COMMAND & CONTROL SERVER (104.22.18.99)...</span>` });
          
          // Fake progress bar
          for (let p = 10; p <= 100; p += 15) {
             await sleep(800);
             addLine({ type: 'output', text: ` <span class="t-dim">    [${'#'.repeat(p/5)}${'.'.repeat(20 - (p/5))}] ${p}%</span>` });
          }
          await sleep(500);
          addLine({ type: 'output', text: ` <span class="t-green font-bold">[*] EXFILTRATION COMPLETE.</span>` });
          await sleep(2000);

          addLine({ type: 'output', text: `\n <span class="t-yellow font-bold">[*] INITIATING AES-256 FILE SYSTEM ENCRYPTION...</span>\n` });
          await sleep(1500);

          const dirs = os === 'Windows' ? ['C:\\Users\\Admin\\Documents', 'C:\\Users\\Admin\\Pictures', 'C:\\Users\\Admin\\Desktop', 'C:\\Users\\Admin\\Downloads', 'C:\\Windows\\System32', 'C:\\Program Files\\Steam\\steamapps', 'C:\\Users\\Admin\\AppData\\Roaming'] : ['/home/user/Documents', '/home/user/Pictures', '/home/user/Desktop', '/home/user/Downloads', '/var/log', '/etc/ssh', '/home/user/.config'];
          
          // Fast encryption loop
          const encLines: Line[] = [];
          for (let i = 0; i < 250; i++) {
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const ext = ['.jpg', '.pdf', '.docx', '.mp4', '.key', '.png', '.xlsx', '.zip', '.txt', '.csv', '.pem', '.sqlite'][Math.floor(Math.random() * 12)];
            const filename = Math.random().toString(36).substring(2, 12);
            encLines.push({ type: 'output', text: `  <span class="t-red font-mono">ENCRYPTING:</span> <span class="t-dim">${dir}${os === 'Windows' ? '\\' : '/'}${filename}${ext}</span> <span class="t-white">-></span> <span class="t-green font-mono">${filename}.LOCKED</span>` });
          }
          addLines(encLines, 30); // Super fast scrolling

          // Wait for the scrolling to finish before showing the final threat
          await sleep(250 * 30 + 1000); 

          addLine({ type: 'output', text: `\n <span class="t-red text-2xl font-bold bg-red-900/30 border border-red-500 px-4 py-2 mt-4 inline-block animate-pulse w-full text-center">⚠ YOUR DEVICE HAS BEEN ENCRYPTED ⚠</span>` });
          await sleep(1000);
          addLine({ type: 'output', text: ` <span class="t-red font-bold text-lg mt-2 inline-block">All your files, photos, databases, and crypto wallets have been locked.</span>\n <span class="t-dim">Your IP (${geo.ip}) and physical location (${geo.city}) have been logged to our secure offshore servers.</span>` });
          await sleep(1500);
          addLine({ type: 'output', text: ` <span class="t-red font-bold text-xl mt-2 block animate-pulse">Transfer 0.5 BTC to 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa within 48 hours to receive the decryption key.</span>\n <span class="t-dim">If payment is not received, your private data will be leaked to the public internet.</span>\n` });
          
          await sleep(8000); // Let them sweat for a solid 8 seconds

          addLine({ type: 'output', text: ` <span class="t-white text-xl">...okay, you can breathe now!</span> 😅\n <span class="t-dim">No files were actually touched. I just pulled your hardware specs (${cores} Cores / ${ram}GB RAM) and IP from standard browser APIs.</span>\n <span class="t-dim">If this ransomware simulation made you sweat, type '</span><span class="t-green">hire</span><span class="t-dim">'!</span>\n` });
        })();
        break;
      }
      case 'time': case 'date':
        addLine({ type: 'output', text: ` 🕐 ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'medium' })}` }); break;
      case 'history':
        addLine({ type: 'output', text: history.length ? history.map((h, i) => `  <span class="t-dim">${String(i + 1).padStart(3)}</span>  ${h}`).join('\n') : ' <span class="t-dim">No commands in history yet.</span>' }); break;
      case 'ls':
        addLine({ type: 'output', text: ` <span class="t-cyan">about.md</span>  <span class="t-cyan">contact.md</span>  <span class="t-cyan">skills.json</span>  <span class="t-yellow">projects/</span>  <span class="t-yellow">secret/</span>  <span class="t-green">README.md</span>` }); break;
      case 'cat readme.md': case 'cat readme':
        addLine({ type: 'output', text: ` <span class="t-white font-bold"># Rakesh Sarkar</span>\n <span class="t-dim">Full-stack developer who writes code and breaks things (mostly on purpose).</span>\n <span class="t-green">★ Open to opportunities</span>` }); break;
      case 'weather': {
        addLine({ type: 'output', text: ` <span class="t-dim">Detecting location and fetching weather...</span>` });
        fetch('https://wttr.in/?format=j1')
          .then(res => res.json())
          .then(data => {
            const current = data.current_condition[0];
            const loc = data.nearest_area[0].areaName[0].value;
            const temp = current.temp_C;
            const desc = current.weatherDesc[0].value;
            addLine({ type: 'output', text: ` <span class="t-cyan">☁️ ${loc}: ${desc}, ${temp}°C</span>` });
          })
          .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch weather.</span>` }));
        break;
      }
      case 'joke': {
        addLine({ type: 'output', text: ` <span class="t-dim">Fetching a joke...</span>` });
        fetch('https://v2.jokeapi.dev/joke/Programming,Miscellaneous?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single')
          .then(res => res.json())
          .then(data => {
            if (data.joke) addLine({ type: 'output', text: ` <span class="t-yellow">"${data.joke}"</span>` });
            else addLine({ type: 'output', text: ` <span class="t-red">✗ No joke found.</span>` });
          })
          .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch joke.</span>` }));
        break;
      }
      case 'quote': {
        addLine({ type: 'output', text: ` <span class="t-dim">Fetching an inspirational quote...</span>` });
        fetch('https://dummyjson.com/quotes/random')
          .then(res => res.json())
          .then(data => addLine({ type: 'output', text: ` <span class="t-green">"${data.quote}"</span>\n <span class="t-dim">— ${data.author}</span>` }))
          .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch quote.</span>` }));
        break;
      }
      case 'pokemon': {
        const id = Math.floor(Math.random() * 151) + 1;
        addLine({ type: 'output', text: ` <span class="t-dim">Throwing a Pokeball...</span>` });
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
          .then(res => res.json())
          .then(data => {
            const types = data.types.map((t: any) => t.type.name).join(', ');
            addLine({ type: 'output', text: ` <span class="t-red font-bold">Gotcha!</span> <span class="t-white">You caught a wild <span class="t-cyan font-bold capitalize">${data.name}</span>!</span>\n <span class="t-dim">Type: ${types} | Height: ${data.height/10}m | Weight: ${data.weight/10}kg</span>` });
          })
          .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ The Pokemon broke free!</span>` }));
        break;
      }
      case 'github': {
        addLine({ type: 'output', text: ` <span class="t-dim">Fetching GitHub stats for bloodwraith8851...</span>` });
        fetch('https://api.github.com/users/bloodwraith8851')
          .then(res => res.json())
          .then(data => {
            addLine({ type: 'output', text: ` <span class="t-green font-bold">@${data.login}</span> <span class="t-dim">(${data.name})</span>\n <span class="t-cyan">Repos:</span> ${data.public_repos} | <span class="t-yellow">Followers:</span> ${data.followers} | <span class="t-purple">Following:</span> ${data.following}\n <span class="t-dim">Profile:</span> <a href="${data.html_url}" target="_blank" class="t-link">${data.html_url}</a>` });
          })
          .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch GitHub stats.</span>` }));
        break;
      }
      case 'crypto': case 'btc': {
        addLine({ type: 'output', text: ` <span class="t-dim">Fetching live crypto prices...</span>` });
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd')
          .then(res => res.json())
          .then(data => {
            addLine({ type: 'output', text: ` <span class="t-yellow font-bold">Bitcoin (BTC):</span> $${data.bitcoin.usd.toLocaleString()}\n <span class="t-purple font-bold">Ethereum (ETH):</span> $${data.ethereum.usd.toLocaleString()}\n <span class="t-cyan font-bold">Solana (SOL):</span> $${data.solana.usd.toLocaleString()}` });
          })
          .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch crypto prices.</span>` }));
        break;
      }
      case 'news': case 'tech': {
        addLine({ type: 'output', text: ` <span class="t-dim">Fetching top tech stories from Hacker News...</span>` });
        fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
          .then(res => res.json())
          .then(ids => Promise.all(ids.slice(0, 3).map((id: number) => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json()))))
          .then(stories => {
            const html = stories.map((s, i) => ` <span class="t-dim">${i+1}.</span> <a href="${s.url}" target="_blank" class="t-link hover:text-green-400">${s.title}</a> <span class="t-dim">(${s.score} pts)</span>`).join('\n');
            addLine({ type: 'output', text: html });
          })
          .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch news.</span>` }));
        break;
      }
      case 'trivia': {
        addLine({ type: 'output', text: ` <span class="t-dim">Fetching random tech trivia...</span>` });
        fetch('https://opentdb.com/api.php?amount=1&category=18&type=multiple')
          .then(res => res.json())
          .then(data => {
            const q = data.results[0];
            const cleanQ = q.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
            const cleanA = q.correct_answer.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
            addLine({ type: 'output', text: ` <span class="t-cyan font-bold">Q:</span> <span class="t-white">${cleanQ}</span>\n <span class="t-green font-bold">A:</span> <span class="opacity-0 hover:opacity-100 transition-opacity duration-300 bg-white/20 px-1 rounded cursor-help">${cleanA}</span> <span class="t-dim">(Hover to reveal)</span>` });
          })
          .catch(() => addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch trivia.</span>` }));
        break;
      }
      case 'cd secret': case 'cat secret':
        addLine({ type: 'output', text: ` <span class="t-red">🔒 Permission denied.</span> <span class="t-dim">Some secrets are meant to stay hidden...</span>\n <span class="t-dim">Hint: try '</span><span class="t-yellow">matrix</span><span class="t-dim">' instead.</span>` }); break;
      case 'pwd':
        addLine({ type: 'output', text: ` /home/visitor/rakesh-portfolio` }); break;
      case 'exit': case 'quit':
        addLine({ type: 'output', text: ` <span class="t-dim">There is no escape.</span> <span class="t-yellow">You're stuck here forever.</span> 😈\n <span class="t-dim">Just kidding. But why leave? Type '</span><span class="t-green">hire</span><span class="t-dim">' instead!</span>` }); break;
      case 'ping':
        addLine({ type: 'output', text: ` <span class="t-green">PONG!</span> <span class="t-dim">64 bytes from rakesh.dev: time=0.42ms</span> 🏓` }); break;
      case 'hello': case 'hi': case 'hey':
        addLine({ type: 'output', text: ` Hey there! 👋 <span class="t-dim">Nice to meet you.</span>\n Type '<span class="t-green">about</span>' to learn more about me!` }); break;
      case '42':
        addLine({ type: 'output', text: ` <span class="t-yellow">The Answer to the Ultimate Question of Life, the Universe, and Everything.</span> 🌌` }); break;
      case '':  break;
      default:
        addLine({ type: 'output', text: ` <span class="t-red">command not found:</span> ${cmd}\n Type '<span class="t-green">help</span>' for available commands.` }); break;
    }
  }, [addLine, addLines, hireStep, hireData, history, authStep, isAdmin, isChatMode, isTailingLogs, identityStep, visitorName]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (ready || identityStep)) { exec(input); setInput(''); }
    /* arrow key history */
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      const idx = histIdx < history.length - 1 ? histIdx + 1 : histIdx;
      setHistI(idx);
      setInput(history[history.length - 1 - idx]);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) { const idx = histIdx - 1; setHistI(idx); setInput(history[history.length - 1 - idx]); }
      else { setHistI(-1); setInput(''); }
    }
  };

  const PROMPT = helpStep
    ? '<span class="t-cyan font-bold">Select section (1-4) or &apos;q&apos; to quit: </span>'
    : identityStep
      ? '<span class="t-yellow font-bold">Alias: </span>'
      : hireStep
        ? '<span class="t-yellow font-bold">> </span>'
        : isAdmin 
          ? '<span class="t-red font-bold">root</span><span class="t-dim">@</span><span class="t-purple">rakesh.dev</span><span class="t-white font-bold">:#</span>' 
          : `<span class="t-green">${visitorName || 'visitor'}</span><span class="t-dim">@</span><span class="t-purple">rakesh.dev</span><span class="t-white">:~$</span>`;

  return (
    <section ref={wrapRef} id="contact" className="relative z-20 w-full bg-[#0c0c0c] pt-8 sm:pt-12 pb-8 sm:pb-14"
      style={{ minHeight: '120vh' }}>

      {/* grid bg */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(126,231,135,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(126,231,135,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* ── massive heading ── */}
      <div className="relative flex flex-col items-center justify-center pt-8 sm:pt-12 pb-12 sm:pb-16 overflow-hidden">
        <motion.h2
          className="font-black uppercase text-center select-none"
          style={{
            fontSize: 'clamp(4.5rem, 18vw, 16rem)',
            letterSpacing: '-0.03em',
            lineHeight: 0.85,
            background: 'linear-gradient(180deg, #646973 0%, #bbccd7 50%, #646973 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          CONTACT
        </motion.h2>
        <motion.span
          className="mt-4 sm:mt-6 font-mono uppercase tracking-[0.3em] text-white/20"
          style={{ fontSize: '0.7rem' }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          // 04 · GET IN TOUCH
        </motion.span>
      </div>

      {/* sticky terminal */}
      <div className="sticky top-4 sm:top-10">
        <motion.div className="relative mx-3 sm:mx-5 md:mx-8"
          style={{ y: termY, scale: termScale, opacity: termOp }}>

          {/* glow */}
          <motion.div className="absolute -inset-24 rounded-3xl pointer-events-none"
            style={{ opacity: glowOp, background: 'radial-gradient(ellipse at center, rgba(126,231,135,0.08) 0%, transparent 70%)' }} />

          <div className="relative rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 30px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(126,231,135,0.08), 0 0 80px rgba(126,231,135,0.04)' }}>

            {/* title bar */}
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/5"
              style={{ background: 'linear-gradient(180deg, #1e2028 0%, #181a20 100%)' }}>
              <div className="flex gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] shadow-[0_0_8px_rgba(255,95,87,0.4)]" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] shadow-[0_0_8px_rgba(255,189,46,0.4)]" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#28c840] shadow-[0_0_8px_rgba(40,200,64,0.4)]" />
              </div>
              <div className="flex-1 flex justify-center">
                <span className="text-xs text-white/25 font-mono flex items-center gap-1.5">
                  <span className="text-[#28c840]/60">🔒</span> terminal.rakesh.dev — bash
                </span>
              </div>
              <div className="w-16" />
            </div>

            {/* body — BIGGER */}
            <div ref={termRef} onClick={() => inputRef.current?.focus()}
              className="relative p-6 sm:p-10 font-mono text-[14px] sm:text-[16px] overflow-y-auto cursor-text"
              style={{
                minHeight: '70vh', maxHeight: '80vh',
                lineHeight: 1.75,
                background: 'linear-gradient(180deg, #0d1117 0%, #0a0d12 100%)',
              }}>

              {/* scanlines */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
              }} />

              {isSnakeMode ? (
                <SnakeGame visitorName={visitorName} onExit={() => { setIsSnakeMode(false); inputRef.current?.focus(); }} />
              ) : (
                <>
              {lines.map((line, i) => {
                if (line.type === 'command') {
                  const linePrompt = (identityStep && i === 0 && !line.text.startsWith('sudo') && !line.text.startsWith('login')) ? '<span class="t-yellow font-bold">Alias: </span>' : line.isAuth ? '<span class="t-white font-bold">[sudo] password for visitor: </span>' : line.isHire ? '<span class="t-yellow font-bold">> </span>' : (isAdmin && !line.text.startsWith('sudo') && !line.text.startsWith('login') && !line.isAuth ? '<span class="t-red font-bold">root</span><span class="t-dim">@</span><span class="t-purple">rakesh.dev</span><span class="t-white font-bold">:#</span>' : `<span class="t-green">${visitorName || 'visitor'}</span><span class="t-dim">@</span><span class="t-purple">rakesh.dev</span><span class="t-white">:~$</span>`);
                  return (
                    <div key={i} className="mb-2 relative">
                      <span dangerouslySetInnerHTML={{ __html: linePrompt }} />{' '}
                      {line.isTyping ? <TypewriterSpan text={line.text} /> : <span className="t-body">{line.text}</span>}
                    </div>
                  );
                }
                if (line.type === 'ascii') {
                  return (
                    <motion.pre key={i} className="t-ascii mb-4 whitespace-pre overflow-x-auto"
                      initial={{ opacity: 0, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      transition={{ duration: 0.8 }}>
                      {line.text}
                    </motion.pre>
                  );
                }
                return (
                  <motion.div key={i} className="mb-4 t-output whitespace-pre-wrap"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    dangerouslySetInnerHTML={{ __html: line.text }} />
                );
              })}

              {/* Visitor Map — rendered inline in terminal output */}
              {isMapMode && (
                <div className="my-4">
                  <VisitorMap onClose={() => setIsMapMode(false)} />
                </div>
              )}

              {/* input line */}
              {(ready || identityStep) && (
                <div className="mb-1 relative">
                  <span dangerouslySetInnerHTML={{ __html: authStep === 'password' ? '<span class="t-white font-bold">[sudo] password for visitor: </span>' : PROMPT }} />{' '}
                  {/* visible text + cursor */}
                  <span className="t-body ml-1">
                    {authStep === 'password' 
                      ? '•'.repeat(input.length) || (hireStep ? '' : <span className="t-dim">type password...</span>)
                      : input || (hireStep ? '' : <span className="t-dim">type a command...</span>)}
                  </span>
                  <motion.span className="inline-block w-2.5 h-[1.1em] bg-[#7ee787] rounded-sm align-middle ml-px"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
                  {/* hidden input captures keystrokes */}
                  <input ref={inputRef} type="text" value={input}
                    onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                      className="absolute inset-0 opacity-0 cursor-text"
                      autoComplete="off" spellCheck={false} />
                  </div>
                )}

                <div ref={bottomRef} />
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* hints */}
        <motion.div className="text-center mt-5 sm:mt-6"
          animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 3 }}>
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-full border border-white/5 bg-white/[0.02] flex-wrap justify-center">
            {['help', 'contact', 'hire', 'skills', 'joke', 'matrix'].map(c => (
              <button key={c} onClick={() => { if (ready) { exec(c); setInput(''); } }}
                className="text-xs font-mono text-[#7ee787]/40 hover:text-[#7ee787] transition-colors cursor-pointer px-1">
                {c}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* footer */}
      <div className="relative mt-16 sm:mt-20 px-6 sm:px-10 md:px-14 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="font-mono uppercase tracking-widest text-white/20" style={{ fontSize: '0.64rem' }}>© 2026 RAKESH SARKAR</span>
        <span className="font-mono uppercase tracking-widest text-white/10" style={{ fontSize: '0.64rem' }}>DESIGNED &amp; BUILT IN DELHI</span>
      </div>
    </section>
  );
};

export default ContactSection;
