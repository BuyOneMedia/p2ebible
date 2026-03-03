import Link from 'next/link';
import { getDb } from '@/lib/db';
import RiskBadge from '@/components/RiskBadge';
import { Shield, AlertOctagon, CheckCircle, ChevronRight } from 'lucide-react';

export const revalidate = 300;

function getData() {
  const db = getDb();
  const scores = db.prepare(`
    SELECT g.id, g.slug, g.name, g.chain, g.genre, g.website_url,
           rs.risk_level, rs.score AS risk_score,
           rs.red_flags, rs.green_flags, rs.full_analysis, rs.analyzed_at
    FROM risk_scores rs
    JOIN games g ON g.id = rs.game_id
    WHERE g.status IN ('approved', 'rejected')
    ORDER BY rs.score DESC
    LIMIT 200
  `).all() as {
    id: number; slug: string; name: string; chain: string | null;
    genre: string | null; website_url: string | null;
    risk_level: string; risk_score: number;
    red_flags: string | null; green_flags: string | null;
    full_analysis: string | null; analyzed_at: string;
  }[];

  const counts = {
    safe:      scores.filter(s => s.risk_level === 'safe').length,
    moderate:  scores.filter(s => s.risk_level === 'moderate').length,
    high_risk: scores.filter(s => s.risk_level === 'high_risk').length,
    scam:      scores.filter(s => s.risk_level === 'scam').length,
  };

  return { scores, counts };
}

export default function ScamRadarPage() {
  const { scores, counts } = getData();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-7 h-7 text-[#00ff88]" />
          <h1 className="text-3xl font-bold">Scam Radar</h1>
        </div>
        <p className="text-[#888899] max-w-2xl">
          Every game analyzed by the <strong className="text-[#e2e2e2]">Detective agent</strong>. Risk scores are
          based on tokenomics, team credibility, documentation quality, and social signals.
          Check a game before you invest.
        </p>

        {/* Summary stats */}
        <div className="flex flex-wrap gap-3 mt-6">
          {[
            { label: 'Safe', count: counts.safe, className: 'badge-safe' },
            { label: 'Moderate', count: counts.moderate, className: 'badge-moderate' },
            { label: 'High Risk', count: counts.high_risk, className: 'badge-high' },
            { label: 'Scam', count: counts.scam, className: 'badge-scam' },
          ].map(({ label, count, className }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm ${className}`}>
              <span className="font-bold text-lg">{count}</span>
              <span className="opacity-80">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      {scores.length === 0 ? (
        <div className="text-center py-20 text-[#888899]">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No games have been analyzed yet.</p>
          <p className="text-sm mt-1">The Detective agent is running. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scores.map((game) => {
            const redFlags: string[] = game.red_flags ? JSON.parse(game.red_flags) : [];
            const greenFlags: string[] = game.green_flags ? JSON.parse(game.green_flags) : [];
            const riskLevel = game.risk_level as 'safe' | 'moderate' | 'high_risk' | 'scam';

            return (
              <details key={game.id} className="group bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden hover:border-[#2a2a3e] transition-colors">
                <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Score pill */}
                    <div className="flex-shrink-0 w-10 text-center">
                      <span className={`font-mono font-bold text-sm ${
                        riskLevel === 'safe' ? 'text-[#00ff88]' :
                        riskLevel === 'moderate' ? 'text-[#fbbf24]' :
                        riskLevel === 'high_risk' ? 'text-[#f97316]' :
                        'text-[#ff3333]'
                      }`}>{game.risk_score}</span>
                    </div>

                    <RiskBadge level={riskLevel} size="sm" />

                    <Link href={`/games/${game.slug}`} onClick={e => e.stopPropagation()}
                      className="font-medium truncate hover:text-[#00ff88] transition-colors">
                      {game.name}
                    </Link>

                    {game.chain && <span className="hidden sm:inline text-xs text-[#555566] flex-shrink-0">{game.chain}</span>}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex gap-1">
                      {greenFlags.slice(0, 2).map((_, i) => (
                        <CheckCircle key={i} className="w-3 h-3 text-[#00ff88]/50" />
                      ))}
                      {redFlags.slice(0, 3).map((_, i) => (
                        <AlertOctagon key={i} className="w-3 h-3 text-[#ff3333]/50" />
                      ))}
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#555566] group-open:rotate-90 transition-transform flex-shrink-0" />
                  </div>
                </summary>

                {/* Expanded detail */}
                <div className="px-4 pb-4 border-t border-[#1e1e2e] pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {greenFlags.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[#00ff88] uppercase tracking-wider mb-2">Green Flags</p>
                        <ul className="space-y-1">
                          {greenFlags.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-[#888899]">
                              <CheckCircle className="w-3 h-3 text-[#00ff88] mt-0.5 flex-shrink-0" /> {f}
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
                            <li key={i} className="flex items-start gap-2 text-xs text-[#888899]">
                              <AlertOctagon className="w-3 h-3 text-[#ff3333] mt-0.5 flex-shrink-0" /> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {game.full_analysis && (
                    <p className="text-xs text-[#888899] line-clamp-3 leading-relaxed">{game.full_analysis}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-[#555566]">
                      Analyzed {new Date(game.analyzed_at).toLocaleDateString()}
                    </span>
                    <Link href={`/games/${game.slug}`}
                      className="text-xs text-[#00ff88] hover:underline flex items-center gap-1">
                      Full report <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
