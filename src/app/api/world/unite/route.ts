import { NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db/schema';
import { getTursoClient, getWorldId, isTursoConfigured } from '@/lib/db/turso';
import { loadWorld } from '@/lib/world/loadWorld';

export const dynamic = 'force-dynamic';

/** Persist alliance / united flag for this deployment world. */
export async function POST() {
  if (!isTursoConfigured()) {
    return NextResponse.json({ ok: true, source: 'local-only' });
  }

  try {
    const db = getTursoClient()!;
    await ensureSchema(db);
    await loadWorld();
    const worldId = getWorldId();
    await db.execute({
      sql: `UPDATE worlds SET united = 1, updated_at = datetime('now') WHERE id = ?`,
      args: [worldId],
    });
    return NextResponse.json({ ok: true, source: 'turso' });
  } catch (error) {
    console.error('Failed to persist united state:', error);
    return NextResponse.json({ ok: true, source: 'local-only' });
  }
}
