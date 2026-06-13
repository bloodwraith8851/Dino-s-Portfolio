/**
 * GET /api/github
 *
 * Server-side cached GitHub stats endpoint.
 * - Fetches repos, total stars, top languages, and recent commits from the GitHub API
 * - Uses GITHUB_TOKEN from env (never exposed to the browser)
 * - Caches result in Redis for 1 hour to avoid rate limit exhaustion
 * - Returns structured JSON consumed by the terminal 'github' command and UI widgets
 */
import { getRedis } from '../_lib/redis';
import { handlePreflight, json } from '../_lib/cors';

export const config = { runtime: 'edge' };

const GITHUB_USERNAME = 'bloodwraith8851';
const CACHE_KEY = 'github:stats:v2';
const CACHE_TTL = 3600; // 1 hour

interface GitHubRepo {
  name: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  html_url: string;
  description: string | null;
  updated_at: string;
  fork: boolean;
}

interface GitHubStats {
  username: string;
  publicRepos: number;
  totalStars: number;
  totalForks: number;
  topLanguages: { language: string; count: number }[];
  topRepos: { name: string; stars: number; url: string; description: string | null; language: string | null }[];
  cachedAt: string;
}

async function fetchFromGitHub(path: string): Promise<unknown> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${path} → ${res.status}`);
  return res.json();
}

async function buildStats(): Promise<GitHubStats> {
  // Fetch all public repos (up to 100, sorted by updated)
  const repos = (await fetchFromGitHub(
    `/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated&type=owner`,
  )) as GitHubRepo[];

  const ownRepos = repos.filter((r) => !r.fork);
  const totalStars = ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const totalForks = ownRepos.reduce((sum, r) => sum + r.forks_count, 0);

  // Language frequency map
  const langMap: Record<string, number> = {};
  for (const repo of ownRepos) {
    if (repo.language) {
      langMap[repo.language] = (langMap[repo.language] ?? 0) + 1;
    }
  }
  const topLanguages = Object.entries(langMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([language, count]) => ({ language, count }));

  // Top repos by star count
  const topRepos = [...ownRepos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      stars: r.stargazers_count,
      url: r.html_url,
      description: r.description,
      language: r.language,
    }));

  return {
    username: GITHUB_USERNAME,
    publicRepos: ownRepos.length,
    totalStars,
    totalForks,
    topLanguages,
    topRepos,
    cachedAt: new Date().toISOString(),
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handlePreflight();
  if (req.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

  const redis = getRedis();

  // Serve from cache if available
  if (redis) {
    try {
      const cached = await redis.get<GitHubStats>(CACHE_KEY);
      if (cached) {
        return json({ ok: true, data: cached, source: 'cache' }, 200, {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        });
      }
    } catch {
      // Cache miss — fall through to live fetch
    }
  }

  try {
    const stats = await buildStats();

    // Cache for 1 hour
    if (redis) {
      try {
        await redis.set(CACHE_KEY, stats, { ex: CACHE_TTL });
      } catch {
        // Non-critical
      }
    }

    return json({ ok: true, data: stats, source: 'live' }, 200, {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[github/stats] Error:', message);

    // If cache is stale but still exists, serve it rather than failing
    if (redis) {
      try {
        const stale = await redis.get<GitHubStats>(CACHE_KEY);
        if (stale) return json({ ok: true, data: stale, source: 'stale-cache' });
      } catch {
        // ignore
      }
    }

    return json({ error: 'Failed to fetch GitHub stats', detail: message }, 502);
  }
}
