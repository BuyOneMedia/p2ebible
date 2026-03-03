import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
    const db = getDb();
    const scores = db.prepare(`
      SELECT g.id, g.slug, g.name, g.chain, g.genre, g.website_url,
             rs.risk_level, rs.score AS risk_score, rs.red_flags, rs.green_flags,
             rs.full_analysis, rs.analyzed_at
      FROM risk_scores rs
      JOIN games g ON g.id = rs.game_id
      ORDER BY rs.score DESC
      LIMIT ?
    `).all(limit);

    return NextResponse.json({ scores });
  } catch (err) {
    console.error('[API/risk]', err);
    return NextResponse.json({ error: 'Failed to fetch risk scores' }, { status: 500 });
  }
}
