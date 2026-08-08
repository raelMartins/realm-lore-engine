import type { Client } from '@libsql/client';
import type { CompanyLoreConfig, LorePin, PinType } from '@/types/world';
import { normalizePin } from '@/lib/getCompanyData';
import { ensureSchema } from '@/lib/db/schema';
import { getTursoClient, isTursoConfigured } from '@/lib/db/turso';
import { isAvatarAllowedForRealm } from '@/config/avatars';
import {
  GUILD_PIN_CAP,
  PLACEMENT_ERROR_MESSAGE,
  validateGuildPlacement,
} from '@/lib/world/placement';

const PIN_TYPES: PinType[] = [
  'character',
  'project',
  'achievement',
  'quest',
  'easter_egg',
];

const DEFAULT_ICONS: Record<PinType, string> = {
  character: 'User',
  project: 'Boxes',
  achievement: 'Trophy',
  quest: 'Scroll',
  easter_egg: 'Sparkles',
};

/** East-isle world document for bulk seeding (west pins stay in-repo). */
export interface WorldSeedPayload {
  /** Defaults to WORLD_ID env when omitted */
  worldId?: string;
  companyName: string;
  tagline: string;
  customPitchMessage: string;
  realmLabelCompany?: string;
  primaryColorHex?: string;
  targetTeamMembers?: NonNullable<CompanyLoreConfig['targetTeamMembers']>;
  /** Guild-shore pins only — realm is forced to company */
  pins: Array<Omit<LorePin, 'realm'> & { realm?: 'company' }>;
  /** When true (default), replace existing guild pins for this world */
  replacePins?: boolean;
}

export type SeedWorldResult =
  | {
      ok: true;
      worldId: string;
      pinCount: number;
    }
  | { ok: false; error: string; status: number };

function normalizeSeedPin(raw: WorldSeedPayload['pins'][number]): LorePin | string {
  if (!raw.id?.trim()) return 'Each pin needs an id.';
  if (!raw.title?.trim()) return `Pin ${raw.id}: title required.`;
  if (!raw.content?.description?.trim()) {
    return `Pin ${raw.id}: description required.`;
  }
  if (!PIN_TYPES.includes(raw.category as PinType)) {
    return `Pin ${raw.id}: invalid category.`;
  }

  const category = raw.category as PinType;
  let avatarId = raw.avatarId;
  if (category === 'character') {
    if (!avatarId) return `Pin ${raw.id}: character pins need avatarId.`;
    if (!isAvatarAllowedForRealm(avatarId, 'company')) {
      return `Pin ${raw.id}: avatar is not allowed on the guild shore.`;
    }
  } else {
    avatarId = undefined;
  }

  const pin = normalizePin({
    id: raw.id.trim(),
    title: raw.title.trim(),
    subtitle: (raw.subtitle ?? '').trim(),
    category,
    realm: 'company',
    iconName: raw.iconName?.trim() || DEFAULT_ICONS[category],
    avatarId,
    coordinates: {
      x: Number(raw.coordinates?.x),
      y: Number(raw.coordinates?.y),
    },
    content: {
      ...raw.content,
      description: raw.content.description.trim(),
    },
  });

  if (
    !Number.isFinite(pin.coordinates.x) ||
    !Number.isFinite(pin.coordinates.y)
  ) {
    return `Pin ${raw.id}: coordinates must be numbers.`;
  }

  return pin;
}

async function upsertWorldMeta(
  db: Client,
  worldId: string,
  payload: WorldSeedPayload,
): Promise<void> {
  const teamJson = JSON.stringify(payload.targetTeamMembers ?? []);
  const existing = await db.execute({
    sql: 'SELECT id FROM worlds WHERE id = ? LIMIT 1',
    args: [worldId],
  });

  if (existing.rows.length === 0) {
    await db.execute({
      sql: `
        INSERT INTO worlds (
          id, company_name, tagline, custom_pitch_message,
          realm_label_company, primary_color_hex, united, team_members_json
        ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
      `,
      args: [
        worldId,
        payload.companyName,
        payload.tagline,
        payload.customPitchMessage,
        payload.realmLabelCompany ?? null,
        payload.primaryColorHex ?? null,
        teamJson,
      ],
    });
    return;
  }

  await db.execute({
    sql: `
      UPDATE worlds SET
        company_name = ?,
        tagline = ?,
        custom_pitch_message = ?,
        realm_label_company = ?,
        primary_color_hex = ?,
        team_members_json = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `,
    args: [
      payload.companyName,
      payload.tagline,
      payload.customPitchMessage,
      payload.realmLabelCompany ?? null,
      payload.primaryColorHex ?? null,
      teamJson,
      worldId,
    ],
  });
}

/**
 * Upsert world meta and guild pins for a WORLD_ID.
 * West-isle content is never written here.
 */
export async function seedWorld(
  payload: WorldSeedPayload,
  defaultWorldId: string,
): Promise<SeedWorldResult> {
  if (!isTursoConfigured()) {
    return {
      ok: false,
      error: 'Turso is not configured.',
      status: 503,
    };
  }

  if (!payload.companyName?.trim()) {
    return { ok: false, error: 'companyName is required.', status: 400 };
  }
  if (!payload.tagline?.trim()) {
    return { ok: false, error: 'tagline is required.', status: 400 };
  }
  if (!payload.customPitchMessage?.trim()) {
    return {
      ok: false,
      error: 'customPitchMessage is required.',
      status: 400,
    };
  }
  if (!Array.isArray(payload.pins)) {
    return { ok: false, error: 'pins must be an array.', status: 400 };
  }
  if (payload.pins.length > GUILD_PIN_CAP) {
    return {
      ok: false,
      error: `Too many pins (max ${GUILD_PIN_CAP}).`,
      status: 400,
    };
  }

  const worldId = (payload.worldId?.trim() || defaultWorldId).trim();
  if (!worldId) {
    return { ok: false, error: 'worldId is required.', status: 400 };
  }

  const pins: LorePin[] = [];
  for (const raw of payload.pins) {
    const result = normalizeSeedPin(raw);
    if (typeof result === 'string') {
      return { ok: false, error: result, status: 400 };
    }
    const placementError = validateGuildPlacement(result.coordinates, pins);
    if (placementError) {
      return {
        ok: false,
        error: `Pin ${result.id}: ${PLACEMENT_ERROR_MESSAGE[placementError]}`,
        status: 400,
      };
    }
    pins.push(result);
  }

  const db = getTursoClient()!;
  await ensureSchema(db);
  await upsertWorldMeta(db, worldId, payload);

  const replace = payload.replacePins !== false;
  if (replace) {
    await db.execute({
      sql: `DELETE FROM pins WHERE world_id = ? AND realm = 'company'`,
      args: [worldId],
    });
  }

  for (const pin of pins) {
    await db.execute({
      sql: `
        INSERT INTO pins (
          id, world_id, title, subtitle, category, realm,
          icon_name, avatar_id, x, y, content_json
        ) VALUES (?, ?, ?, ?, ?, 'company', ?, ?, ?, ?, ?)
        ON CONFLICT(world_id, id) DO UPDATE SET
          title = excluded.title,
          subtitle = excluded.subtitle,
          category = excluded.category,
          icon_name = excluded.icon_name,
          avatar_id = excluded.avatar_id,
          x = excluded.x,
          y = excluded.y,
          content_json = excluded.content_json,
          updated_at = datetime('now')
      `,
      args: [
        pin.id,
        worldId,
        pin.title,
        pin.subtitle,
        pin.category,
        pin.iconName,
        pin.avatarId ?? null,
        pin.coordinates.x,
        pin.coordinates.y,
        JSON.stringify(pin.content),
      ],
    });
  }

  await db.execute({
    sql: `UPDATE worlds SET updated_at = datetime('now') WHERE id = ?`,
    args: [worldId],
  });

  return { ok: true, worldId, pinCount: pins.length };
}
