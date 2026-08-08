"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LorePin, PinType } from "@/types/world";
import {
  X,
  ExternalLink,
  Mail,
  Sparkles,
  Boxes,
  Trophy,
  Scroll,
  CalendarDays,
} from "lucide-react";
import * as Icons from "lucide-react";
import { getAvatarById } from "@/config/avatars";

interface LoreDrawerProps {
  pin: LorePin | null;
  onClose: () => void;
  onHire?: () => void;
  onOpenCalendar?: () => void;
}

type CardPlacement =
  | { mode: "anchored"; left: number; top: number }
  | { mode: "fallback" };

const CARD_WIDTH = 300;
const GAP = 14;
const PAD = 14;

const TYPE_META: Record<
  PinType,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  character: { label: "Character", Icon: Icons.User },
  project: { label: "Project", Icon: Boxes },
  achievement: { label: "Achievement", Icon: Trophy },
  quest: { label: "Quest", Icon: Scroll },
  easter_egg: { label: "Secret", Icon: Sparkles },
};

const DynamicIcon = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => {
  const icons = Icons as unknown as Record<
    string,
    React.ComponentType<{ className?: string }>
  >;
  const IconComponent = icons[name] || Icons.MapPin;
  return <IconComponent className={className} />;
};

function computePlacement(
  pinId: string,
  cardHeight: number,
): CardPlacement {
  const el = document.querySelector(`[data-pin-id="${pinId}"]`);
  if (!el) return { mode: "fallback" };

  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const pinOnScreen =
    rect.bottom > 40 &&
    rect.top < vh - 40 &&
    rect.right > 40 &&
    rect.left < vw - 40;

  if (vw < 720 || !pinOnScreen) {
    return { mode: "fallback" };
  }

  const height = Math.min(cardHeight || 420, vh - PAD * 2);
  const spaceRight = vw - rect.right - PAD;
  const spaceLeft = rect.left - PAD;
  const placeRight =
    spaceRight >= CARD_WIDTH + GAP || spaceRight >= spaceLeft;

  let left = placeRight ? rect.right + GAP : rect.left - GAP - CARD_WIDTH;
  left = Math.max(PAD, Math.min(left, vw - CARD_WIDTH - PAD));

  let top = rect.top + rect.height / 2 - height / 2;
  top = Math.max(PAD, Math.min(top, vh - height - PAD));

  return { mode: "anchored", left, top };
}

export const LoreDrawer: React.FC<LoreDrawerProps> = ({
  pin,
  onClose,
  onHire,
  onOpenCalendar,
}) => {
  const cardRef = useRef<HTMLElement>(null);
  const [placement, setPlacement] = useState<CardPlacement | null>(null);

  useEffect(() => {
    if (!pin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, onClose]);

  useLayoutEffect(() => {
    if (!pin) {
      setPlacement(null);
      return;
    }

    let raf = 0;
    let cancelled = false;
    let lastLeft = -999;
    let lastTop = -999;
    let lastMode: CardPlacement["mode"] | null = null;

    const track = () => {
      if (cancelled) return;

      const height = cardRef.current?.offsetHeight ?? 420;
      const next = computePlacement(pin.id, height);

      if (next.mode === "fallback") {
        if (lastMode !== "fallback") {
          lastMode = "fallback";
          setPlacement(next);
        }
      } else if (
        lastMode !== "anchored" ||
        Math.abs(next.left - lastLeft) > 0.5 ||
        Math.abs(next.top - lastTop) > 0.5
      ) {
        lastMode = "anchored";
        lastLeft = next.left;
        lastTop = next.top;
        setPlacement(next);
      }

      raf = requestAnimationFrame(track);
    };

    raf = requestAnimationFrame(track);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [pin]);

  const cardPositionClass =
    placement?.mode === "anchored"
      ? "parchment-card fixed z-50 flex max-h-[min(68vh,480px)] flex-col overflow-hidden rounded-[1.25rem]"
      : "parchment-card fixed top-1/2 left-1/2 z-50 flex max-h-[min(68vh,480px)] w-[min(100%-2rem,300px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.25rem]";

  const avatar = pin ? getAvatarById(pin.avatarId) : undefined;
  const typeMeta = pin ? TYPE_META[pin.category] : null;
  const TypeIcon = typeMeta?.Icon ?? Sparkles;

  return (
    <AnimatePresence>
      {pin && (
        <>
          <motion.button
            type="button"
            aria-label="Dismiss lore"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[#040a0e]/40 backdrop-blur-[2px]"
          />

          <motion.article
            key={pin.id}
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lore-title"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
            style={
              placement?.mode === "anchored"
                ? {
                    position: "fixed",
                    left: placement.left,
                    top: placement.top,
                    width: CARD_WIDTH,
                  }
                : undefined
            }
            className={cardPositionClass}
          >
            <div className="relative z-10 flex items-start justify-between gap-2.5 border-b parchment-rule px-4 pb-3 pt-4">
              <div className="flex min-w-0 items-start gap-2.5">
                {pin.category === "character" && avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar.src}
                    alt=""
                    className="mt-0.5 h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-[var(--seal)]/35"
                  />
                ) : (
                  <span className="parchment-icon mt-0.5 flex h-8 w-8 shrink-0 rounded-xl">
                    <DynamicIcon name={pin.iconName} className="h-3.5 w-3.5" />
                  </span>
                )}
                <div className="min-w-0">
                  <span className="parchment-pill inline-flex items-center gap-1">
                    <TypeIcon className="h-2.5 w-2.5" />
                    {pin.content.badge || typeMeta?.label || pin.category}
                  </span>
                  <h2
                    id="lore-title"
                    className="font-display mt-1.5 text-lg font-semibold leading-snug tracking-wide text-[var(--ink)]"
                  >
                    {pin.title}
                  </h2>
                  <p className="mt-0.5 text-xs font-medium tracking-wide text-[var(--ink-faint)]">
                    {pin.subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="parchment-btn shrink-0 rounded-full p-1.5 text-[var(--ink-faint)] hover:text-[var(--ink)]"
                aria-label="Close lore"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="parchment-scroll relative z-10 flex-1 overflow-y-auto px-4 py-3">
              <div className="parchment-body rounded-xl p-3 text-sm leading-relaxed">
                {pin.content.description}
              </div>

              {pin.category === "character" &&
                pin.content.stats &&
                pin.content.stats.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--seal)]">
                      <Sparkles className="h-3 w-3" />
                      Attributes & Proficiency
                    </h3>
                    <div className="space-y-2.5">
                      {pin.content.stats.map((stat, index) => (
                        <div key={stat.label}>
                          <div className="mb-1 flex items-baseline justify-between">
                            <span className="text-xs text-[var(--ink-soft)]">
                              {stat.label}
                            </span>
                            <span className="font-mono text-[10px] font-semibold text-[var(--seal)]">
                              {stat.value}
                              <span className="text-[var(--ink-faint)]">%</span>
                            </span>
                          </div>
                          <div className="parchment-stat-track">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${stat.value}%` }}
                              transition={{
                                duration: 0.9,
                                delay: index * 0.06,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="parchment-stat-fill"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {pin.category === "achievement" && (
                <div className="mt-4 rounded-xl border border-[var(--seal)]/25 bg-[var(--seal)]/8 px-3 py-2.5 text-center">
                  <Trophy className="mx-auto h-5 w-5 text-[var(--seal)]" />
                  <p className="mt-1.5 font-display text-sm text-[var(--ink)]">
                    {pin.content.badge || "Achievement Unlocked"}
                  </p>
                </div>
              )}

              {pin.content.tags && pin.content.tags.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                    {pin.category === "project"
                      ? "Stack & Concepts"
                      : pin.category === "character"
                        ? "Traits & Focus"
                        : "Tags"}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {pin.content.tags.map((tag) => (
                      <span key={tag} className="parchment-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(pin.content.externalLink || pin.content.callToAction) && (
              <div className="relative z-10 space-y-1.5 border-t parchment-rule px-4 py-3">
                {pin.content.externalLink && (
                  <a
                    href={pin.content.externalLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="parchment-btn flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-[var(--seal)]" />
                    {pin.content.externalLink.label}
                  </a>
                )}

                {pin.content.callToAction &&
                  (pin.content.callToAction.actionType === "hire" ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onHire?.();
                      }}
                      className="parchment-btn-primary flex w-full items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-semibold"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {pin.content.callToAction.label}
                    </button>
                  ) : pin.content.callToAction.actionType === "calendar" ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCalendar?.();
                      }}
                      className="parchment-btn-primary flex w-full items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-semibold"
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      {pin.content.callToAction.label}
                    </button>
                  ) : (
                    <a
                      href={pin.content.callToAction.target}
                      className="parchment-btn-primary flex w-full items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-semibold"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {pin.content.callToAction.label}
                    </a>
                  ))}
              </div>
            )}
          </motion.article>
        </>
      )}
    </AnimatePresence>
  );
};
