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
  `
  CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY,
    world_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    ip TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    user_agent TEXT,
    is_self INTEGER NOT NULL DEFAULT 0
  )
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_visits_world_started
    ON visits(world_id, started_at DESC)
  `,
  `
  CREATE TABLE IF NOT EXISTS visit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id TEXT NOT NULL,
    world_id TEXT NOT NULL,
    name TEXT NOT NULL,
    payload_json TEXT,
    client_ts TEXT,
    received_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
  )
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_visit_events_visit
    ON visit_events(visit_id, received_at)
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_visit_events_world
    ON visit_events(world_id, received_at DESC)
  `,
];

/** Bump when adding migrations so hot servers re-apply CREATE IF NOT EXISTS. */
const SCHEMA_VERSION = 2;
let appliedVersion = 0;

/** Idempotent schema ensure — safe to call on every request. */
export async function ensureSchema(db: Client): Promise<void> {
  if (appliedVersion >= SCHEMA_VERSION) return;

  for (const sql of MIGRATIONS) {
    await db.execute(sql);
  }

  appliedVersion = SCHEMA_VERSION;
}
