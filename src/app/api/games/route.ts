import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status    = searchParams.get('status') || 'approved';
  const risk      = searchParams.get('risk');
  const chain     = searchParams.get('chain');
  const genre     = searchParams.get('genre');
  const featured  = searchParams.get('featured');
  const limit     = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset    = parseInt(searchParams.get('offset') || '0');

  try {
    const db = getDb();

    let query = `
      SELECT
        g.*,
        rs.risk_level, rs.score AS risk_score,
        rs.red_flags, rs.green_flags, rs.full_analysis,
        rs.tokenomics_analysis, rs.team_analysis,
        al.id AS affiliate_link_id
      FROM games g
      LEFT JOIN risk_scores rs ON rs.game_id = g.id
      LEFT JOIN affiliate_links al ON al.game_id = g.id AND al.is_active = 1
      WHERE g.status = ?
    `;
    const args: (string | number)[] = [status];

    if (risk)     { query += ' AND rs.risk_level = ?'; args.push(risk); }
    if (chain)    { query += ' AND LOWER(g.chain) = LOWER(?)'; args.push(chain); }
    if (genre)    { query += ' AND LOWER(g.genre) = LOWER(?)'; args.push(genre); }
    if (featured) { query += ' AND g.is_featured = 1'; }

    query += ' ORDER BY g.discovered_at DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const games = db.prepare(query).all(...args);
    const total = (db.prepare('SELECT COUNT(*) as count FROM games WHERE status = ?').get(status) as { count: number }).count;

    return NextResponse.json({ games, total, limit, offset });
  } catch (err) {
    console.error('[API/games]', err);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}
