"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarDays, ExternalLink, Loader2 } from "lucide-react";
import {
  detectSchedulingProvider,
  schedulingProviderLabel,
  toCalLink,
  toEmbedUrl,
} from "@/lib/scheduling";

interface CalendarModalProps {
  open: boolean;
  onClose: () => void;
  schedulingUrl: string | null;
}

declare global {
  interface Window {
    // Cal.com embed queue API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cal?: any;
  }
}

/** Official Cal.com embed bootstrap (queue + script). */
function ensureCal(): void {
  if (typeof window === "undefined") return;
  if (window.Cal) return;

  (function (C: Window, A: string, L: string) {
    const doc = C.document;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Cal = function (...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cal = (C as any).Cal;
      const ar = args;
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        const script = doc.createElement("script");
        script.src = A;
        script.async = true;
        doc.head.appendChild(script);
        cal.loaded = true;
      }
      if (ar[0] === L) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const api: any = function (...inner: any[]) {
          api.q = api.q || [];
          api.q.push(inner);
        };
        api.q = api.q || [];
        if (typeof ar[1] === "string") {
          cal.ns[ar[1]] = cal.ns[ar[1]] || api;
          cal.ns[ar[1]].q.push(ar);
          cal.q.push(["initNamespace", ar[1]]);
        } else {
          cal.q.push(ar);
        }
        return;
      }
      cal.q.push(ar);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (C as any).Cal = Cal;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (C as any).Cal.q = (C as any).Cal.q || [];
  })(window, "https://app.cal.com/embed/embed.js", "init");
}

function CalComInline({
  calLink,
  active,
}: {
  calLink: string;
  active: boolean;
}) {
  const reactId = useId().replace(/:/g, "");
  const containerId = `my-cal-inline-${reactId}`;
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setStatus("loading");

    // Wait a frame so the landscape dialog has real width/height before mount.
    const start = window.setTimeout(() => {
      try {
        ensureCal();
        window.Cal("init", {
          origin: "https://app.cal.com",
        });

        const el = document.getElementById(containerId);
        if (el) el.innerHTML = "";

        window.Cal("inline", {
          elementOrSelector: `#${containerId}`,
          calLink,
          config: {
            layout: "month_view",
            theme: "dark",
          },
        });

        window.Cal("ui", {
          theme: "dark",
          styles: { branding: { brandColor: "#2dd4bf" } },
          hideEventTypeDetails: false,
          layout: "month_view",
        });

        window.setTimeout(() => {
          if (!cancelled) setStatus("ready");
        }, 900);
      } catch {
        if (!cancelled) setStatus("error");
      }
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(start);
      const node = document.getElementById(containerId);
      if (node) node.innerHTML = "";
    };
  }, [active, calLink, containerId]);

  return (
    <div className="absolute inset-0 bg-[#0a0a0a]">
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-sm text-realm-silver-muted">
          <Loader2 className="h-4 w-4 animate-spin text-teal-300" />
          Opening calendar…
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-amber-200/90">
          Could not load Cal.com embed. Use “Open in a new tab” below.
        </div>
      )}
      <div
        id={containerId}
        className="h-full w-full overflow-auto"
        style={{ width: "100%", height: "100%", overflow: "auto" }}
      />
    </div>
  );
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  open,
  onClose,
  schedulingUrl,
}) => {
  const provider = schedulingUrl
    ? detectSchedulingProvider(schedulingUrl)
    : "unknown";
  const calLink = useMemo(
    () => (schedulingUrl ? toCalLink(schedulingUrl) : null),
    [schedulingUrl],
  );
  const calendlyEmbedUrl = useMemo(
    () =>
      schedulingUrl && provider === "calendly"
        ? toEmbedUrl(schedulingUrl)
        : null,
    [schedulingUrl, provider],
  );
  const calFallbackEmbedUrl = useMemo(
    () =>
      schedulingUrl && provider === "calcom"
        ? toEmbedUrl(schedulingUrl)
        : null,
    [schedulingUrl, provider],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Dismiss calendar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-[#040a0e]/55 backdrop-blur-[3px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-title"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="glass-panel-strong fixed top-1/2 left-1/2 z-[90] flex h-[min(82dvh,82vh,620px)] w-[min(100%-1.25rem,980px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.35rem]"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-300/90">
                  <CalendarDays className="h-3 w-3" />
                  {schedulingProviderLabel(provider)}
                </p>
                <h2
                  id="calendar-title"
                  className="font-display mt-1 text-lg text-realm-silver"
                >
                  Chart a meeting
                </h2>
                <p className="mt-0.5 text-xs text-realm-silver-muted">
                  Pick a time that works — stays inside the realm.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="glass-btn shrink-0 rounded-full p-2 text-realm-silver-muted hover:text-realm-silver"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0a0a0a]">
              {!schedulingUrl ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <CalendarDays className="h-8 w-8 text-realm-teal-soft/70" />
                  <p className="text-sm text-realm-silver">
                    Scheduling link is not configured for this deployment.
                  </p>
                </div>
              ) : provider === "calcom" && calLink ? (
                <CalComInline calLink={calLink} active={open} />
              ) : calendlyEmbedUrl ? (
                <iframe
                  title="Scheduling calendar"
                  src={calendlyEmbedUrl}
                  className="absolute inset-0 h-full w-full border-0 bg-white"
                  loading="lazy"
                />
              ) : calFallbackEmbedUrl ? (
                <iframe
                  title="Scheduling calendar"
                  src={calFallbackEmbedUrl}
                  className="absolute inset-0 h-full w-full border-0 bg-[#0a0a0a]"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-realm-silver-muted">
                  Unsupported scheduling URL. Use Cal.com or Calendly.
                </div>
              )}
            </div>

            {schedulingUrl && (
              <div className="shrink-0 border-t border-white/10 px-4 py-2.5 sm:px-5">
                <a
                  href={schedulingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-realm-silver-muted hover:text-realm-teal-soft"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open in a new tab
                </a>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
