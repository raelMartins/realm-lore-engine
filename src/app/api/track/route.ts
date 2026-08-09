import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db/schema';
import { getTursoClient, getWorldId, isTursoConfigured } from '@/lib/db/turso';
import {
  clientIpFromHeaders,
  geoFromHeaders,
  isSelfIp,
  verifyTrackingSecret,
} from '@/lib/tracking';

export const dynamic = 'force-dynamic';

const MAX_EVENTS_PER_FLUSH = 80;
const MAX_NAME_LEN = 64;
const MAX_PAYLOAD_LEN = 2000;

type IngestBody = {
  visitId?: string;
  events?: Array<{
    name?: string;
    payload?: Record<string, unknown>;
    ts?: string;
  }>;
};

/** Ingest a visit heartbeat + batched named events. */
export async function POST(req: NextRequest) {
  if (!isTursoConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const db = getTursoClient();
  if (!db) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: IngestBody;
  try {
    body = (await req.json()) as IngestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const visitId = body.visitId?.trim();
  if (!visitId || visitId.length > 80) {
    return NextResponse.json({ error: 'visitId required.' }, { status: 400 });
  }

  const rawEvents = Array.isArray(body.events) ? body.events : [];
  const events = rawEvents.slice(0, MAX_EVENTS_PER_FLUSH).filter((e) => {
    const name = e?.name?.trim();
    return Boolean(name && name.length <= MAX_NAME_LEN);
  });

  await ensureSchema(db);
  const worldId = getWorldId();
  const now = new Date().toISOString();
  const ip = clientIpFromHeaders(req.headers);
  const geo = geoFromHeaders(req.headers);
  const ua = req.headers.get('user-agent')?.slice(0, 400) ?? null;
  const self = isSelfIp(ip) ? 1 : 0;

  const existing = await db.execute({
    sql: `SELECT id FROM visits WHERE id = ? LIMIT 1`,
    args: [visitId],
  });

  if (existing.rows.length === 0) {
    await db.execute({
      sql: `
        INSERT INTO visits (
          id, world_id, started_at, last_seen_at,
          ip, country, region, city, user_agent, is_self
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        visitId,
        worldId,
        now,
        now,
        ip,
        geo.country,
        geo.region,
        geo.city,
        ua,
        self,
      ],
    });
  } else {
    await db.execute({
      sql: `
        UPDATE visits
        SET last_seen_at = ?,
            ip = COALESCE(?, ip),
            country = COALESCE(?, country),
            region = COALESCE(?, region),
            city = COALESCE(?, city),
            is_self = CASE WHEN ? = 1 THEN 1 ELSE is_self END
        WHERE id = ?
      `,
      args: [now, ip, geo.country, geo.region, geo.city, self, visitId],
    });
  }

  for (const event of events) {
    const name = event.name!.trim();
    let payloadJson: string | null = null;
    if (event.payload && typeof event.payload === 'object') {
      try {
        const raw = JSON.stringify(event.payload);
        payloadJson = raw.length > MAX_PAYLOAD_LEN ? raw.slice(0, MAX_PAYLOAD_LEN) : raw;
      } catch {
        payloadJson = null;
      }
    }
    const clientTs =
      typeof event.ts === 'string' && event.ts.length < 40 ? event.ts : null;

    await db.execute({
      sql: `
        INSERT INTO visit_events (visit_id, world_id, name, payload_json, client_ts)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [visitId, worldId, name, payloadJson, clientTs],
    });
  }

  return NextResponse.json({ ok: true, accepted: events.length });
}

/** Read visits + events for the tracking dashboard (secret required). */
export async function GET(req: NextRequest) {
  const secret =
    req.headers.get('x-tracking-secret') ??
    req.nextUrl.searchParams.get('secret');

  if (!verifyTrackingSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!isTursoConfigured()) {
    return NextResponse.json({
      worldId: getWorldId(),
      visits: [],
      configured: false,
    });
  }

  const db = getTursoClient();
  if (!db) {
    return NextResponse.json({
      worldId: getWorldId(),
      visits: [],
      configured: false,
    });
  }

  await ensureSchema(db);
  const worldId = getWorldId();
  const hideSelf = req.nextUrl.searchParams.get('hideSelf') !== '0';
  const limit = Math.min(
    200,
    Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 80) || 80),
  );

  // Fetch extra when hiding self so loopback / newly matched IPs still fill the page.
  const fetchLimit = hideSelf ? Math.min(200, limit * 3) : limit;

  const visitsRes = await db.execute({
    sql: `
      SELECT id, world_id, started_at, last_seen_at, ip, country, region, city,
             user_agent, is_self
      FROM visits
      WHERE world_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `,
    args: [worldId, fetchLimit],
  });

  const visits = visitsRes.rows
    .map((row) => {
      const ip = row.ip == null ? null : String(row.ip);
      return {
        id: String(row.id),
        worldId: String(row.world_id),
        startedAt: String(row.started_at),
        lastSeenAt: String(row.last_seen_at),
        ip,
        country: row.country == null ? null : String(row.country),
        region: row.region == null ? null : String(row.region),
        city: row.city == null ? null : String(row.city),
        userAgent: row.user_agent == null ? null : String(row.user_agent),
        // Re-evaluate so older loopback rows hide even if stored as is_self=0.
        isSelf: Number(row.is_self) === 1 || isSelfIp(ip),
      };
    })
    .filter((v) => (hideSelf ? !v.isSelf : true))
    .slice(0, limit);

  const visitIds = visits.map((v) => v.id);
  const eventsByVisit: Record<
    string,
    Array<{
      id: number;
      name: string;
      payload: Record<string, unknown> | null;
      clientTs: string | null;
      receivedAt: string;
    }>
  > = {};

  if (visitIds.length > 0) {
    const placeholders = visitIds.map(() => '?').join(',');
    const eventsRes = await db.execute({
      sql: `
        SELECT id, visit_id, name, payload_json, client_ts, received_at
        FROM visit_events
        WHERE world_id = ? AND visit_id IN (${placeholders})
        ORDER BY COALESCE(client_ts, received_at) DESC
      `,
      args: [worldId, ...visitIds],
    });

    for (const row of eventsRes.rows) {
      const visitId = String(row.visit_id);
      let payload: Record<string, unknown> | null = null;
      if (typeof row.payload_json === 'string' && row.payload_json) {
        try {
          payload = JSON.parse(row.payload_json) as Record<string, unknown>;
        } catch {
          payload = null;
        }
      }
      if (!eventsByVisit[visitId]) eventsByVisit[visitId] = [];
      eventsByVisit[visitId].push({
        id: Number(row.id),
        name: String(row.name),
        payload,
        clientTs: row.client_ts == null ? null : String(row.client_ts),
        receivedAt: String(row.received_at),
      });
    }
  }

  return NextResponse.json({
    configured: true,
    worldId,
    hideSelf,
    visits: visits.map((v) => ({
      ...v,
      events: eventsByVisit[v.id] ?? [],
    })),
  });
}

type DeleteBody = {
  /** Delete these visit ids (scoped to current world). */
  ids?: string[];
  /** Delete every visit for the current world. */
  all?: boolean;
};

/** Delete selected visits (or all) for the tracking dashboard (secret required). */
export async function DELETE(req: NextRequest) {
  const secret =
    req.headers.get('x-tracking-secret') ??
    req.nextUrl.searchParams.get('secret');

  if (!verifyTrackingSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!isTursoConfigured()) {
    return NextResponse.json({ error: 'Tracking storage is not configured.' }, { status: 503 });
  }

  const db = getTursoClient();
  if (!db) {
    return NextResponse.json({ error: 'Tracking storage is not configured.' }, { status: 503 });
  }

  let body: DeleteBody;
  try {
    body = (await req.json()) as DeleteBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  await ensureSchema(db);
  const worldId = getWorldId();

  if (body.all === true) {
    await db.execute({
      sql: `DELETE FROM visit_events WHERE world_id = ?`,
      args: [worldId],
    });
    const visitsDel = await db.execute({
      sql: `DELETE FROM visits WHERE world_id = ?`,
      args: [worldId],
    });
    return NextResponse.json({
      ok: true,
      deleted: Number(visitsDel.rowsAffected ?? 0),
      all: true,
    });
  }

  const ids = Array.isArray(body.ids)
    ? [...new Set(body.ids.map((id) => String(id).trim()).filter(Boolean))].slice(
        0,
        200,
      )
    : [];

  if (ids.length === 0) {
    return NextResponse.json(
      { error: 'Provide ids or all: true.' },
      { status: 400 },
    );
  }

  const placeholders = ids.map(() => '?').join(',');
  await db.execute({
    sql: `DELETE FROM visit_events WHERE world_id = ? AND visit_id IN (${placeholders})`,
    args: [worldId, ...ids],
  });
  const visitsDel = await db.execute({
    sql: `DELETE FROM visits WHERE world_id = ? AND id IN (${placeholders})`,
    args: [worldId, ...ids],
  });

  return NextResponse.json({
    ok: true,
    deleted: Number(visitsDel.rowsAffected ?? 0),
    all: false,
  });
}
