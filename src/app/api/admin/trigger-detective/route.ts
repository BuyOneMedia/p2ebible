import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';

export const dynamic = 'force-dynamic';

function requireAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret') || req.nextUrl.searchParams.get('secret');
  return secret === process.env.ADMIN_SECRET && !!process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    exec('pm2 restart p2ebible-detective', (err) => {
      if (err) console.error('[trigger-detective]', err);
    });
    return NextResponse.json({ ok: true, message: 'Detective triggered' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
