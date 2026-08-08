import { NextRequest, NextResponse } from 'next/server';
import { authorizeGuildEdit, isGuildEditConfigured } from '@/lib/auth/guildEdit';
import { createGuildPin, type CreateGuildPinInput } from '@/lib/world/guildPins';
import type { PinType } from '@/types/world';

export const dynamic = 'force-dynamic';

/** Chart a new east-isle (guild) pin. Requires passphrase session or header. */
export async function POST(req: NextRequest) {
  if (!isGuildEditConfigured()) {
    return NextResponse.json(
      { error: 'Guild editing is not configured on this deployment.' },
      { status: 503 },
    );
  }

  let body: CreateGuildPinInput & { passphrase?: string };
  try {
    body = (await req.json()) as CreateGuildPinInput & { passphrase?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const passphrase =
    body.passphrase ??
    req.headers.get('x-guild-edit-key');

  if (
    !authorizeGuildEdit({
      cookieHeader: req.headers.get('cookie'),
      passphrase,
    })
  ) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

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
