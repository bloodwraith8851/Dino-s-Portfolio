import type { CommandContext } from './types';
import {
  HELP_INDEX,
  HELP_GENERAL,
  HELP_INTERACTIVE,
  HELP_SYSTEM,
  HELP_FUN,
  ABOUT_TEXT,
  CONTACT_TEXT,
  SOCIAL_TEXT,
  SKILLS_TEXT,
  NEOFETCH,
} from './constants';
import * as fun from './commands/funCommands';
import * as admin from './commands/adminCommands';
import * as social from './commands/socialCommands';

interface AppActions {
  clearLines: () => void;
  setVisitorName: (name: string) => void;
  initiateAuth: () => void;
  initiateHire: () => void;
  enterChat: () => void;
  toggleLogs: () => void;
  toggleWatch: (state?: boolean) => void;
  disableAllFeeds: () => void;
  setSnakeMode: (state: boolean) => void;
  setMapMode: (state: boolean) => void;
  setHelpMode: (state: boolean) => void;
  logout: () => void;
}

export async function processCommand(
  cmdStr: string,
  ctx: CommandContext,
  actions: AppActions,
  state: {
    isFirstTime: boolean;
    isHelpMode: boolean;
  },
) {
  const { addLine, addLines, isAdmin, visitorName, history, supabase, sanitizeHTML } = ctx;
  const cmd = cmdStr.trim();
  const lowCmd = cmd.toLowerCase();

  // 1. Identity Registration
  if (state.isFirstTime) {
    if (!cmd) return;
    const name = cmd
      .substring(0, 20)
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim();
    if (name.length < 2) {
      addLine({ type: 'output', text: ` <span class="t-red">Name must be at least 2 alphanumeric characters.</span>` });
      return;
    }
    localStorage.setItem('visitor_alias', name);
    actions.setVisitorName(name);
    addLine({
      type: 'output',
      text: ` <span class="t-green">Identity confirmed. Welcome to the network, ${name}.</span>`,
    });
    addLine({ type: 'output', text: ` Type '<span class="t-green">help</span>' to see available commands.` });
    return;
  }

  if (!cmd) return;

  // 2. Help Menu Interactions
  if (state.isHelpMode) {
    if (lowCmd === 'q' || lowCmd === 'quit') {
      actions.setHelpMode(false);
      addLine({ type: 'output', text: ` <span class="t-dim">Exited help menu.</span>` });
      return;
    }
    switch (lowCmd) {
      case '1':
        addLine({ type: 'output', text: HELP_GENERAL });
        return;
      case '2':
        addLine({ type: 'output', text: HELP_INTERACTIVE });
        return;
      case '3':
        addLine({ type: 'output', text: HELP_SYSTEM });
        return;
      case '4':
        addLine({ type: 'output', text: HELP_FUN });
        return;
    }
    // Fallthrough: if not 1-4/q, exit help mode and process normally
    actions.setHelpMode(false);
  }

  // 3. Telemetry Logging (for normal commands)
  const isExcluded = ['sudo', 'su', 'login', 'admin', 'hire'].includes(lowCmd);
  if (!isAdmin && !isExcluded && lowCmd) {
    (async () => {
      try {
        await supabase.from('command_logs').insert([{ visitor_alias: visitorName || 'Anonymous', command: cmd }]);
      } catch {
        /* table may not exist — silently skip */
      }
    })();
  }

  // 4. Command Router
  const parts = cmd.split(' ');
  const baseCmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  switch (baseCmd) {
    // --- Help ---
    case 'help':
    case 'h':
      addLine({ type: 'output', text: HELP_INDEX });
      actions.setHelpMode(true);
      addLine({ type: 'output', text: ` <span class="t-dim">Select a category (1-4) or 'q' to quit:</span>` });
      break;

    // --- Static Info ---
    case 'about':
      addLine({ type: 'output', text: ABOUT_TEXT });
      break;
    case 'contact':
      addLine({ type: 'output', text: CONTACT_TEXT });
      break;
    case 'social':
      addLine({ type: 'output', text: SOCIAL_TEXT });
      break;
    case 'skills':
      addLine({ type: 'output', text: SKILLS_TEXT });
      break;
    case 'neofetch':
      addLine({ type: 'output', text: NEOFETCH });
      break;
    case 'whoami':
      addLine({
        type: 'output',
        text: isAdmin
          ? ` <span class="t-green font-bold">root</span> <span class="t-dim">(Superuser)</span>`
          : ` <span class="t-white">${visitorName}</span> <span class="t-dim">(Guest Visitor)</span>`,
      });
      break;

    // --- Core Navigation ---
    case 'clear':
      actions.clearLines();
      actions.disableAllFeeds();
      break;
    case 'history': {
      const hist = history
        .map((h, i) => `  <span class="t-dim">${(i + 1).toString().padStart(3, ' ')}</span>  ${sanitizeHTML(h)}`)
        .join('\\n');
      addLine({ type: 'output', text: `\\n${hist || ' <span class="t-dim">No command history</span>'}` });
      break;
    }
    case 'exit':
    case 'quit':
      addLine({ type: 'output', text: ` <span class="t-dim">Terminating session...</span>` });
      break;

    // --- Actions ---
    case 'hire':
    case 'hire me':
      actions.initiateHire();
      break;
    case 'chat':
      actions.enterChat();
      break;
    case 'snake':
      actions.setSnakeMode(true);
      break;
    case 'map':
      actions.setMapMode(true);
      break;

    // --- Auth & Admin ---
    case 'sudo':
    case 'su':
    case 'login':
      if (args === 'hire') fun.handleSudoHire(addLine);
      else if (args === 'rm -rf /') fun.handleSudoRm(addLine);
      else actions.initiateAuth();
      break;
    case 'admin':
      if (isAdmin) admin.handleAdminHelp(addLine);
      else addLine({ type: 'output', text: ` <span class="t-red">Permission denied. Are you root?</span>` });
      break;
    case 'telemetry':
      if (isAdmin) await admin.handleTelemetry(ctx);
      else addLine({ type: 'output', text: ` <span class="t-red">Permission denied.</span>` });
      break;
    case 'motd': {
      const motd = (window as any).__MOTD__ || 'Welcome to the Matrix.';
      addLine({
        type: 'output',
        text: ` <span class="t-yellow font-bold">[MOTD]</span> <span class="t-dim">${motd}</span>`,
      });
      break;
    }
    case 'set':
      if (isAdmin) await admin.handleSet(ctx, args);
      else addLine({ type: 'output', text: ` <span class="t-red">Permission denied.</span>` });
      break;
    case 'deploy':
      if (isAdmin) admin.handleDeploy(addLine, addLines);
      else addLine({ type: 'output', text: ` <span class="t-red">Permission denied.</span>` });
      break;
    case 'users':
    case 'connections':
      if (isAdmin) admin.handleUsers(ctx);
      else addLine({ type: 'output', text: ` <span class="t-red">Permission denied.</span>` });
      break;
    case 'config':
      if (isAdmin) admin.handleConfig(addLine);
      else addLine({ type: 'output', text: ` <span class="t-red">Permission denied.</span>` });
      break;
    case 'logs':
      if (isAdmin) actions.toggleLogs();
      else addLine({ type: 'output', text: ` <span class="t-red">Permission denied.</span>` });
      break;
    case 'watch':
      if (isAdmin) actions.toggleWatch(true);
      else addLine({ type: 'output', text: ` <span class="t-red">Permission denied.</span>` });
      break;
    case 'unwatch':
      if (isAdmin) actions.toggleWatch(false);
      else addLine({ type: 'output', text: ` <span class="t-red">Permission denied.</span>` });
      break;
    case 'stats':
      if (isAdmin) await admin.handleAdminStats(addLine, supabase);
      else await fun.handlePublicStats(addLine);
      break;
    case 'ban':
      if (isAdmin) await admin.handleBan(ctx, args);
      else addLine({ type: 'output', text: ` <span class="t-red">Permission denied.</span>` });
      break;
    case 'unban':
      if (isAdmin) await admin.handleUnban(ctx, args);
      else addLine({ type: 'output', text: ` <span class="t-red">Permission denied.</span>` });
      break;
    case 'logout':
      if (isAdmin) actions.logout();
      else addLine({ type: 'output', text: ` <span class="t-red">You are not logged in.</span>` });
      break;

    // --- Social & Interactive ---
    case 'sign':
      await social.handleSign(ctx, args);
      break;
    case 'guestbook':
      await social.handleGuestbook(ctx);
      break;
    case 'polls':
      await social.handlePolls(ctx);
      break;
    case 'vote':
      await social.handleVote(ctx, args);
      break;
    case 'topscores':
      await social.handleTopScores(ctx);
      break;
    case 'who':
      admin.handleUsers(ctx);
      break; // Re-using admin's user listing for public 'who'

    // --- Fun / API ---
    case 'fortune':
      fun.handleFortune(addLine);
      break;
    case 'matrix':
      fun.handleMatrix(addLine);
      break;
    case 'coffee':
    case 'chai':
      fun.handleCoffee(addLine);
      break;
    case 'flip':
      fun.handleFlip(addLine);
      break;
    case 'calc':
      fun.handleCalc(addLine, args);
      break;
    case 'top':
      fun.handleTop(addLine);
      break;
    case 'echo':
      fun.handleEcho(addLine, args);
      break;
    case 'weather':
      fun.handleWeather(addLine);
      break;
    case 'joke':
      fun.handleJoke(addLine);
      break;
    case 'quote':
      fun.handleQuote(addLine);
      break;
    case 'pokemon':
      fun.handlePokemon(addLine);
      break;
    case 'github':
      fun.handleGithubStats(addLine);
      break;
    case 'crypto':
    case 'btc':
      fun.handleCrypto(addLine);
      break;
    case 'news':
    case 'tech':
      fun.handleNews(addLine);
      break;
    case 'trivia':
      fun.handleTrivia(addLine);
      break;
    case 'commits':
      fun.handleCommits(addLine, addLines);
      break;
    case 'status':
      fun.handleStatus(addLine);
      break;
    case 'hack':
      fun.handleHack(addLine, addLines);
      break;

    // --- Basic bash aliases ---
    case 'time':
    case 'date':
      addLine({ type: 'output', text: ` ${new Date().toString()}` });
      break;
    case 'ls':
      addLine({
        type: 'output',
        text: ` <span class="t-cyan">src/</span>  <span class="t-cyan">public/</span>  <span class="t-white">README.md</span>  <span class="t-white">package.json</span>`,
      });
      break;
    case 'pwd':
      addLine({ type: 'output', text: ` /home/visitor` });
      break;
    case 'cd':
      addLine({
        type: 'output',
        text: args === 'secret' ? ` <span class="t-red">bash: cd: secret: Permission denied</span>` : ``,
      });
      break;
    case 'cat':
      if (args === 'readme.md') addLine({ type: 'output', text: ` <span class="t-dim">There is no spoon.</span>` });
      else
        addLine({
          type: 'output',
          text: ` <span class="t-red">cat: ${sanitizeHTML(args)}: No such file or directory</span>`,
        });
      break;
    case 'ping':
      addLine({ type: 'output', text: ` PONG! <span class="t-dim">Connection is stable.</span>` });
      break;
    case 'hello':
    case 'hi':
    case 'hey':
      addLine({
        type: 'output',
        text: ` Hello, ${visitorName}! Type '<span class="t-green">help</span>' to see what you can do here.`,
      });
      break;
    case '42':
      addLine({
        type: 'output',
        text: ` Ah, the answer to the ultimate question of life, the universe, and everything.`,
      });
      break;

    default:
      addLine({
        type: 'output',
        text: ` <span class="t-red">bash: command not found: ${sanitizeHTML(baseCmd)}</span>`,
      });
      addLine({ type: 'output', text: ` Type '<span class="t-green">help</span>' to see available commands.` });
  }
}
