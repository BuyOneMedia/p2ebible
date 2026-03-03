import Database from 'better-sqlite3';
import path from 'path';

// Singleton — reuse the same connection across Next.js requests
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.resolve(process.cwd(), 'p2ebible.db');

  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  return _db;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type RiskLevel = 'safe' | 'moderate' | 'high_risk' | 'scam';
export type GameStatus = 'pending_review' | 'approved' | 'rejected';
export type GameSource = 'web_search' | 'rss' | 'twitter' | 'telegram' | 'manual';

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
  source: GameSource;
  source_url: string | null;
  is_featured: number;
  discovered_at: string;
  updated_at: string;
}

export interface RiskScore {
  id: number;
  game_id: number;
  risk_level: RiskLevel;
  score: number;
  tokenomics_analysis: string | null;
  team_analysis: string | null;
  whitepaper_analysis: string | null;
  red_flags: string | null;   // JSON string
  green_flags: string | null; // JSON string
  full_analysis: string | null;
  analyzed_at: string;
}

export interface AffiliateLink {
  id: number;
  partner: string;
  partner_category: string;
  display_name: string;
  destination_url: string;
  affiliate_url: string;
  game_id: number | null;
  click_count: number;
  last_clicked_at: string | null;
  is_active: number;
  created_at: string;
}

export interface GameWithRisk extends Game {
  risk_level: RiskLevel | null;
  risk_score: number | null;
  red_flags: string | null;
  green_flags: string | null;
  full_analysis: string | null;
}
