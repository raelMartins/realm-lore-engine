import type { Client } from '@libsql/client';
import type { AttributeStat, LorePin, PinType } from '@/types/world';
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
  content: LorePin['content'];
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

function cleanStats(stats?: AttributeStat[]): AttributeStat[] | undefined {
  if (!stats?.length) return undefined;
  const cleaned = stats
    .map((s) => ({
      label: String(s.label ?? '').trim(),
      value: Math.max(0, Math.min(100, Number(s.value) || 0)),
    }))
    .filter((s) => s.label);
  return cleaned.length ? cleaned : undefined;
}

function cleanTags(tags?: string[]): string[] | undefined {
  if (!tags?.length) return undefined;
  const cleaned = tags.map((t) => String(t).trim()).filter(Boolean);
  return cleaned.length ? cleaned : undefined;
}

function cleanDate(value?: string): string | undefined {
  const v = value?.trim();
  if (!v) return undefined;
  // Accept YYYY-MM-DD from date inputs
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  return v;
}

function cleanUrl(url?: string): string | undefined {
  const v = url?.trim();
  if (!v) return undefined;
  try {
    const parsed = new URL(v);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function normalizeContent(
  category: PinType,
  raw: LorePin['content'],
): LorePin['content'] {
  const description = (raw.description ?? '').trim();
  const content: LorePin['content'] = {
    badge:
      raw.badge?.trim() ||
      category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
    description,
  };

  const stats = cleanStats(raw.stats);
  const tags = cleanTags(raw.tags);
  if (stats) content.stats = stats;
  if (tags) content.tags = tags;

  if (category === 'character') {
    const joinedAt = cleanDate(raw.joinedAt);
    if (joinedAt) content.joinedAt = joinedAt;
    const url = cleanUrl(raw.externalLink?.url);
    if (url) {
      content.externalLink = {
        label: raw.externalLink?.label?.trim() || 'View portfolio',
        url,
      };
    }
  }

  if (category === 'project') {
    const startDate = cleanDate(raw.startDate);
    const endDate = cleanDate(raw.endDate);
    if (startDate) content.startDate = startDate;
    if (endDate) content.endDate = endDate;
    const url = cleanUrl(raw.externalLink?.url);
    if (url) {
      content.externalLink = {
        label: raw.externalLink?.label?.trim() || 'View project',
        url,
      };
    }
  }

  if (category === 'achievement') {
    const achievedAt = cleanDate(raw.achievedAt);
    if (achievedAt) content.achievedAt = achievedAt;
    const ids = raw.contributorIds
      ?.map((id) => String(id).trim())
      .filter(Boolean);
    if (ids?.length) content.contributorIds = [...new Set(ids)];
  }

  if (category === 'quest') {
    if (raw.callToAction?.actionType === 'calendar') {
      content.callToAction = {
        label: raw.callToAction.label?.trim() || 'Chart a meeting',
        actionType: 'calendar',
        target: raw.callToAction.target?.trim() || '#calendar',
      };
    } else {
      const url = cleanUrl(raw.externalLink?.url);
      if (url) {
        content.externalLink = {
          label: raw.externalLink?.label?.trim() || 'Open link',
          url,
        };
      }
    }
  }

  return content;
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
  if (!input.content?.description?.trim()) return 'Lore is required.';
  if (!PIN_TYPES.includes(input.category)) return 'Invalid pin type.';
  if (input.category === 'character') {
    if (!input.avatarId) return 'Character pins need an avatar.';
    if (!isAvatarAllowedForRealm(input.avatarId, 'company')) {
      return 'That avatar is reserved for the adventurer realm.';
    }
  }
  if (
    (input.category === 'character' || input.category === 'project') &&
    input.content.externalLink?.url?.trim()
  ) {
    if (!cleanUrl(input.content.externalLink.url)) {
      return 'External link must be a valid http(s) URL.';
    }
  }
  if (
    input.category === 'quest' &&
    input.content.externalLink?.url?.trim() &&
    input.content.callToAction?.actionType !== 'calendar'
  ) {
    if (!cleanUrl(input.content.externalLink.url)) {
      return 'External link must be a valid http(s) URL.';
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

  const placementError = validateGuildPlacement(input.coordinates, existing, {
    checkSpacing: false,
  });
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
    content: normalizeContent(category, input.content),
  });

  // Drop contributor ids that are not guild characters
  if (pin.content.contributorIds?.length) {
    const guildChars = new Set(
      existing
        .filter((p) => p.category === 'character')
        .map((p) => p.id),
    );
    pin.content.contributorIds = pin.content.contributorIds.filter((cid) =>
      guildChars.has(cid),
    );
    if (!pin.content.contributorIds.length) {
      delete pin.content.contributorIds;
    }
  }

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
