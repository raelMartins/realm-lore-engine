import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getWorldId } from '@/lib/db/turso';
import { seedWorld, type WorldSeedPayload } from '@/lib/world/seedWorld';

export const dynamic = 'force-dynamic';

function seedAllowed(): boolean {
  // Never expose seed writes from production deployments.
  return process.env.NODE_ENV !== 'production';
}

function verifySeedSecret(provided: string | null): boolean {
  const expected = process.env.DEV_SEED_SECRET?.trim();
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Dev-only bulk seed for east-isle world content.
 * Header: x-dev-seed-secret: <DEV_SEED_SECRET>
 */
export async function POST(req: NextRequest) {
  if (!seedAllowed()) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const secret =
    req.headers.get('x-dev-seed-secret') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    null;

  if (!verifySeedSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: WorldSeedPayload;
  try {
    body = (await req.json()) as WorldSeedPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const result = await seedWorld(body, getWorldId());
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    worldId: result.worldId,
    pinCount: result.pinCount,
  });
}

/** Probe whether seed is available in this environment (no secret leak). */
export async function GET() {
  if (!seedAllowed()) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    seedEnabled: true,
    configured: Boolean(process.env.DEV_SEED_SECRET?.trim()),
  });
}
