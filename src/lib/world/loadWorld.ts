import type { Client } from '@libsql/client';
import type {
  CompanyLoreConfig,
  LorePin,
  RealmSide,
} from '@/types/world';
import { normalizeConfig, normalizePin } from '@/lib/getCompanyData';
import { ensureSchema } from '@/lib/db/schema';
import { getTursoClient, getWorldId } from '@/lib/db/turso';
import { withQuestCalendarCta } from '@/lib/scheduling';
import {
  getDefaultEastPins,
  getDefaultWorldMeta,
  getStaticWestPins,
} from '@/lib/world/staticWest';

type TeamMember = NonNullable<CompanyLoreConfig['targetTeamMembers']>[number];

interface WorldRow {
  id: string;
  company_name: string;
  tagline: string;
  custom_pitch_message: string;
  realm_label_company: string | null;
  primary_color_hex: string | null;
  united: number;
  team_members_json: string;
}

interface PinRow {
  id: string;
  world_id: string;
  title: string;
  subtitle: string;
  category: string;
  realm: string;
  icon_name: string;
  avatar_id: string | null;
  x: number;
  y: number;
  content_json: string;
}

function pinToRow(worldId: string, pin: LorePin) {
  return {
    sql: `
      INSERT INTO pins (
        id, world_id, title, subtitle, category, realm,
        icon_name, avatar_id, x, y, content_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      pin.id,
      worldId,
      pin.title,
      pin.subtitle,
      pin.category,
      'company',
      pin.iconName,
      pin.avatarId ?? null,
      pin.coordinates.x,
      pin.coordinates.y,
      JSON.stringify(pin.content),
    ],
  };
}

function rowToPin(row: PinRow): LorePin {
  let content: LorePin['content'];
  try {
    content = JSON.parse(row.content_json) as LorePin['content'];
  } catch {
    content = { description: '' };
  }

  return normalizePin({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category as LorePin['category'],
    realm: (row.realm === 'adventurer' ? 'adventurer' : 'company') as RealmSide,
    iconName: row.icon_name,
    avatarId: row.avatar_id ?? undefined,
    coordinates: { x: row.x, y: row.y },
    content,
  });
}

async function seedWorldIfMissing(db: Client, worldId: string): Promise<void> {
  const existing = await db.execute({
    sql: 'SELECT id FROM worlds WHERE id = ? LIMIT 1',
    args: [worldId],
  });

  if (existing.rows.length > 0) return;

  const meta = getDefaultWorldMeta();
  const eastPins = getDefaultEastPins();

  await db.execute({
    sql: `
      INSERT INTO worlds (
        id, company_name, tagline, custom_pitch_message,
        realm_label_company, primary_color_hex, united, team_members_json
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `,
    args: [
      worldId,
      meta.companyName,
      meta.tagline,
      meta.customPitchMessage,
      meta.realmLabels?.company ?? null,
      meta.primaryColorHex ?? null,
      JSON.stringify(meta.targetTeamMembers ?? []),
    ],
  });

  for (const pin of eastPins) {
    await db.execute(pinToRow(worldId, pin));
  }
}

async function loadWorldFromTurso(
  db: Client,
  worldId: string,
): Promise<CompanyLoreConfig> {
  await ensureSchema(db);
  await seedWorldIfMissing(db, worldId);

  const worldResult = await db.execute({
    sql: `
      SELECT id, company_name, tagline, custom_pitch_message,
             realm_label_company, primary_color_hex, united, team_members_json
      FROM worlds WHERE id = ? LIMIT 1
    `,
    args: [worldId],
  });

  const world = worldResult.rows[0] as unknown as WorldRow | undefined;
  if (!world) {
    throw new Error(`World "${worldId}" not found after seed`);
  }

  const pinResult = await db.execute({
    sql: `
      SELECT id, world_id, title, subtitle, category, realm,
             icon_name, avatar_id, x, y, content_json
      FROM pins WHERE world_id = ? AND realm = 'company'
    `,
    args: [worldId],
  });

  let teamMembers: TeamMember[] = [];
  try {
    teamMembers = JSON.parse(world.team_members_json) as TeamMember[];
  } catch {
    teamMembers = getDefaultWorldMeta().targetTeamMembers ?? [];
  }

  const eastPins = (pinResult.rows as unknown as PinRow[]).map(rowToPin);
  const westPins = getStaticWestPins().map(normalizePin);
  const defaults = getDefaultWorldMeta();

  return normalizeConfig({
    companyName: world.company_name,
    tagline: world.tagline,
    customPitchMessage: world.custom_pitch_message,
    primaryColorHex: world.primary_color_hex ?? undefined,
    realmLabels: {
      adventurer: defaults.realmLabels?.adventurer,
      company: world.realm_label_company ?? defaults.realmLabels?.company,
    },
    targetTeamMembers: teamMembers,
    pins: withQuestCalendarCta([...westPins, ...eastPins]),
  });
}

/**
 * Resolve the active deployment world:
 * Turso east-isle content + static west pins, keyed by WORLD_ID.
 * Falls back to in-repo defaults when Turso is unavailable.
 */
export async function loadWorld(): Promise<{
  data: CompanyLoreConfig;
  source: 'turso' | 'fallback';
  worldId: string;
}> {
  const worldId = getWorldId();
  const db = getTursoClient();

  if (!db) {
    return {
      data: normalizeConfig({
        ...getDefaultWorldMeta(),
        pins: withQuestCalendarCta([
          ...getStaticWestPins(),
          ...getDefaultEastPins(),
        ]),
      }),
      source: 'fallback',
      worldId,
    };
  }

  try {
    const data = await loadWorldFromTurso(db, worldId);
    return { data, source: 'turso', worldId };
  } catch (error) {
    console.error('Failed to load world from Turso, using fallback:', error);
    return {
      data: normalizeConfig({
        ...getDefaultWorldMeta(),
        pins: withQuestCalendarCta([
          ...getStaticWestPins(),
          ...getDefaultEastPins(),
        ]),
      }),
      source: 'fallback',
      worldId,
    };
  }
}
