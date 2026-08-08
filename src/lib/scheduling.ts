/**
 * Scheduling / calendar booking for the realm (Cal.com or Calendly).
 * Set NEXT_PUBLIC_SCHEDULING_URL to a full booking link.
 */

import type { LorePin } from '@/types/world';

export type SchedulingProvider = 'calcom' | 'calendly' | 'unknown';

export function getSchedulingUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SCHEDULING_URL?.trim();
  return raw || null;
}

export function detectSchedulingProvider(url: string): SchedulingProvider {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('calendly.com')) return 'calendly';
    if (host.includes('cal.com')) return 'calcom';
  } catch {
    /* fall through */
  }
  return 'unknown';
}

/**
 * Normalize a public booking URL into an embeddable iframe src.
 * Cal.com: prefer official embed.js (see CalendarModal) — this helper is for Calendly / fallbacks.
 */
export function toEmbedUrl(url: string): string {
  const provider = detectSchedulingProvider(url);
  try {
    const parsed = new URL(url);

    if (provider === 'calcom') {
      if (parsed.hostname === 'cal.com') {
        parsed.hostname = 'app.cal.com';
      }
      const parts = parsed.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
      if (parts[parts.length - 1] !== 'embed') {
        parsed.pathname = `${parsed.pathname.replace(/\/+$/, '')}/embed`;
      }
      return parsed.toString();
    }

    if (provider === 'calendly') {
      parsed.searchParams.set('embed_type', 'Inline');
      parsed.searchParams.set('hide_gdpr_banner', '1');
      return parsed.toString();
    }

    return url;
  } catch {
    return url;
  }
}

/** Extract `user/event` path for Cal.com's embed API (no host, no /embed). */
export function toCalLink(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname
      .replace(/\/+$/, '')
      .split('/')
      .filter(Boolean)
      .filter((p) => p !== 'embed');
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts[1]}`;
  } catch {
    return null;
  }
}

export function schedulingProviderLabel(provider: SchedulingProvider): string {
  if (provider === 'calendly') return 'Calendly';
  if (provider === 'calcom') return 'Cal.com';
  return 'Calendar';
}

/** Ensure the main quest pin opens the in-realm calendar modal. */
export function withQuestCalendarCta(pins: LorePin[]): LorePin[] {
  return pins.map((pin) => {
    if (pin.id !== 'quest-main') return pin;
    return {
      ...pin,
      content: {
        ...pin.content,
        callToAction: {
          label: 'Schedule a Quest Call',
          actionType: 'calendar',
          target: '#schedule',
        },
      },
    };
  });
}
