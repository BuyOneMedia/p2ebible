import Link from 'next/link';
import { getDb } from '@/lib/db';
import type { GameWithRisk, AffiliateLink } from '@/lib/db';
import GameCard from '@/components/GameCard';
import RiskBadge from '@/components/RiskBadge';
import {
  BookOpen, Shield, Zap, TrendingUp, ExternalLink,
  Users, ChevronRight, AlertOctagon
} from 'lucide-react';

export const revalidate = 300; // Revalidate every 5 minutes

function getData() {
  const db = getDb();

  const featuredGames = db.prepare(`
    SELECT g.*, rs.risk_level, rs.score AS risk_score, rs.red_flags, rs.green_flags, rs.full_analysis,
           al.id AS affiliate_link_id
    FROM games g
    LEFT JOIN risk_scores rs ON rs.game_id = g.id
    LEFT JOIN affiliate_links al ON al.game_id = g.id AND al.is_active = 1
    WHERE g.status = 'approved' AND g.is_featured = 1
    ORDER BY g.updated_at DESC LIMIT 6
  `).all() as (GameWithRisk & { affiliate_link_id: number | null })[];

  const recentGames = db.prepare(`
    SELECT g.*, rs.risk_level, rs.score AS risk_score, rs.red_flags, rs.green_flags, rs.full_analysis,
           al.id AS affiliate_link_id
    FROM games g
    LEFT JOIN risk_scores rs ON rs.game_id = g.id
    LEFT JOIN affiliate_links al ON al.game_id = g.id AND al.is_active = 1
    WHERE g.status = 'approved' AND (rs.risk_level = 'safe' OR rs.risk_level = 'moderate')
    ORDER BY g.discovered_at DESC LIMIT 6
  `).all() as (GameWithRisk & { affiliate_link_id: number | null })[];

  const scamAlerts = db.prepare(`
    SELECT g.slug, g.name, g.chain, rs.risk_level, rs.score AS risk_score, rs.red_flags, rs.analyzed_at
    FROM risk_scores rs
    JOIN games g ON g.id = rs.game_id
    WHERE rs.risk_level IN ('high_risk', 'scam')
    ORDER BY rs.analyzed_at DESC LIMIT 5
  `).all() as {
    slug: string; name: string; chain: string | null;
    risk_level: string; risk_score: number;
    red_flags: string | null; analyzed_at: string;
  }[];

  const affiliateLinks = db.prepare(`
    SELECT * FROM affiliate_links WHERE is_active = 1 AND game_id IS NULL
    ORDER BY partner_category, display_name LIMIT 10
  `).all() as AffiliateLink[];

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM games WHERE status='approved') AS approved_games,
      (SELECT COUNT(*) FROM risk_scores) AS analyzed,
      (SELECT COUNT(*) FROM risk_scores WHERE risk_level IN ('high_risk','scam')) AS flagged,
      (SELECT SUM(click_count) FROM affiliate_links) AS total_clicks
  `).get() as { approved_games: number; analyzed: number; flagged: number; total_clicks: number };

  const lastScoutRun = db.prepare(`
    SELECT completed_at, games_found FROM agent_runs
    WHERE agent = 'scout' AND status = 'completed'
    ORDER BY started_at DESC LIMIT 1
  `).get() as { completed_at: string; games_found: number } | undefined;

  return { featuredGames, recentGames, scamAlerts, affiliateLinks, stats, lastScoutRun };
}

export default function HomePage() {
  const { featuredGames, recentGames, scamAlerts, affiliateLinks, stats, lastScoutRun } = getData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── Scam Alert Ticker ─────────────────────────────── */}
      {scamAlerts.length > 0 && (
        <div className="bg-[#ff333315] border-b border-[#ff333330] -mx-4 sm:-mx-6 lg:-mx-8 px-4 py-2 overflow-hidden">
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0 flex items-center gap-1 text-[#ff3333] text-xs font-bold uppercase tracking-wider">
              <AlertOctagon className="w-3.5 h-3.5" /> SCAM ALERT
            </span>
            <div className="overflow-hidden flex-1">
              <div className="ticker-content text-xs text-[#888899]">
                {scamAlerts.map((a, i) => (
                  <span key={i} className="mr-12">
                    ⚠ <Link href={`/games/${a.slug}`} className="text-[#ff6666] hover:underline">{a.name}</Link>
                    {' '}flagged as <span className="text-[#ff3333] font-semibold">{a.risk_level.replace('_', ' ').toUpperCase()}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28 text-center overflow-hidden scanlines">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,255,136,0.07),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_70%_60%,rgba(124,58,237,0.05),transparent)] pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5 text-[#00ff88] text-xs font-medium mb-6">
            <Zap className="w-3 h-3" /> AI agents running 24/7 — updated every 6 hours
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold mb-4 tracking-tight">
            Your Web3 Gaming{' '}
            <span className="gradient-text">Bible</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#888899] max-w-2xl mx-auto mb-2">
            The companion to the book — but alive. AI agents hunt new games, detect scams,
            and monetize your clicks so you don&apos;t have to do it manually.
          </p>
          <p className="text-sm text-[#555566] mb-8">
            Already have the book?{' '}
            <Link href="/games" className="text-[#00ff88] hover:underline">
              Explore the live game database →
            </Link>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/scam-radar" className="flex items-center gap-2 px-5 py-2.5 bg-[#ff3333]/10 border border-[#ff3333]/30 text-[#ff6666] rounded-lg font-medium hover:bg-[#ff3333]/20 transition-all">
              <Shield className="w-4 h-4" /> Check Scam Radar
            </Link>
            <Link href="/games" className="flex items-center gap-2 px-5 py-2.5 bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] rounded-lg font-medium hover:bg-[#00ff88]/20 transition-all">
              <TrendingUp className="w-4 h-4" /> Browse Safe Games
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
        {[
          { label: 'Verified Games', value: stats.approved_games, color: 'text-[#00ff88]' },
          { label: 'Scams Flagged', value: stats.flagged, color: 'text-[#ff3333]' },
          { label: 'Games Analyzed', value: stats.analyzed, color: 'text-[#7c3aed]' },
          { label: 'Affiliate Clicks', value: stats.total_clicks || 0, color: 'text-[#00b4ff]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold font-mono ${color}`}>{value}</div>
            <div className="text-xs text-[#888899] mt-1">{label}</div>
          </div>
        ))}
      </section>

      {/* ── Featured Games ─────────────────────────────────── */}
      {featuredGames.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">⭐ Featured Games</h2>
            <Link href="/games?featured=1" className="text-sm text-[#888899] hover:text-[#00ff88] flex items-center gap-1">
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredGames.map(g => (
              <GameCard key={g.id} {...g} affiliate_link_id={(g as GameWithRisk & { affiliate_link_id: number | null }).affiliate_link_id} />
            ))}
          </div>
        </section>
      )}

      {/* ── Scam Radar Preview ─────────────────────────────── */}
      {scamAlerts.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-[#ff3333]" /> Latest Scam Alerts
            </h2>
            <Link href="/scam-radar" className="text-sm text-[#888899] hover:text-[#ff6666] flex items-center gap-1">
              Full Scam Radar <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {scamAlerts.map((a, i) => (
              <Link key={i} href={`/games/${a.slug}`}
                className="flex items-center justify-between p-4 bg-[#111118] border border-[#1e1e2e] rounded-xl hover:border-[#ff333340] transition-all group">
                <div className="flex items-center gap-3">
                  <RiskBadge level={a.risk_level as 'high_risk' | 'scam'} score={a.risk_score} showScore />
                  <span className="font-medium group-hover:text-[#ff6666] transition-colors">{a.name}</span>
                  {a.chain && <span className="text-xs text-[#555566]">{a.chain}</span>}
                </div>
                <ChevronRight className="w-4 h-4 text-[#555566] group-hover:text-[#ff6666]" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Recently Verified Games ────────────────────────── */}
      {recentGames.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">✅ Recently Verified</h2>
            <Link href="/games" className="text-sm text-[#888899] hover:text-[#00ff88] flex items-center gap-1">
              All games <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentGames.map(g => (
              <GameCard key={g.id} {...g} affiliate_link_id={(g as GameWithRisk & { affiliate_link_id: number | null }).affiliate_link_id} />
            ))}
          </div>
        </section>
      )}

      {/* ── Essential Tools (Affiliate CTAs) ─────────────── */}
      {affiliateLinks.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xl font-bold mb-2">🔧 Essential Web3 Tools</h2>
          <p className="text-sm text-[#888899] mb-6">
            The exact tools covered in the P2E Bible. Every link is affiliate-tracked.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {affiliateLinks.map(link => (
              <Link key={link.id} href={`/go/${link.id}`} target="_blank"
                className="flex items-center justify-between p-4 bg-[#111118] border border-[#1e1e2e] rounded-xl card-hover group">
                <div>
                  <div className="font-medium text-sm group-hover:text-[#00ff88] transition-colors">{link.display_name}</div>
                  <div className="text-xs text-[#555566] capitalize mt-0.5">{link.partner_category}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#555566] group-hover:text-[#00ff88] transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Scout Status + Hub CTA ─────────────────────────── */}
      <section className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Scout Widget */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse-slow" />
            <h3 className="font-semibold text-sm">Scout Agent — Live</h3>
          </div>
          <p className="text-sm text-[#888899] mb-2">
            Scanning Twitter, Discord, RSS feeds, and the web every 6 hours for new P2E opportunities.
          </p>
          {lastScoutRun && (
            <p className="text-xs text-[#555566]">
              Last run: {new Date(lastScoutRun.completed_at).toLocaleDateString()} —{' '}
              found {lastScoutRun.games_found} new games
            </p>
          )}
          <Link href="/games" className="mt-4 inline-flex items-center gap-1 text-xs text-[#00ff88] hover:underline">
            See what Scout found <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* EarnHQ Hub CTA */}
        <div className="bg-gradient-to-br from-[#7c3aed]/10 to-[#111118] border border-[#7c3aed]/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-[#7c3aed]" />
            <h3 className="font-semibold text-sm">Build Your Own Affiliate Empire</h3>
          </div>
          <p className="text-sm text-[#888899] mb-4">
            Like how the P2E Bible works? Join the <strong className="text-[#e2e2e2]">EarnHQ Partner Network</strong> and
            build your own income stream — we provide the tools, agents, and affiliate infrastructure.
          </p>
          <a href="https://earnhq.ai" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#7c3aed] hover:text-[#9d5ced] transition-colors">
            <BookOpen className="w-4 h-4" /> Join EarnHQ.ai ↗
          </a>
        </div>

      </section>

    </div>
  );
}
