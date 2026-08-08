import { createHmac, timingSafeEqual } from 'crypto';
import { getWorldId } from '@/lib/db/turso';

const COOKIE_NAME = 'guild_edit_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours

function getEditKey(): string | null {
  const key = process.env.GUILD_EDIT_KEY?.trim();
  return key || null;
}

/** True when a real edit passphrase is configured (not the placeholder). */
export function isGuildEditConfigured(): boolean {
  return Boolean(getEditKey());
}

export function verifyGuildPassphrase(passphrase: string | null | undefined): boolean {
  const key = getEditKey();
  if (!key || !passphrase) return false;

  const a = Buffer.from(passphrase);
  const b = Buffer.from(key);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function signSession(worldId: string, exp: number, secret: string): string {
  return createHmac('sha256', secret)
    .update(`${worldId}:${exp}`)
    .digest('base64url');
}

/** Signed httpOnly session after a successful unlock. */
export function createGuildEditCookie(): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
    path: string;
    maxAge: number;
  };
} | null {
  const key = getEditKey();
  if (!key) return null;

  const worldId = getWorldId();
  const exp = Date.now() + SESSION_TTL_MS;
  const sig = signSession(worldId, exp, key);
  const value = `${exp}.${sig}`;

  return {
    name: COOKIE_NAME,
    value,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    },
  };
}

export function verifyGuildEditCookie(
  cookieHeader: string | null,
): boolean {
  const key = getEditKey();
  if (!key || !cookieHeader) return false;

  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return false;

  const value = match.slice(COOKIE_NAME.length + 1);
  const [expStr, sig] = value.split('.');
  const exp = Number(expStr);
  if (!expStr || !sig || !Number.isFinite(exp) || Date.now() > exp) {
    return false;
  }

  const expected = signSession(getWorldId(), exp, key);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Authorize a guild write: valid session cookie OR passphrase header/body.
 * Never reveals which failed.
 */
export function authorizeGuildEdit(opts: {
  cookieHeader: string | null;
  passphrase?: string | null;
}): boolean {
  if (verifyGuildEditCookie(opts.cookieHeader)) return true;
  return verifyGuildPassphrase(opts.passphrase);
}

export { COOKIE_NAME as GUILD_EDIT_COOKIE };
