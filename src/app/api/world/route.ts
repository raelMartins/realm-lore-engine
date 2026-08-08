import { NextResponse } from 'next/server';
import { loadWorld } from '@/lib/world/loadWorld';

export const dynamic = 'force-dynamic';

/** Active world for this deployment: static west + Turso east (WORLD_ID). */
export async function GET() {
  const { data, source, worldId } = await loadWorld();

  return NextResponse.json({
    ...data,
    _meta: { source, worldId },
  });
}
