import type { AddLine, AddLines, CommandContext } from '../types';
import { sanitizeHTML } from '../sanitize';
import { ADMIN_MENU } from '../constants';

export function handleAdminHelp(addLine: AddLine) {
  addLine({ type: 'output', text: ADMIN_MENU });
}

export async function handleTelemetry({ addLine, addLines, supabase }: CommandContext) {
  addLine({ type: 'output', text: ` <span class="t-dim">Fetching global command telemetry...</span>` });
  try {
    const { data } = await supabase
      .from('command_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data && data.length > 0) {
      const teleLines = data.map((log: any) => ({
        type: 'output' as const,
        text: ` <span class="t-dim">[${new Date(log.created_at).toLocaleTimeString()}]</span> <span class="t-cyan">VISITOR</span> <span class="t-green">executed:</span> <span class="t-white">${sanitizeHTML(log.command)}</span>`,
      }));
      addLine({
        type: 'output',
        text: `\\n <span class="t-purple font-bold">--- RECENT VISITOR TELEMETRY ---</span>\\n`,
      });
      addLines(teleLines, 100);
    } else {
      addLine({ type: 'output', text: ` <span class="t-dim">No telemetry data available.</span>` });
    }
  } catch {
    addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to read telemetry.</span>` });
  }
}

export async function handleSet({ addLine, supabase }: CommandContext, args: string) {
  const parts = args.trim().split(' ');
  if (parts.length < 2) {
    addLine({ type: 'output', text: ` <span class="t-red">Usage: set [key] [value]</span>` });
    return;
  }
  const key = parts[0];
  const value = parts.slice(1).join(' ');
  try {
    await supabase.from('admin_settings').upsert([{ key, value }]);
    if (key === 'motd') (window as any).__MOTD__ = value;
    addLine({
      type: 'output',
      text: ` <span class="t-green">✓ System configuration updated: ${sanitizeHTML(key)} = ${sanitizeHTML(value)}</span>`,
    });
  } catch {
    addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to update settings.</span>` });
  }
}

export function handleDeploy(_addLine: AddLine, addLines: AddLines) {
  const deployLines = [
    { type: 'output' as const, text: ` <span class="t-dim">Initializing deployment sequence...</span>` },
    { type: 'output' as const, text: ` <span class="t-cyan">Building production bundle (Vite)</span>` },
    { type: 'output' as const, text: ` <span class="t-dim">✓ 142 modules transformed.</span>` },
    { type: 'output' as const, text: ` <span class="t-yellow">Uploading assets to CDN... [██████████] 100%</span>` },
    {
      type: 'output' as const,
      text: ` <span class="t-green">DEPLOYMENT SUCCESSFUL.</span> <span class="t-dim">Live at rakesh.dev</span>`,
    },
  ];
  addLines(deployLines, 600);
}

export function handleUsers({ addLine, visitorName }: CommandContext) {
  addLine({ type: 'output', text: ` <span class="t-dim">Scanning active network connections...</span>` });

  const presences = (window as any).__VISITOR_PRESENCE__ || [];
  const activeCount = Math.max(presences.length, 1);

  let usersList = '';
  if (presences.length > 0) {
    usersList = presences
      .map((p: any) => {
        const isRoot = p.alias === 'root' || (visitorName && p.alias === visitorName);
        const displayIp = p.ip || '127.0.0.1';
        const displayCity = p.city || 'Unknown';
        const displayOrg = p.org || 'ISP';
        const cityStr = `(${displayCity})`;
        return `  <span class="t-${isRoot ? 'green' : 'dim'} font-bold">${sanitizeHTML(p.alias).padEnd(12)}</span> ${displayIp.padEnd(16)} ${cityStr.padEnd(14)} <span class="t-dim">${sanitizeHTML(displayOrg)}</span>`;
      })
      .join('\n');
  } else {
    usersList = `  <span class="t-green font-bold">root        </span> 127.0.0.1        (local     ) <span class="t-dim">Localhost</span>`;
  }

  addLine({
    type: 'output',
    text: `
 <span class="t-dim">ACTIVE CONNECTIONS: ${activeCount}</span>
 <span class="t-dim">─────────────────────────────────────────────────────────</span>
${usersList}
 <span class="t-dim">─────────────────────────────────────────────────────────</span>`,
  });
}

export function handleConfig(addLine: AddLine) {
  addLine({
    type: 'output',
    text: `
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
 <span class="t-yellow">}</span>`,
  });
}

export async function handleAdminStats(addLine: AddLine, _supabase: any) {
  addLine({ type: 'output', text: ` <span class="t-dim">Fetching real-time database metrics...</span>` });

  let totalViews = 'N/A';
  let todayViews = 'N/A';
  let weekViews = 'N/A';
  let activeKeys = 'N/A';

  try {
    const API_URL = import.meta.env.DEV ? 'http://localhost:5173' : '';
    // Use the admin JWT stored in window for fetch
    const token = (window as any).__ADMIN_TOKEN__;

    if (token) {
      const res = await fetch(`${API_URL}/api/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        totalViews = data.pageViews.allTime.toString();
        todayViews = data.pageViews.today.toString();
        weekViews = data.pageViews.thisWeek.toString();
        activeKeys = data.liveKeys.toString();
      }
    }
  } catch {
    /* ignore error */
  }

  const activeVis = (window as any).__ACTIVE_VISITORS__ || 1;
  const mem = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Unknown';
  const conn = (navigator as any).connection ? (navigator as any).connection.effectiveType.toUpperCase() : 'WIFI';
  const time = Math.floor(performance.now() / 1000);
  const uptime = `${Math.floor(time / 60)
    .toString()
    .padStart(2, '0')}m ${(time % 60).toString().padStart(2, '0')}s`;
  const res = `${window.innerWidth}x${window.innerHeight}`;
  const cores = navigator.hardwareConcurrency || 4;

  const makeRow = (label: string, val: string, color: string = 't-green') => {
    const rawLen = label.length + val.length + 5;
    const spaces = Math.max(0, 52 - rawLen);
    return ` <span class="t-purple">║</span>  <span class="t-yellow">${label}</span> : <span class="${color} font-bold">${val}</span>${' '.repeat(spaces)}<span class="t-purple">║</span>`;
  };

  addLine({
    type: 'output',
    text: `
 <span class="t-purple">╔════════════════════════════════════════════════════╗</span>
 <span class="t-purple">║</span>  <span class="t-white font-bold">REALTIME CLIENT & SERVER DIAGNOSTICS</span>              <span class="t-purple">║</span>
 <span class="t-purple">╠════════════════════════════════════════════════════╣</span>
${makeRow('Active Visitors ', activeVis.toString(), 't-green')}
${makeRow('Total Page Views', totalViews, 't-cyan')}
${makeRow('Today Page Views', todayViews, 't-cyan')}
${makeRow('Week Page Views ', weekViews, 't-cyan')}
${makeRow('Redis Live Keys ', activeKeys, 't-green')}
${makeRow('Session Uptime  ', uptime, 't-cyan')}
${makeRow('Viewport Res    ', res, 't-green')}
${makeRow('Network Type    ', conn, 't-yellow')}
${makeRow('Device Memory   ', mem, 't-green')}
${makeRow('Logical Cores   ', cores.toString(), 't-cyan')}
 <span class="t-purple">╚════════════════════════════════════════════════════╝</span>`,
  });
}

export async function handleBan({ addLine, supabase }: CommandContext, args: string) {
  const ip = args.trim();
  if (!ip) {
    addLine({ type: 'output', text: ` <span class="t-red">Usage: ban [ip]</span>` });
    return;
  }
  addLine({ type: 'output', text: ` <span class="t-dim">Adding IP ${sanitizeHTML(ip)} to global banlist...</span>` });
  try {
    await supabase.from('banned_ips').insert([{ ip }]);
    addLine({
      type: 'output',
      text: ` <span class="t-green">✓ IP ${sanitizeHTML(ip)} has been permanently banned from the server.</span>`,
    });
  } catch {
    addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to ban IP (Table might not exist).</span>` });
  }
}

export async function handleUnban({ addLine, supabase }: CommandContext, args: string) {
  const ip = args.trim();
  if (!ip) {
    addLine({ type: 'output', text: ` <span class="t-red">Usage: unban [ip]</span>` });
    return;
  }
  try {
    await supabase.from('banned_ips').delete().eq('ip', ip);
    addLine({
      type: 'output',
      text: ` <span class="t-green">✓ IP ${sanitizeHTML(ip)} has been removed from the banlist.</span>`,
    });
  } catch {
    /* ignore error */
  }
}
