import type { Client } from '@libsql/client';
import type { LorePin, PinType } from '@/types/world';
import { normalizePin } from '@/lib/getCompanyData';
import { ensureSchema } from '@/lib/db/schema';
import { getTursoClient, getWorldId, isTursoConfigured } from '@/lib/db/turso';
import { isAvatarAllowedForRealm } from '@/config/avatars';
import {
  GUILD_PIN_CAP,
  PLACEMENT_ERROR_MESSAGE,
  validateGuildPlacement,
  type PlacementError,
} from '@/lib/world/placement';
import { loadWorld } from '@/lib/world/loadWorld';

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

export interface CreateGuildPinInput {
  title: string;
  subtitle?: string;
  category: PinType;
  avatarId?: string;
  iconName?: string;
  coordinates: { x: number; y: number };
  content: {
    badge?: string;
    description: string;
    tags?: string[];
  };
}

export type CreateGuildPinResult =
  | { ok: true; pin: LorePin }
  | { ok: false; error: string; code?: PlacementError | 'unauthorized' | 'no_db' | 'validation' };

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

async function listGuildPins(db: Client, worldId: string): Promise<LorePin[]> {
  const result = await db.execute({
    sql: `
      SELECT id, title, subtitle, category, realm, icon_name, avatar_id, x, y, content_json
      FROM pins WHERE world_id = ? AND realm = 'company'
    `,
    args: [worldId],
  });

  return result.rows.map((row) => {
    const r = row as Record<string, unknown>;
    let content: LorePin['content'];
    try {
      content = JSON.parse(String(r.content_json)) as LorePin['content'];
    } catch {
      content = { description: '' };
    }
    return normalizePin({
      id: String(r.id),
      title: String(r.title),
      subtitle: String(r.subtitle ?? ''),
      category: r.category as PinType,
      realm: 'company',
      iconName: String(r.icon_name ?? 'MapPin'),
      avatarId: r.avatar_id ? String(r.avatar_id) : undefined,
      coordinates: { x: Number(r.x), y: Number(r.y) },
      content,
    });
  });
}

function validateInput(input: CreateGuildPinInput): string | null {
  if (!input.title?.trim()) return 'Title is required.';
  if (!input.content?.description?.trim()) return 'Description is required.';
  if (!PIN_TYPES.includes(input.category)) return 'Invalid pin type.';
  if (input.category === 'character') {
    if (!input.avatarId) return 'Character pins need an avatar.';
    if (!isAvatarAllowedForRealm(input.avatarId, 'company')) {
      return 'That avatar is reserved for the adventurer realm.';
    }
  }
  return null;
}

export async function createGuildPin(
  input: CreateGuildPinInput,
): Promise<CreateGuildPinResult> {
  if (!isTursoConfigured()) {
    return {
      ok: false,
      error: 'World storage is unavailable.',
      code: 'no_db',
    };
  }

  const validationError = validateInput(input);
  if (validationError) {
    return { ok: false, error: validationError, code: 'validation' };
  }

  const db = getTursoClient()!;
  const worldId = getWorldId();
  await ensureSchema(db);

  // Ensure world row exists (seeds defaults if first write)
  await loadWorld();

  const existing = await listGuildPins(db, worldId);
  if (existing.length >= GUILD_PIN_CAP) {
    return {
      ok: false,
      error: PLACEMENT_ERROR_MESSAGE.cap_reached,
      code: 'cap_reached',
    };
  }

  const placementError = validateGuildPlacement(input.coordinates, existing);
  if (placementError) {
    return {
      ok: false,
      error: PLACEMENT_ERROR_MESSAGE[placementError],
      code: placementError,
    };
  }

  const category = input.category;
  const avatarId =
    category === 'character' ? input.avatarId : undefined;
  const idBase = slugify(input.title) || 'guild-pin';
  const id = `guild-${idBase}-${Date.now().toString(36)}`;

  const pin = normalizePin({
    id,
    title: input.title.trim(),
    subtitle: (input.subtitle ?? '').trim(),
    category,
    realm: 'company',
    iconName: input.iconName?.trim() || DEFAULT_ICONS[category],
    avatarId,
    coordinates: {
      x: Math.round(input.coordinates.x * 10) / 10,
      y: Math.round(input.coordinates.y * 10) / 10,
    },
    content: {
      badge:
        input.content.badge?.trim() ||
        category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
      description: input.content.description.trim(),
      tags: input.content.tags?.filter(Boolean),
    },
  });

  await db.execute({
    sql: `
      INSERT INTO pins (
        id, world_id, title, subtitle, category, realm,
        icon_name, avatar_id, x, y, content_json
      ) VALUES (?, ?, ?, ?, ?, 'company', ?, ?, ?, ?, ?)
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

  await db.execute({
    sql: `UPDATE worlds SET updated_at = datetime('now') WHERE id = ?`,
    args: [worldId],
  });

  return { ok: true, pin };
}
