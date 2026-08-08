import { NextRequest, NextResponse } from 'next/server';
import {
  authorizeGuildEdit,
  createGuildEditCookie,
  isGuildEditConfigured,
  verifyGuildPassphrase,
} from '@/lib/auth/guildEdit';

export const dynamic = 'force-dynamic';

/** Unlock guild charting for this browser session. */
export async function POST(req: NextRequest) {
  if (!isGuildEditConfigured()) {
    return NextResponse.json(
      { error: 'Guild editing is not configured on this deployment.' },
      { status: 503 },
    );
  }

  let body: { passphrase?: string };
  try {
    body = (await req.json()) as { passphrase?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!verifyGuildPassphrase(body.passphrase)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const cookie = createGuildEditCookie();
  if (!cookie) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}

/** Check whether this request already has a valid edit session. */
export async function GET(req: NextRequest) {
  const ok = authorizeGuildEdit({
    cookieHeader: req.headers.get('cookie'),
  });
  return NextResponse.json({
    unlocked: ok,
    configured: isGuildEditConfigured(),
  });
}
