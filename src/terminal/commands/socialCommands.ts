import type { CommandContext } from '../types';
import { sanitizeHTML } from '../sanitize';

/** Supabase guestbook row shape (partial). */
interface GuestbookEntry {
  visitor_alias: string;
  message: string;
  created_at: string;
}

/** Supabase poll row shape (partial). */
interface PollRow {
  id: number;
  question: string;
  options: string[];
}

/** Supabase poll_votes row shape (partial). */
interface PollVote {
  option_index: number;
}

/** Supabase score row shape (partial). */
interface ScoreRow {
  player_alias: string;
  score: number;
}

/**
 * Handles the `sign` command — inserts a message into the guestbook table.
 * @param ctx - Full command context (addLine, visitorName, supabase).
 * @param msg - The message the visitor wants to leave.
 */
export async function handleSign({ addLine, visitorName, supabase }: CommandContext, msg: string) {
  const sanitizedMsg = sanitizeHTML(msg.trim());
  if (!sanitizedMsg) {
    addLine({ type: 'output', text: ` <span class="t-red">Usage: sign [your message]</span>` });
    return;
  }

  addLine({ type: 'output', text: ` <span class="t-dim">Carving your message into the guestbook...</span>` });

  try {
    await supabase.from('guestbook').insert([{ visitor_alias: visitorName || 'Anonymous', message: sanitizedMsg }]);
    addLine({
      type: 'output',
      text: ` <span class="t-green">✓ Your mark has been left. Type 'guestbook' to see it!</span>`,
    });
    const API_URL = import.meta.env.DEV ? 'https://dino-s-portfolio.vercel.app' : '';
    fetch(`${API_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'guestbook', visitor_alias: visitorName || 'Anonymous', message: sanitizedMsg }),
    }).catch(() => {});
  } catch {
    addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to sign the guestbook.</span>` });
  }
}

/**
 * Handles the `guestbook` command — fetches and displays recent entries.
 * @param ctx - Full command context.
 */
export async function handleGuestbook({ addLine, addLines, supabase }: CommandContext) {
  addLine({ type: 'output', text: ` <span class="t-dim">Fetching the ancient scrolls...</span>` });
  try {
    const { data } = await supabase.from('guestbook').select('*').order('created_at', { ascending: false }).limit(10);
    if (data && data.length > 0) {
      const gbLines = (data as GuestbookEntry[]).map((entry) => ({
        type: 'output' as const,
        text: ` <span class="t-cyan">${sanitizeHTML(entry.visitor_alias)}</span> <span class="t-dim">[${new Date(entry.created_at).toLocaleDateString()}]</span>\\n  <span class="t-white">"${sanitizeHTML(entry.message)}"</span>\\n`,
      }));
      addLine({ type: 'output', text: `\\n <span class="t-purple font-bold">--- THE PUBLIC GUESTBOOK ---</span>\\n` });
      addLines(gbLines.reverse(), 200);
    } else {
      addLine({
        type: 'output',
        text: ` <span class="t-dim">The guestbook is empty. Be the first to 'sign [message]'!</span>`,
      });
    }
  } catch {
    addLine({ type: 'output', text: ` <span class="t-red">✗ Could not read guestbook.</span>` });
  }
}

/**
 * Handles the `polls` command — fetches active polls and vote counts.
 * @param ctx - Full command context.
 */
export async function handlePolls({ addLine, addLines, supabase }: CommandContext) {
  addLine({ type: 'output', text: ` <span class="t-dim">Fetching active community polls...</span>` });
  try {
    const { data } = await supabase.from('polls').select('*').eq('active', true);
    if (data && data.length > 0) {
      for (const poll of data as PollRow[]) {
        const { data: votes } = await supabase.from('poll_votes').select('option_index').eq('poll_id', poll.id);
        const voteCounts = (poll.options as string[]).map(() => 0);
        (votes as PollVote[] | null)?.forEach((v) => {
          if (voteCounts[v.option_index] !== undefined) voteCounts[v.option_index]++;
        });
        const totalVotes = votes?.length ?? 0;

        addLine({
          type: 'output',
          text: `\\n <span class="t-yellow font-bold">POLL #${poll.id}</span> <span class="t-white">${sanitizeHTML(poll.question)}</span>`,
        });
        const lines = poll.options.map((opt: string, i: number) => {
          const count = voteCounts[i] ?? 0;
          const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
          const bar = '█'.repeat(Math.round(pct / 5)).padEnd(20, '░');
          return {
            type: 'output' as const,
            text: `  <span class="t-cyan">[${i}]</span> ${sanitizeHTML(opt).padEnd(12)} <span class="t-dim">${bar}</span> ${pct}% (${count})`,
          };
        });
        addLines(lines, 100);
      }
      addLine({
        type: 'output',
        text: `\\n <span class="t-dim">Type </span><span class="t-green">vote [poll_id] [option_index]</span><span class="t-dim"> to cast your vote!</span>\\n`,
      });
    } else {
      addLine({ type: 'output', text: ` <span class="t-dim">No active polls right now.</span>` });
    }
  } catch {
    addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to fetch polls.</span>` });
  }
}

/**
 * Handles the `vote` command — casts a vote on a poll.
 * @param ctx  - Full command context.
 * @param args - Space-separated "poll_id option_index".
 */
export async function handleVote({ addLine, visitorName, supabase }: CommandContext, args: string) {
  const parts = args.trim().split(' ');
  if (parts.length < 2) {
    addLine({ type: 'output', text: ` <span class="t-red">Usage: vote [poll_id] [option_index]</span>` });
    return;
  }
  const pollId = parseInt(parts[0] ?? '');
  const optionIndex = parseInt(parts[1] ?? '');
  if (isNaN(pollId) || isNaN(optionIndex)) {
    addLine({ type: 'output', text: ` <span class="t-red">Error: IDs must be numbers.</span>` });
    return;
  }

  addLine({ type: 'output', text: ` <span class="t-dim">Casting your vote...</span>` });
  const { error } = await supabase
    .from('poll_votes')
    .insert([{ poll_id: pollId, voter_ip: visitorName || 'visitor', option_index: optionIndex }]);
  if (error) {
    if (error.code === '23505')
      addLine({ type: 'output', text: ` <span class="t-yellow">⚠ You have already voted on this poll!</span>` });
    else addLine({ type: 'output', text: ` <span class="t-red">✗ Database error: ${error.message}</span>` });
  } else {
    addLine({
      type: 'output',
      text: ` <span class="t-green">✓ Vote successfully cast! Type 'polls' to see updated results.</span>`,
    });
  }
}

/**
 * Handles the `topscores` command — displays Snake game leaderboard.
 * @param ctx - Full command context.
 */
export async function handleTopScores({ addLine, addLines, supabase }: CommandContext) {
  addLine({ type: 'output', text: ` <span class="t-dim">Fetching global Snake leaderboard...</span>` });
  try {
    const { data } = await supabase.from('scores').select('*').order('score', { ascending: false }).limit(5);
    if (data && data.length > 0) {
      const scoreLines = (data as ScoreRow[]).map((entry, i) => ({
        type: 'output' as const,
        text: ` <span class="t-yellow">${i + 1}.</span> <span class="t-cyan">${sanitizeHTML(entry.player_alias).padEnd(20)}</span> <span class="t-green font-bold">${entry.score}</span>`,
      }));
      addLine({ type: 'output', text: `\\n <span class="t-purple font-bold">--- SNAKE HIGH SCORES ---</span>\\n` });
      addLines(scoreLines, 200);
    } else {
      addLine({
        type: 'output',
        text: ` <span class="t-dim">No high scores yet! Type 'snake' to be the first!</span>`,
      });
    }
  } catch {
    addLine({ type: 'output', text: ` <span class="t-red">✗ Failed to read leaderboard.</span>` });
  }
}
