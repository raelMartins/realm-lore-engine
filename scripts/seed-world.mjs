#!/usr/bin/env node
/**
 * Dev helper: POST a world seed JSON to /api/dev/seed
 *
 * Usage:
 *   npm run seed:world -- seeds/example-guild-world.json
 *   npm run seed:world -- seeds/private/my-world.json
 *
 * Requires: npm run dev, DEV_SEED_SECRET in .env.local
 */

import fs from 'fs';
import path from 'path';
import process from 'process';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();

  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: npm run seed:world -- <path-to-seed.json>');
    process.exit(1);
  }

  const secret = process.env.DEV_SEED_SECRET?.trim();
  if (!secret) {
    console.error('Set DEV_SEED_SECRET in .env.local before seeding.');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const base = process.env.SEED_API_BASE?.trim() || 'http://localhost:3000';

  const res = await fetch(`${base}/api/dev/seed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-dev-seed-secret': secret,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    console.error('Seed failed:', res.status, json);
    process.exit(1);
  }

  console.log('Seeded OK:', json);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
