import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function requireAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret');
  return !!process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const runs = db.prepare(`
    SELECT * FROM agent_runs
    ORDER BY started_at DESC
    LIMIT 50
  `).all();

  // Also get summary stats
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM games)                          AS total_games,
      (SELECT COUNT(*) FROM games WHERE status='approved')  AS approved_games,
      (SELECT COUNT(*) FROM games WHERE status='pending_review') AS pending_games,
      (SELECT COUNT(*) FROM risk_scores)                    AS analyzed_games,
      (SELECT COUNT(*) FROM affiliate_links WHERE is_active=1) AS active_links,
      (SELECT SUM(click_count) FROM affiliate_links)        AS total_clicks
  `).get();

  return NextResponse.json({ runs, stats });
}
