import Link from 'next/link';
import { getDb } from '@/lib/db';
import type { GameWithRisk } from '@/lib/db';
import GameCard from '@/components/GameCard';
import { Gamepad2 } from 'lucide-react';

export const revalidate = 300;

const CHAINS = ['Ethereum', 'Solana', 'Polygon', 'BNB', 'Arbitrum', 'Avalanche', 'Ronin'];
const GENRES = ['RPG', 'Strategy', 'Card Game', 'Sports', 'Racing', 'Shooter', 'Adventure', 'Simulation'];
const RISK_LEVELS = [
  { value: 'safe',      label: '✅ Safe' },
  { value: 'moderate',  label: '⚠ Moderate' },
  { value: 'high_risk', label: '🔴 High Risk' },
  { value: 'scam',      label: '☠ Scam' },
];

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

function getData(params: Record<string, string>) {
  const db = getDb();
  const risk    = params.risk    || null;
  const chain   = params.chain   || null;
  const genre   = params.genre   || null;
  const featured = params.featured || null;
  const sort    = params.sort    || 'newest';

  let query = `
    SELECT g.*, rs.risk_level, rs.score AS risk_score,
           rs.red_flags, rs.green_flags, rs.full_analysis,
           al.id AS affiliate_link_id
    FROM games g
    LEFT JOIN risk_scores rs ON rs.game_id = g.id
    LEFT JOIN affiliate_links al ON al.game_id = g.id AND al.is_active = 1
    WHERE g.status = 'approved'
  `;
  const args: (string | number)[] = [];

  if (risk)    { query += ' AND rs.risk_level = ?'; args.push(risk); }
  if (chain)   { query += ' AND LOWER(g.chain) = LOWER(?)'; args.push(chain); }
  if (genre)   { query += ' AND LOWER(g.genre) = LOWER(?)'; args.push(genre); }
  if (featured){ query += ' AND g.is_featured = 1'; }

  if (sort === 'score_asc')  query += ' ORDER BY rs.score ASC, g.discovered_at DESC';
  else if (sort === 'az')    query += ' ORDER BY g.name ASC';
  else                        query += ' ORDER BY g.discovered_at DESC'; // newest (default)

  query += ' LIMIT 60';

  const games = db.prepare(query).all(...args) as (GameWithRisk & { affiliate_link_id: number | null })[];
  const total = (db.prepare('SELECT COUNT(*) as c FROM games WHERE status=\'approved\'').get() as { c: number }).c;

  return { games, total };
}

export default async function GamesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { games, total } = getData(params);

  const activeRisk    = params.risk;
  const activeChain   = params.chain;
  const activeGenre   = params.genre;
  const activeFeatured = params.featured;
  const activeSort    = params.sort || 'newest';

  function filterUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { risk: activeRisk, chain: activeChain, genre: activeGenre, featured: activeFeatured, sort: activeSort, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    const s = p.toString();
    return `/games${s ? '?' + s : ''}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Gamepad2 className="w-6 h-6 text-[#00ff88]" />
        <div>
          <h1 className="text-2xl font-bold">P2E Game Directory</h1>
          <p className="text-sm text-[#888899]">{total} games indexed — all Detective-analyzed</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Filters sidebar ── */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 space-y-5 sticky top-20">

            <div>
              <p className="text-xs font-semibold text-[#888899] uppercase tracking-wider mb-2">Sort by</p>
              {[['newest', 'Newest First'], ['score_asc', 'Safest First'], ['az', 'A → Z']].map(([val, label]) => (
                <Link key={val} href={filterUrl({ sort: val })}
                  className={`block text-sm py-1.5 px-2 rounded ${activeSort === val ? 'text-[#00ff88] bg-[#00ff88]/10' : 'text-[#888899] hover:text-[#e2e2e2]'}`}>
                  {label}
                </Link>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-[#888899] uppercase tracking-wider mb-2">Risk Level</p>
              <Link href={filterUrl({ risk: undefined })}
                className={`block text-sm py-1.5 px-2 rounded ${!activeRisk ? 'text-[#00ff88]' : 'text-[#888899] hover:text-[#e2e2e2]'}`}>
                All levels
              </Link>
              {RISK_LEVELS.map(({ value, label }) => (
                <Link key={value} href={filterUrl({ risk: value })}
                  className={`block text-sm py-1.5 px-2 rounded ${activeRisk === value ? 'text-[#00ff88] bg-[#00ff88]/10' : 'text-[#888899] hover:text-[#e2e2e2]'}`}>
                  {label}
                </Link>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-[#888899] uppercase tracking-wider mb-2">Blockchain</p>
              <Link href={filterUrl({ chain: undefined })}
                className={`block text-sm py-1.5 px-2 rounded ${!activeChain ? 'text-[#00ff88]' : 'text-[#888899] hover:text-[#e2e2e2]'}`}>
                All chains
              </Link>
              {CHAINS.map(c => (
                <Link key={c} href={filterUrl({ chain: c })}
                  className={`block text-sm py-1.5 px-2 rounded ${activeChain === c ? 'text-[#00ff88] bg-[#00ff88]/10' : 'text-[#888899] hover:text-[#e2e2e2]'}`}>
                  {c}
                </Link>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-[#888899] uppercase tracking-wider mb-2">Genre</p>
              <Link href={filterUrl({ genre: undefined })}
                className={`block text-sm py-1.5 px-2 rounded ${!activeGenre ? 'text-[#00ff88]' : 'text-[#888899] hover:text-[#e2e2e2]'}`}>
                All genres
              </Link>
              {GENRES.map(g => (
                <Link key={g} href={filterUrl({ genre: g })}
                  className={`block text-sm py-1.5 px-2 rounded ${activeGenre === g ? 'text-[#00ff88] bg-[#00ff88]/10' : 'text-[#888899] hover:text-[#e2e2e2]'}`}>
                  {g}
                </Link>
              ))}
            </div>

          </div>
        </aside>

        {/* ── Game grid ── */}
        <div className="flex-1">
          {games.length === 0 ? (
            <div className="text-center py-20 text-[#888899]">
              <Gamepad2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No games found matching these filters.</p>
              <Link href="/games" className="text-[#00ff88] text-sm hover:underline mt-2 inline-block">Clear filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {games.map(g => <GameCard key={g.id} {...g} />)}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
