"use client";

import {
  TRACK_EVENTS,
  type QueuedTrackEvent,
  type TrackEventName,
  type TrackEventPayload,
} from "@/lib/tracking";

const FLUSH_MS = 90_000;

function newVisitId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

type TrackState = {
  visitId: string;
  queue: QueuedTrackEvent[];
  flushTimer: ReturnType<typeof setInterval> | null;
  started: boolean;
};

let state: TrackState | null = null;

function getState(): TrackState {
  if (!state) {
    // New page load / refresh = new visit (not persisted).
    state = {
      visitId: newVisitId(),
      queue: [],
      flushTimer: null,
      started: false,
    };
  }
  return state;
}

async function send(events: QueuedTrackEvent[], visitId: string): Promise<void> {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ visitId, events });

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/track", blob);
      if (ok) return;
    }
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    /* best-effort */
  }
}

function flush(): void {
  const s = getState();
  const batch = s.queue.splice(0, s.queue.length);
  void send(batch, s.visitId);
}

function ensureLifecycle(): void {
  const s = getState();
  if (s.started || typeof window === "undefined") return;
  s.started = true;

  s.flushTimer = setInterval(() => flush(), FLUSH_MS);

  // Tab switch / minimize: flush queue + bump last_seen (heartbeat).
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  // Close / navigate away: record leave, then flush via beacon.
  window.addEventListener("pagehide", () => {
    const st = getState();
    st.queue.push({
      name: TRACK_EVENTS.visitLeave,
      ts: new Date().toISOString(),
    });
    flush();
  });

  track(TRACK_EVENTS.visitStart);
  flush();
}

/** Queue a named event; flushed every 90s and on page hide. */
export function track(
  name: TrackEventName | string,
  payload?: TrackEventPayload,
): void {
  if (typeof window === "undefined") return;
  ensureLifecycle();
  const s = getState();
  s.queue.push({
    name,
    payload,
    ts: new Date().toISOString(),
  });
}

/** Start visit tracking (idempotent). Call once from the main realm page. */
export function startTracking(): void {
  if (typeof window === "undefined") return;
  ensureLifecycle();
}

export { TRACK_EVENTS };
