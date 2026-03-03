import Database from 'better-sqlite3';
import path from 'path';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const dbPath = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.resolve(__dirname, '../../p2ebible.db');
  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  return _db;
}

export type RiskLevel = 'safe' | 'moderate' | 'high_risk' | 'scam';
export type GameStatus = 'pending_review' | 'approved' | 'rejected';

export interface Game {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  website_url: string | null;
  chain: string | null;
  genre: string | null;
  token_symbol: string | null;
  image_url: string | null;
  status: GameStatus;
  source: string;
  source_url: string | null;
}

export interface NewGame {
  slug: string;
  name: string;
  description?: string;
  website_url?: string;
  chain?: string;
  genre?: string;
  token_symbol?: string;
  image_url?: string;
  source: string;
  source_url?: string;
}

export interface DetectiveResult {
  risk_level: RiskLevel;
  score: number;
  tokenomics_analysis: string;
  team_analysis: string;
  whitepaper_analysis: string;
  red_flags: string[];
  green_flags: string[];
  full_analysis: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 80);
}

export function logAgentRun(
  agent: 'scout' | 'detective',
  status: 'running' | 'completed' | 'failed',
  gamesFound = 0,
  gamesAnalyzed = 0,
  errorMessage?: string,
  runId?: number
): number {
  const db = getDb();
  if (runId !== undefined) {
    db.prepare(`
      UPDATE agent_runs
      SET status = ?, games_found = ?, games_analyzed = ?,
          error_message = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, gamesFound, gamesAnalyzed, errorMessage ?? null, runId);
    return runId;
  }
  const result = db.prepare(`
    INSERT INTO agent_runs (agent, status, games_found, games_analyzed, error_message)
    VALUES (?, ?, ?, ?, ?)
  `).run(agent, status, gamesFound, gamesAnalyzed, errorMessage ?? null);
  return result.lastInsertRowid as number;
}

export function upsertGame(game: NewGame): { inserted: boolean; id: number } {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM games WHERE slug = ?').get(game.slug) as { id: number } | undefined;
  if (existing) return { inserted: false, id: existing.id };

  const result = db.prepare(`
    INSERT INTO games (slug, name, description, website_url, chain, genre,
                       token_symbol, image_url, source, source_url, status)
    VALUES (@slug, @name, @description, @website_url, @chain, @genre,
            @token_symbol, @image_url, @source, @source_url, 'pending_review')
  `).run({
    slug: game.slug,
    name: game.name,
    description: game.description ?? null,
    website_url: game.website_url ?? null,
    chain: game.chain ?? null,
    genre: game.genre ?? null,
    token_symbol: game.token_symbol ?? null,
    image_url: game.image_url ?? null,
    source: game.source,
    source_url: game.source_url ?? null,
  });

  return { inserted: true, id: result.lastInsertRowid as number };
}

export function saveRiskScore(gameId: number, result: DetectiveResult): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO risk_scores
      (game_id, risk_level, score, tokenomics_analysis, team_analysis,
       whitepaper_analysis, red_flags, green_flags, full_analysis, analyzed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    gameId,
    result.risk_level,
    result.score,
    result.tokenomics_analysis,
    result.team_analysis,
    result.whitepaper_analysis,
    JSON.stringify(result.red_flags),
    JSON.stringify(result.green_flags),
    result.full_analysis
  );

  const newStatus = result.risk_level === 'scam' || result.risk_level === 'high_risk'
    ? 'rejected'
    : 'approved';

  db.prepare('UPDATE games SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newStatus, gameId);
}

export function getPendingGames(): Game[] {
  const db = getDb();
  return db.prepare(`
    SELECT g.* FROM games g
    LEFT JOIN risk_scores rs ON rs.game_id = g.id
    WHERE g.status = 'pending_review' AND rs.id IS NULL
    ORDER BY g.discovered_at ASC
    LIMIT 20
  `).all() as Game[];
}
