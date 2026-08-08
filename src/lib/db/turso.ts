import { createClient, type Client } from '@libsql/client';

let client: Client | null = null;

export function isTursoConfigured(): boolean {
  return Boolean(
    process.env.TURSO_DATABASE_URL?.trim() &&
      process.env.TURSO_AUTH_TOKEN?.trim(),
  );
}

export function getWorldId(): string {
  return process.env.WORLD_ID?.trim() || 'default';
}

/** Shared Turso / libSQL client. Returns null when env is missing. */
export function getTursoClient(): Client | null {
  if (!isTursoConfigured()) return null;

  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  }

  return client;
}
