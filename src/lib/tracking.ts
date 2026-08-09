/** Named exploration / interaction events for realm visit tracking. */
export const TRACK_EVENTS = {
  visitStart: 'visit_start',
  visitLeave: 'visit_leave',
  pinOpen: 'pin_open',
  realmOpen: 'realm_open',
  searchOpen: 'search_open',
  allianceForge: 'alliance_forge',
  allianceUnforge: 'alliance_unforge',
  calendarOpen: 'calendar_open',
  easterEggReveal: 'easter_egg_reveal',
} as const;

export type TrackEventName =
  (typeof TRACK_EVENTS)[keyof typeof TRACK_EVENTS];

export interface TrackEventPayload {
  pinId?: string;
  pinTitle?: string;
  realm?: string;
  source?: string;
  [key: string]: unknown;
}

export interface QueuedTrackEvent {
  name: TrackEventName | string;
  payload?: TrackEventPayload;
  /** ISO client timestamp */
  ts: string;
}

export function isTrackingSecretConfigured(): boolean {
  return Boolean(process.env.TRACKING_SECRET?.trim());
}

export function verifyTrackingSecret(secret: string | null | undefined): boolean {
  const expected = process.env.TRACKING_SECRET?.trim();
  if (!expected || !secret) return false;
  return secret === expected;
}

/** Localhost / loopback — always treated as your own visits. */
const LOOPBACK_IPS = new Set([
  '::1',
  '127.0.0.1',
  'localhost',
  '0:0:0:0:0:0:0:1',
  '::ffff:127.0.0.1',
]);

/** Comma-separated IPs / CIDR-less exact matches from TRACKING_SELF_IPS. */
export function getSelfIps(): Set<string> {
  const raw = process.env.TRACKING_SELF_IPS?.trim() ?? '';
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function isSelfIp(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const normalized = ip.trim().toLowerCase();
  if (LOOPBACK_IPS.has(normalized)) return true;
  return getSelfIps().has(ip) || getSelfIps().has(normalized);
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = headers.get('x-real-ip')?.trim();
  if (real) return real;
  const cf = headers.get('cf-connecting-ip')?.trim();
  if (cf) return cf;
  return null;
}

/** Best-effort geo from edge / CDN headers (no external lookup). */
export function geoFromHeaders(headers: Headers): {
  country: string | null;
  region: string | null;
  city: string | null;
} {
  return {
    country:
      headers.get('x-vercel-ip-country')?.trim() ||
      headers.get('cf-ipcountry')?.trim() ||
      null,
    region:
      headers.get('x-vercel-ip-country-region')?.trim() ||
      headers.get('x-vercel-ip-region')?.trim() ||
      null,
    city: headers.get('x-vercel-ip-city')?.trim() || null,
  };
}
