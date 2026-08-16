import { NextRequest, NextResponse } from 'next/server';
import { authorizeGuildEdit, isGuildEditConfigured } from '@/lib/auth/guildEdit';
import {
  createGuildPin,
  moveGuildPin,
  type CreateGuildPinInput,
} from '@/lib/world/guildPins';
import type { PinType } from '@/types/world';

export const dynamic = 'force-dynamic';

function guildEditUnauthorized(
  req: NextRequest,
  bodyPassphrase?: string | null,
): NextResponse | null {
  if (!isGuildEditConfigured()) {
    return NextResponse.json(
      { error: 'Guild editing is not configured on this deployment.' },
      { status: 503 },
    );
  }

  const passphrase =
    bodyPassphrase ?? req.headers.get('x-guild-edit-key');

  if (
    !authorizeGuildEdit({
      cookieHeader: req.headers.get('cookie'),
      passphrase,
    })
  ) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  return null;
}

/** Chart a new east-isle (guild) pin. Requires passphrase session or header. */
export async function POST(req: NextRequest) {
  let body: CreateGuildPinInput & { passphrase?: string };
  try {
    body = (await req.json()) as CreateGuildPinInput & { passphrase?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const denied = guildEditUnauthorized(req, body.passphrase);
  if (denied) return denied;

  const result = await createGuildPin({
    title: body.title,
    subtitle: body.subtitle,
    category: body.category as PinType,
    avatarId: body.avatarId,
    iconName: body.iconName,
    coordinates: body.coordinates,
    content: body.content,
  });

  if (!result.ok) {
    const status =
      result.code === 'no_db'
        ? 503
        : result.code === 'validation' ||
            result.code === 'off_land' ||
            result.code === 'too_close' ||
            result.code === 'cap_reached' ||
            result.code === 'invalid_coords'
          ? 400
          : 400;
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status },
    );
  }

  return NextResponse.json({ pin: result.pin }, { status: 201 });
}

/** Move an existing east-isle pin. Requires passphrase session or header. */
export async function PATCH(req: NextRequest) {
  let body: {
    id?: string;
    coordinates?: { x: number; y: number };
    passphrase?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const denied = guildEditUnauthorized(req, body.passphrase);
  if (denied) return denied;

  if (!body.id?.trim() || !body.coordinates) {
    return NextResponse.json(
      { error: 'Pin id and coordinates are required.' },
      { status: 400 },
    );
  }

  const result = await moveGuildPin(body.id, body.coordinates);

  if (!result.ok) {
    const status =
      result.code === 'no_db'
        ? 503
        : result.code === 'not_found'
          ? 404
          : result.code === 'off_land' ||
              result.code === 'too_close' ||
              result.code === 'cap_reached' ||
              result.code === 'invalid_coords'
            ? 400
            : 400;
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status },
    );
  }

  return NextResponse.json({ pin: result.pin });
}
