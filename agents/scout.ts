/**
 * SCOUT AGENT — Opportunity Hunter
 * Runs every 6 hours. Scans multiple sources for new P2E games,
 * airdrops, and early-access mints. Pluggable: each source only
 * activates if its API key is present in the environment.
 *
 * Sources:
 *  1. Claude Web Search  (always active — needs ANTHROPIC_API_KEY)
 *  2. RSS Feeds          (always active — no key needed)
 *  3. Twitter/X          (activates if TWITTER_BEARER_TOKEN is set)
 *  4. Telegram           (activates if TELEGRAM_BOT_TOKEN + TELEGRAM_CHANNEL_IDS set)
 */

import Anthropic from '@anthropic-ai/sdk';
import cron from 'node-cron';
import Parser from 'rss-parser';
import { getDb, upsertGame, logAgentRun, slugify, NewGame } from './shared/db';
import * as https from 'https';

// ── Config ─────────────────────────────────────────────────────────────────

const RSS_FEEDS = [
  { name: 'DappRadar Games',   url: 'https://dappradar.com/blog/feed' },
  { name: 'CoinGecko',         url: 'https://www.coingecko.com/en/news.rss' },
  { name: 'PlayToEarn',        url: 'https://playtoearn.net/feed' },
  { name: 'NFT Game Reviews',  url: 'https://nftgamers.io/feed' },
];

const rssParser = new Parser({ timeout: 10000 });

// ── Logging ────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[Scout ${new Date().toISOString()}] ${msg}`);
}

// ── Source 1: Claude Web Search ────────────────────────────────────────────

async function runClaudeWebSearch(): Promise<NewGame[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log('ANTHROPIC_API_KEY not set — skipping Claude web search');
    return [];
  }

  log('Running Claude web search...');
  const client = new Anthropic({ apiKey });
  const games: NewGame[] = [];

  const queries = [
    'new Play-to-Earn crypto games launching 2024 2025 with token rewards',
    'upcoming Web3 game airdrops and early access mints this month',
    'trending blockchain games NFT gaming platforms new release',
  ];

  for (const query of queries) {
    try {
      const response = await client.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        tools: [
          {
            name: 'web_search',
            description: 'Search the web for current information',
            input_schema: {
              type: 'object' as const,
              properties: {
                query: { type: 'string', description: 'Search query' }
              },
              required: ['query']
            }
          }
        ],
        messages: [{
          role: 'user',
          content: `Search for: "${query}".

Return a JSON array of games found. Each item must have:
- name (string): game name
- description (string): 1-2 sentence description
- website_url (string): official site if known
- chain (string): blockchain (Ethereum/Solana/Polygon/BNB/etc)
- genre (string): game type (RPG/Strategy/Card/Sports/etc)
- token_symbol (string): token ticker if known

Return ONLY valid JSON array, no other text. Example:
[{"name":"GameName","description":"...","website_url":"https://...","chain":"Ethereum","genre":"RPG","token_symbol":"GME"}]`
        }]
      });

      // Extract text content from response
      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') continue;

      // Parse JSON from response
      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) continue;

      const found: Array<{
        name: string;
        description?: string;
        website_url?: string;
        chain?: string;
        genre?: string;
        token_symbol?: string;
      }> = JSON.parse(jsonMatch[0]);

      for (const item of found) {
        if (!item.name) continue;
        games.push({
          slug: slugify(item.name),
          name: item.name,
          description: item.description,
          website_url: item.website_url,
          chain: item.chain,
          genre: item.genre,
          token_symbol: item.token_symbol,
          source: 'web_search',
          source_url: `https://claude.ai/search?q=${encodeURIComponent(query)}`,
        });
      }

      log(`Claude found ${found.length} games for: "${query}"`);

    } catch (err) {
      log(`Claude search error: ${err}`);
    }
  }

  return games;
}

// ── Source 2: RSS Feeds ────────────────────────────────────────────────────

async function runRssFeeds(): Promise<NewGame[]> {
  log('Scanning RSS feeds...');
  const games: NewGame[] = [];

  const P2E_KEYWORDS = [
    'play-to-earn', 'play to earn', 'p2e', 'web3 game', 'nft game',
    'blockchain game', 'crypto game', 'gamefi', 'game token', 'airdrop',
    'early access', 'nft mint', 'metaverse game'
  ];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await rssParser.parseURL(feed.url);

      for (const item of (parsed.items || []).slice(0, 20)) {
        const title = item.title || '';
        const content = (item.contentSnippet || item.summary || '').toLowerCase();
        const combined = (title + ' ' + content).toLowerCase();

        if (!P2E_KEYWORDS.some(kw => combined.includes(kw))) continue;

        const slug = slugify(title);
        if (!slug) continue;

        games.push({
          slug,
          name: title,
          description: item.contentSnippet?.slice(0, 300) || undefined,
          website_url: item.link || undefined,
          source: 'rss',
          source_url: item.link || feed.url,
        });
      }

      log(`RSS ${feed.name}: found relevant items`);
    } catch (err) {
      log(`RSS feed error (${feed.name}): ${err}`);
    }
  }

  return games;
}

// ── Source 3: Twitter/X API ────────────────────────────────────────────────

async function runTwitterSearch(): Promise<NewGame[]> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) {
    log('TWITTER_BEARER_TOKEN not set — skipping Twitter');
    return [];
  }

  log('Searching Twitter/X...');
  const games: NewGame[] = [];

  const queries = [
    '#P2E #NewGame -is:retweet lang:en',
    '#GameFi #Web3Gaming launch -is:retweet lang:en',
    '#NFTGame airdrop OR mint -is:retweet lang:en',
  ];

  for (const query of queries) {
    try {
      const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=20&tweet.fields=created_at,entities`;

      const data = await new Promise<{ data?: Array<{ id: string; text: string }> }>((resolve, reject) => {
        const req = https.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON')); }
          });
        });
        req.on('error', reject);
      });

      if (!data.data) continue;

      for (const tweet of data.data) {
        const text = tweet.text;
        const nameMatch = text.match(/([A-Z][a-zA-Z0-9\s]{2,30})\s+(game|protocol|finance|world)/i);
        if (!nameMatch) continue;

        const name = nameMatch[0].trim();
        const slug = slugify(name);
        if (!slug || slug.length < 3) continue;

        games.push({
          slug,
          name,
          description: text.slice(0, 280),
          source: 'twitter',
          source_url: `https://twitter.com/i/web/status/${tweet.id}`,
        });
      }

    } catch (err) {
      log(`Twitter search error: ${err}`);
    }
  }

  return games;
}

// ── Source 4: Telegram ─────────────────────────────────────────────────────

async function runTelegram(): Promise<NewGame[]> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelIds = process.env.TELEGRAM_CHANNEL_IDS;
  if (!token || !channelIds) {
    log('Telegram credentials not set — skipping Telegram');
    return [];
  }

  log('Checking Telegram channels...');
  const games: NewGame[] = [];
  const channels = channelIds.split(',').map(c => c.trim());

  for (const channelId of channels) {
    try {
      const url = `https://api.telegram.org/bot${token}/getUpdates`;
      const data = await new Promise<{ ok: boolean; result: Array<{ message?: { text?: string; message_id: number; chat: { id: number } } }> }>((resolve, reject) => {
        https.get(url, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON')); }
          });
        }).on('error', reject);
      });

      if (!data.ok || !data.result) continue;

      const P2E_KEYWORDS = ['p2e', 'play-to-earn', 'nft game', 'gamefi', 'airdrop', 'launch'];

      for (const update of data.result.slice(-50)) {
        const text = update.message?.text || '';
        if (!P2E_KEYWORDS.some(kw => text.toLowerCase().includes(kw))) continue;

        const nameMatch = text.match(/([A-Z][a-zA-Z0-9\s]{2,30})\s+(game|protocol|fi|world)/i);
        if (!nameMatch) continue;

        const name = nameMatch[0].trim();
        games.push({
          slug: slugify(name),
          name,
          description: text.slice(0, 300),
          source: 'telegram',
          source_url: `https://t.me/c/${channelId}/${update.message?.message_id}`,
        });
      }
    } catch (err) {
      log(`Telegram error (${channelId}): ${err}`);
    }
  }

  return games;
}

// ── Deduplication ──────────────────────────────────────────────────────────

function deduplicate(games: NewGame[]): NewGame[] {
  const seen = new Set<string>();
  return games.filter(g => {
    if (!g.slug || g.slug.length < 3) return false;
    if (seen.has(g.slug)) return false;
    seen.add(g.slug);
    return true;
  });
}

// ── Main Run ───────────────────────────────────────────────────────────────

async function runScout() {
  log('=== Scout starting ===');
  const runId = logAgentRun('scout', 'running');

  try {
    const [claudeGames, rssGames, twitterGames, telegramGames] = await Promise.all([
      runClaudeWebSearch(),
      runRssFeeds(),
      runTwitterSearch(),
      runTelegram(),
    ]);

    const allGames = deduplicate([
      ...claudeGames,
      ...rssGames,
      ...twitterGames,
      ...telegramGames,
    ]);

    log(`Total unique games found: ${allGames.length}`);

    let inserted = 0;
    for (const game of allGames) {
      const result = upsertGame(game);
      if (result.inserted) inserted++;
    }

    log(`New games saved to DB: ${inserted}`);
    logAgentRun('scout', 'completed', inserted, 0, undefined, runId);
    log('=== Scout done ===');

  } catch (err) {
    log(`FATAL ERROR: ${err}`);
    logAgentRun('scout', 'failed', 0, 0, String(err), runId);
  }
}

// ── Schedule ───────────────────────────────────────────────────────────────

log('Scout agent starting — will run every 6 hours');
runScout(); // Run immediately on start

// Then every 6 hours: at 0:00, 6:00, 12:00, 18:00
cron.schedule('0 0,6,12,18 * * *', () => {
  runScout();
});
