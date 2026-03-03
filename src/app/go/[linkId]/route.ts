/**
 * CLERK — Affiliate Redirect Handler
 * Supports /go/42 (numeric ID) and /go/ledger (named slug)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

async function pingEarnHQ(data: Record<string, string>) {
  const hubUrl = process.env.EARNHQ_HUB_URL;
  const hubSecret = process.env.EARNHQ_HUB_SECRET;
  if (!hubUrl || !hubSecret) return;
  try {
    await fetch(`${hubUrl}/api/spoke-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-spoke-secret': hubSecret },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(3000),
    });
  } catch { /* silent fail */ }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params;
  const db = getDb();

  const isNumeric = /^\d+$/.test(linkId);
  const link = (isNumeric
    ? db.prepare('SELECT * FROM affiliate_links WHERE id = ? AND is_active = 1').get(parseInt(linkId, 10))
    : db.prepare('SELECT * FROM affiliate_links WHERE slug = ? AND is_active = 1').get(linkId)
  ) as { id: number; slug: string | null; affiliate_url: string; partner: string; partner_category: string } | undefined;

  if (!link) return NextResponse.redirect(new URL('/', req.url));

  try {
    const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const ipHash = createHash('sha256').update(ip).digest('hex');
    const userAgent = (req.headers.get('user-agent') || '').slice(0, 500);
    const referrer = (req.headers.get('referer') || '').slice(0, 500);

    db.prepare('INSERT INTO clicks (affiliate_link_id, ip_hash, user_agent, referrer) VALUES (?,?,?,?)').run(link.id, ipHash, userAgent, referrer);
    db.prepare('UPDATE affiliate_links SET click_count = click_count + 1, last_clicked_at = CURRENT_TIMESTAMP WHERE id = ?').run(link.id);

    pingEarnHQ({ spoke: 'p2ebible.com', partner: link.partner, partner_category: link.partner_category, slug: link.slug || String(link.id), referrer: referrer.slice(0, 200), timestamp: new Date().toISOString() });
  } catch (err) { console.error('[Clerk]', err); }

  return NextResponse.redirect(link.affiliate_url, { status: 302 });
}
