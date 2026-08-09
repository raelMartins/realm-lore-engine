"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type VisitEvent = {
  id: number;
  name: string;
  payload: Record<string, unknown> | null;
  clientTs: string | null;
  receivedAt: string;
};

type Visit = {
  id: string;
  startedAt: string;
  lastSeenAt: string;
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  userAgent: string | null;
  isSelf: boolean;
  events: VisitEvent[];
};

type TrackResponse = {
  configured: boolean;
  worldId: string;
  hideSelf: boolean;
  visits: Visit[];
  error?: string;
};

const SECRET_KEY = "realm-lore:tracking-secret";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/** Approx dwell from earliest visit/event time to latest. */
function visitDurationLabel(visit: Visit): string | null {
  const times: number[] = [];
  for (const iso of [visit.startedAt, visit.lastSeenAt]) {
    const t = Date.parse(iso);
    if (!Number.isNaN(t)) times.push(t);
  }
  for (const ev of visit.events) {
    const t = Date.parse(ev.clientTs || ev.receivedAt);
    if (!Number.isNaN(t)) times.push(t);
  }
  if (times.length < 2) return null;
  const ms = Math.max(...times) - Math.min(...times);
  if (ms < 0) return null;
  if (ms < 5_000) return "< 5s";
  const totalSec = Math.round(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hours > 0) return `~${hours}h ${mins}m`;
  if (mins > 0) return secs >= 15 ? `~${mins}m ${secs}s` : `~${mins}m`;
  return `~${secs}s`;
}

function placeLabel(v: Visit): string {
  const parts = [v.city, v.region, v.country].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return v.ip ? `IP ${v.ip}` : "Unknown place";
}

function eventLabel(name: string): string {
  return name.replace(/_/g, " ");
}

export default function TrackingPage() {
  const [secret, setSecret] = useState("");
  const [authedSecret, setAuthedSecret] = useState<string | null>(null);
  const [hideSelf, setHideSelf] = useState(true);
  const [data, setData] = useState<TrackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SECRET_KEY);
      if (saved) {
        setAuthedSecret(saved);
        setSecret(saved);
      }
    } catch {
      /* private mode */
    }
  }, []);

  const load = useCallback(async (key: string, hide: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/track?hideSelf=${hide ? "1" : "0"}&limit=100`,
        { headers: { "x-tracking-secret": key } },
      );
      const json = (await res.json()) as TrackResponse & { error?: string };
      if (!res.ok) {
        setAuthedSecret(null);
        setData(null);
        setError(json.error || "Could not load tracking data.");
        try {
          sessionStorage.removeItem(SECRET_KEY);
        } catch {
          /* */
        }
        return;
      }
      setData(json);
      setAuthedSecret(key);
      setSelected((prev) => {
        const next = new Set<string>();
        for (const id of prev) {
          if (json.visits.some((v) => v.id === id)) next.add(id);
        }
        return next;
      });
      try {
        sessionStorage.setItem(SECRET_KEY, key);
      } catch {
        /* */
      }
    } catch {
      setError("Network error loading tracking.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authedSecret) void load(authedSecret, hideSelf);
  }, [authedSecret, hideSelf, load]);

  const onUnlock = (e: FormEvent) => {
    e.preventDefault();
    const key = secret.trim();
    if (!key) return;
    void load(key, hideSelf);
  };

  const visits = data?.visits ?? [];

  const totals = useMemo(() => {
    const events = visits.reduce((n, v) => n + v.events.length, 0);
    return { visits: visits.length, events };
  }, [visits]);

  const allVisibleSelected =
    visits.length > 0 && visits.every((v) => selected.has(v.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelected((prev) => {
      if (visits.length === 0) return prev;
      if (visits.every((v) => prev.has(v.id))) {
        const next = new Set(prev);
        for (const v of visits) next.delete(v.id);
        return next;
      }
      const next = new Set(prev);
      for (const v of visits) next.add(v.id);
      return next;
    });
  };

  const deleteVisits = async (body: { ids?: string[]; all?: boolean }) => {
    if (!authedSecret || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/track", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-tracking-secret": authedSecret,
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { error?: string; deleted?: number };
      if (!res.ok) {
        setError(json.error || "Could not delete visits.");
        return;
      }
      setSelected(new Set());
      setExpanded(null);
      await load(authedSecret, hideSelf);
    } catch {
      setError("Network error deleting visits.");
    } finally {
      setDeleting(false);
    }
  };

  const onDeleteSelected = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    const ok = window.confirm(
      `Delete ${ids.length} selected visit${ids.length === 1 ? "" : "s"}? This cannot be undone.`,
    );
    if (!ok) return;
    void deleteVisits({ ids });
  };

  const onDeleteAll = () => {
    const ok = window.confirm(
      "Delete ALL visits for this world? This cannot be undone.",
    );
    if (!ok) return;
    void deleteVisits({ all: true });
  };

  return (
    <main className="realm-atmosphere min-h-dvh px-4 py-8 text-realm-silver sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.2em] text-realm-teal-soft">
              Realm chart
            </p>
            <h1 className="font-display mt-1 text-2xl font-semibold tracking-wide">
              Visit tracking
            </h1>
            <p className="mt-1 text-sm text-realm-silver-muted">
              Who explored the map, and what they opened.
            </p>
          </div>
          <Link
            href="/"
            className="glass-btn rounded-full px-3.5 py-2 text-xs text-realm-mist hover:text-realm-silver"
          >
            Back to map
          </Link>
        </div>

        {!authedSecret ? (
          <form
            onSubmit={onUnlock}
            className="glass-panel-strong rounded-3xl p-6"
          >
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-realm-teal-soft">
              Access secret
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-realm-silver outline-none focus:border-teal-400/40"
              placeholder="TRACKING_SECRET"
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={loading || !secret.trim()}
              className="mt-4 rounded-full bg-teal-500/90 px-4 py-2 text-sm font-semibold text-teal-950 disabled:opacity-40"
            >
              {loading ? "Opening…" : "Unlock"}
            </button>
            {error && (
              <p className="mt-3 text-sm text-rose-300/90">{error}</p>
            )}
          </form>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="glass-panel flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-realm-mist">
                <input
                  type="checkbox"
                  checked={hideSelf}
                  onChange={(e) => setHideSelf(e.target.checked)}
                  className="accent-teal-400"
                />
                Hide my own visits
              </label>
              <button
                type="button"
                onClick={() => authedSecret && void load(authedSecret, hideSelf)}
                className="glass-btn rounded-full px-3 py-1.5 text-xs text-realm-mist hover:text-realm-silver"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthedSecret(null);
                  setData(null);
                  setSelected(new Set());
                  try {
                    sessionStorage.removeItem(SECRET_KEY);
                  } catch {
                    /* */
                  }
                }}
                className="glass-btn rounded-full px-3 py-1.5 text-xs text-realm-mist hover:text-realm-silver"
              >
                Lock
              </button>
              <p className="text-xs text-realm-silver-muted">
                {totals.visits} visits · {totals.events} events
                {data?.worldId ? ` · world ${data.worldId}` : ""}
              </p>
            </div>

            {visits.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <label className="glass-panel flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-realm-mist">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="accent-teal-400"
                  />
                  Select all
                </label>
                <button
                  type="button"
                  disabled={deleting || selected.size === 0}
                  onClick={onDeleteSelected}
                  className="rounded-full border border-rose-400/35 bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-900/50 disabled:opacity-40"
                >
                  {deleting
                    ? "Deleting…"
                    : `Delete selected${selected.size ? ` (${selected.size})` : ""}`}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={onDeleteAll}
                  className="rounded-full border border-rose-400/25 bg-transparent px-3 py-1.5 text-xs text-rose-200/90 hover:bg-rose-950/30 disabled:opacity-40"
                >
                  Delete all
                </button>
              </div>
            )}

            {error && (
              <p className="mb-3 text-sm text-rose-300/90">{error}</p>
            )}

            {data && !data.configured && (
              <p className="glass-panel mb-4 rounded-2xl px-4 py-3 text-sm text-realm-mist">
                Turso is not configured on this deploy, so visits are not stored
                yet.
              </p>
            )}

            <div className="space-y-3">
              {visits.length === 0 ? (
                <p className="glass-panel rounded-2xl px-4 py-8 text-center text-sm text-realm-silver-muted">
                  {loading ? "Loading…" : "No visits recorded yet."}
                </p>
              ) : (
                visits.map((visit) => {
                  const open = expanded === visit.id;
                  const duration = visitDurationLabel(visit);
                  const isChecked = selected.has(visit.id);
                  return (
                    <article
                      key={visit.id}
                      className={`glass-panel-strong overflow-hidden rounded-2xl ${
                        isChecked ? "ring-1 ring-rose-400/35" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2 px-3 py-3.5 sm:px-4">
                        <label className="mt-1 flex shrink-0 items-center pt-0.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(visit.id)}
                            className="accent-teal-400"
                            aria-label={`Select visit ${placeLabel(visit)}`}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((id) =>
                              id === visit.id ? null : visit.id,
                            )
                          }
                          className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-realm-silver">
                              {placeLabel(visit)}
                              {visit.isSelf ? (
                                <span className="ml-2 rounded-full border border-violet-300/30 bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                                  You
                                </span>
                              ) : null}
                            </p>
                            <p className="mt-0.5 text-xs text-realm-silver-muted">
                              {formatWhen(visit.startedAt)}
                              {duration ? ` · ${duration}` : ""}
                              {visit.ip ? ` · ${visit.ip}` : ""}
                              {` · ${visit.events.length} events`}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-realm-teal-soft">
                            {open ? "Hide" : "Events"}
                          </span>
                        </button>
                      </div>
                      {open && (
                        <ul className="glass-scroll max-h-64 space-y-1.5 overflow-y-auto border-t border-white/10 px-4 py-3">
                          {visit.events.length === 0 ? (
                            <li className="text-xs text-realm-silver-muted">
                              No named events in this visit.
                            </li>
                          ) : (
                            visit.events.map((ev) => (
                              <li
                                key={ev.id}
                                className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2"
                              >
                                <p className="text-xs font-semibold capitalize text-realm-silver">
                                  {eventLabel(ev.name)}
                                </p>
                                <p className="mt-0.5 font-mono text-[10px] text-realm-silver-muted">
                                  {formatWhen(ev.clientTs || ev.receivedAt)}
                                  {ev.payload?.pinTitle
                                    ? ` · ${String(ev.payload.pinTitle)}`
                                    : ev.payload?.realm
                                      ? ` · ${String(ev.payload.realm)}`
                                      : ""}
                                </p>
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
