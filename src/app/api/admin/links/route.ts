/**
 * Admin API — Affiliate Link Management (CRUD)
 * All routes require x-admin-secret header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function requireAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret');
  return !!process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET;
}

// GET — list all affiliate links
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const links = db.prepare(`
    SELECT al.*, g.name AS game_name, g.slug AS game_slug
    FROM affiliate_links al
    LEFT JOIN games g ON g.id = al.game_id
    ORDER BY al.created_at DESC
  `).all();

  return NextResponse.json({ links });
}

// POST — create a new affiliate link
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    partner: string;
    partner_category: string;
    display_name: string;
    destination_url: string;
    affiliate_url: string;
    game_id?: number;
  };

  const { partner, partner_category, display_name, destination_url, affiliate_url, game_id } = body;

  if (!partner || !display_name || !destination_url || !affiliate_url) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO affiliate_links (partner, partner_category, display_name, destination_url, affiliate_url, game_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(partner, partner_category || 'other', display_name, destination_url, affiliate_url, game_id ?? null);

  return NextResponse.json({ ok: true, id: result.lastInsertRowid });
}

// PUT — update an affiliate link
export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    id: number;
    partner?: string;
    partner_category?: string;
    display_name?: string;
    destination_url?: string;
    affiliate_url?: string;
    game_id?: number | null;
    is_active?: number;
  };

  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = getDb();
  db.prepare(`
    UPDATE affiliate_links SET
      partner          = COALESCE(?, partner),
      partner_category = COALESCE(?, partner_category),
      display_name     = COALESCE(?, display_name),
      destination_url  = COALESCE(?, destination_url),
      affiliate_url    = COALESCE(?, affiliate_url),
      game_id          = ?,
      is_active        = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    body.partner ?? null,
    body.partner_category ?? null,
    body.display_name ?? null,
    body.destination_url ?? null,
    body.affiliate_url ?? null,
    body.game_id !== undefined ? body.game_id : null,
    body.is_active ?? null,
    body.id
  );

  return NextResponse.json({ ok: true });
}

// DELETE — remove an affiliate link
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get('id') || '0');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = getDb();
  db.prepare('DELETE FROM affiliate_links WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
