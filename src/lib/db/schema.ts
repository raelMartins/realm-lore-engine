import type { Client } from '@libsql/client';

const MIGRATIONS = [
  `
  CREATE TABLE IF NOT EXISTS worlds (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    custom_pitch_message TEXT NOT NULL,
    realm_label_company TEXT,
    primary_color_hex TEXT,
    united INTEGER NOT NULL DEFAULT 0,
    team_members_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS pins (
    id TEXT NOT NULL,
    world_id TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    realm TEXT NOT NULL DEFAULT 'company',
    icon_name TEXT NOT NULL DEFAULT 'MapPin',
    avatar_id TEXT,
    x REAL NOT NULL,
    y REAL NOT NULL,
    content_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (world_id, id),
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
  )
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_pins_world_id ON pins(world_id)
  `,
];

let schemaReady = false;

/** Idempotent schema ensure — safe to call on every request. */
export async function ensureSchema(db: Client): Promise<void> {
  if (schemaReady) return;

  for (const sql of MIGRATIONS) {
    await db.execute(sql);
  }

  schemaReady = true;
}
