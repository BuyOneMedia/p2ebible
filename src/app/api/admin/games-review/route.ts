/**
 * Admin API — Game Review (approve/reject games found by Scout)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function requireAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret');
  return !!process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET;
}

// GET — list games pending review
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'pending_review';

  const db = getDb();
  const games = db.prepare(`
    SELECT g.*,
           rs.risk_level, rs.score AS risk_score,
           rs.red_flags, rs.green_flags
    FROM games g
    LEFT JOIN risk_scores rs ON rs.game_id = g.id
    WHERE g.status = ?
    ORDER BY g.discovered_at DESC
    LIMIT 100
  `).all(status);

  return NextResponse.json({ games });
}

// PATCH — approve or reject a game, or update game fields
export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    id: number;
    status?: 'approved' | 'rejected' | 'pending_review';
    is_featured?: number;
    referral_url?: string;
    affiliate_notes?: string;
    image_url?: string;
    chain?: string;
    genre?: string;
  };

  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = getDb();
  db.prepare(`
    UPDATE games SET
      status          = COALESCE(?, status),
      is_featured     = COALESCE(?, is_featured),
      referral_url    = COALESCE(?, referral_url),
      affiliate_notes = COALESCE(?, affiliate_notes),
      image_url       = COALESCE(?, image_url),
      chain           = COALESCE(?, chain),
      genre           = COALESCE(?, genre),
      updated_at      = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    body.status ?? null,
    body.is_featured ?? null,
    body.referral_url ?? null,
    body.affiliate_notes ?? null,
    body.image_url ?? null,
    body.chain ?? null,
    body.genre ?? null,
    body.id
  );

  return NextResponse.json({ ok: true });
}
