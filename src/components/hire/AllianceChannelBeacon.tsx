"use client";

import React from "react";
import { KeepScale } from "react-zoom-pan-pinch";
import { CalendarDays, Sparkles, X } from "lucide-react";

interface AllianceChannelBeaconProps {
  forged: boolean;
  busy?: boolean;
  schedulingUrl?: string | null;
  onForge: () => void;
  onUnforge: () => void;
  onOpenCalendar: () => void;
}

/**
 * Map-anchored CTA in the channel between isles.
 * KeepScale holds readable size while the map zooms.
 */
export function AllianceChannelBeacon({
  forged,
  busy = false,
  schedulingUrl = null,
  onForge,
  onUnforge,
  onOpenCalendar,
}: AllianceChannelBeaconProps) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[48%] z-[6] -translate-x-1/2 -translate-y-1/2"
      data-alliance-beacon
    >
      <KeepScale className="pointer-events-auto">
        <div className="flex items-center gap-1.5">
          {!forged ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onForge();
              }}
              disabled={busy}
              title="Forge alliance across the channel"
              className="group glass-panel-strong flex items-center gap-2 rounded-full border border-amber-200/25 bg-[color-mix(in_srgb,#0b1620_72%,transparent)] px-4 py-2.5 text-xs font-semibold tracking-wide text-realm-silver shadow-[0_0_28px_rgba(251,191,36,0.12)] transition hover:border-amber-200/45 hover:shadow-[0_0_36px_rgba(251,191,36,0.2)] disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 text-amber-200/90 transition group-hover:text-amber-100" />
              <span>{busy ? "Crossing…" : "Forge Alliance"}</span>
            </button>
          ) : (
            <>
              {schedulingUrl ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCalendar();
                  }}
                  disabled={busy}
                  title="Chart a meeting"
                  className="glass-panel-strong flex items-center gap-2 rounded-full border border-teal-300/30 bg-[color-mix(in_srgb,#0b1620_72%,transparent)] px-4 py-2.5 text-xs font-semibold tracking-wide text-realm-silver transition hover:border-teal-300/50 disabled:opacity-50"
                >
                  <CalendarDays className="h-4 w-4 text-amber-200/90" />
                  <span>Chart a meeting</span>
                </button>
              ) : (
                <div className="glass-panel-strong flex items-center gap-2 rounded-full border border-teal-300/25 px-4 py-2.5 text-xs font-semibold tracking-wide text-realm-mist">
                  <Sparkles className="h-4 w-4 text-teal-300" />
                  <span>Alliance Forged</span>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnforge();
                }}
                disabled={busy}
                title="Unforge alliance"
                aria-label="Unforge alliance"
                className="glass-panel flex h-10 w-10 items-center justify-center rounded-full text-realm-mist transition hover:text-realm-silver disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </KeepScale>
    </div>
  );
}
