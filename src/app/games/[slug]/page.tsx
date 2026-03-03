import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import RiskBadge from '@/components/RiskBadge';
import GameCard from '@/components/GameCard';
import type { GameWithRisk } from '@/lib/db';
import {
  ExternalLink, ChevronLeft, Layers, Tag, Globe,
  CheckCircle2, XCircle, Shield
} from 'lucide-react';

export const revalidate = 600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getData(slug: string) {
  const db = getDb();

  const game = db.prepare(`
    SELECT g.*, rs.risk_level, rs.score AS risk_score,
           rs.tokenomics_analysis, rs.team_analysis, rs.whitepaper_analysis,
           rs.red_flags, rs.green_flags, rs.full_analysis, rs.analyzed_at,
           al.id AS affiliate_link_id
    FROM games g
    LEFT JOIN risk_scores rs ON rs.game_id = g.id
    LEFT JOIN affiliate_links al ON al.game_id = g.id AND al.is_active = 1
    WHERE g.slug = ? AND g.status = 'approved'
  `).get(slug) as (GameWithRisk & {
    tokenomics_analysis: string | null;
    team_analysis: string | null;
    whitepaper_analysis: string | null;
    analyzed_at: string | null;
    affiliate_link_id: number | null;
  }) | undefined;

  if (!game) return null;

  const related = db.prepare(`
    SELECT g.*, rs.risk_level, rs.score AS risk_score,
           rs.red_flags, rs.green_flags, rs.full_analysis,
           al.id AS affiliate_link_id
    FROM games g
    LEFT JOIN risk_scores rs ON rs.game_id = g.id
    LEFT JOIN affiliate_links al ON al.game_id = g.id AND al.is_active = 1
    WHERE g.status = 'approved' AND g.id != ? AND g.chain = ?
    ORDER BY g.discovered_at DESC LIMIT 3
  `).all(game.id, game.chain) as (GameWithRisk & { affiliate_link_id: number | null })[];

  return { game, related };
}

export default async function GameDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = getData(slug);
  if (!data) notFound();

  const { game, related } = data;
  const redFlags: string[] = game.red_flags ? JSON.parse(game.red_flags) : [];
  const greenFlags: string[] = game.green_flags ? JSON.parse(game.green_flags) : [];

  const riskColor = {
    safe:      '#00ff88',
    moderate:  '#fbbf24',
    high_risk: '#f97316',
    scam:      '#ff3333',
  }[game.risk_level || 'moderate'] || '#888899';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Back */}
      <Link href="/games" className="inline-flex items-center gap-1 text-sm text-[#888899] hover:text-[#e2e2e2] mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Games
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{game.name}</h1>
          <div className="flex flex-wrap gap-2">
            {game.chain && (
              <span className="flex items-center gap-1 text-xs text-[#888899] bg-[#16161f] px-2 py-1 rounded border border-[#1e1e2e]">
                <Layers className="w-3 h-3" /> {game.chain}
              </span>
            )}
            {game.genre && (
              <span className="flex items-center gap-1 text-xs text-[#888899] bg-[#16161f] px-2 py-1 rounded border border-[#1e1e2e]">
                <Tag className="w-3 h-3" /> {game.genre}
              </span>
            )}
            {game.token_symbol && (
              <span className="text-xs text-[#7c3aed] bg-[#7c3aed]/10 border border-[#7c3aed]/20 px-2 py-1 rounded font-mono">
                ${game.token_symbol}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <RiskBadge level={game.risk_level} score={game.risk_score} size="lg" showScore />
          <div className="flex gap-2">
            {game.website_url && (
              <a href={game.website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-[#2a2a3e] text-[#888899] hover:text-[#e2e2e2] transition-all">
                <Globe className="w-3.5 h-3.5" /> Website
              </a>
            )}
            {game.affiliate_link_id && (
              <Link href={`/go/${game.affiliate_link_id}`} target="_blank"
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/20 font-medium transition-all">
                Play Now <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {game.description && (
        <p className="text-[#888899] mb-8 text-base leading-relaxed">{game.description}</p>
      )}

      {/* Risk Score Card */}
      {game.risk_level && (
        <div className="bg-[#111118] border rounded-xl p-6 mb-6" style={{ borderColor: riskColor + '40' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: riskColor }} />
              <h2 className="font-bold text-lg">Detective Risk Report</h2>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-mono" style={{ color: riskColor }}>
                {game.risk_score}/100
              </div>
              <div className="text-xs text-[#888899]">risk score</div>
            </div>
          </div>

          {/* Risk meter bar */}
          <div className="h-2 bg-[#1e1e2e] rounded-full mb-6 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{
              width: `${game.risk_score}%`,
              background: `linear-gradient(to right, #00ff88, ${riskColor})`
            }} />
          </div>

          {/* Flags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {greenFlags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#00ff88] uppercase tracking-wider mb-2">Green Flags</p>
                <ul className="space-y-1">
                  {greenFlags.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#888899]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff88] mt-0.5 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {redFlags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#ff3333] uppercase tracking-wider mb-2">Red Flags</p>
                <ul className="space-y-1">
                  {redFlags.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#888899]">
                      <XCircle className="w-3.5 h-3.5 text-[#ff3333] mt-0.5 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Analysis breakdown */}
          {[
            { label: 'Tokenomics', text: game.tokenomics_analysis },
            { label: 'Team & Credibility', text: game.team_analysis },
            { label: 'Documentation', text: game.whitepaper_analysis },
          ].filter(a => a.text).map(({ label, text }) => (
            <div key={label} className="mb-4">
              <p className="text-xs font-semibold text-[#888899] uppercase tracking-wider mb-1">{label}</p>
              <p className="text-sm text-[#aaaabc] leading-relaxed">{text}</p>
            </div>
          ))}

          {/* Full analysis */}
          {game.full_analysis && (
            <details className="mt-4">
              <summary className="text-sm text-[#888899] cursor-pointer hover:text-[#e2e2e2]">
                Full Analysis Report ▸
              </summary>
              <p className="mt-3 text-sm text-[#aaaabc] leading-relaxed whitespace-pre-wrap">
                {game.full_analysis}
              </p>
            </details>
          )}

          {game.analyzed_at && (
            <p className="text-xs text-[#555566] mt-4">
              Analyzed by Detective on {new Date(game.analyzed_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Related Games */}
      {related.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4">More {game.chain} Games</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map(g => <GameCard key={g.id} {...g} />)}
          </div>
        </section>
      )}

    </div>
  );
}
