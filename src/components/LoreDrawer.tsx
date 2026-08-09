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
  RotateCcw,
} from "lucide-react";
import * as Icons from "lucide-react";
import { getAvatarById } from "@/config/avatars";
import { prefersReducedMotion } from "@/lib/hire";

interface LoreDrawerProps {
  pin: LorePin | null;
  /** Used to resolve achievement contributors */
  pins?: LorePin[];
  onClose: () => void;
  onHire?: () => void;
  onOpenCalendar?: () => void;
}

type CardPlacement =
  | { mode: "anchored"; left: number; top: number }
  | { mode: "fallback" };

const CARD_WIDTH = 340;
const GAP = 14;
const PAD = 14;
/** Used for first placement before the card has laid out. */
const ESTIMATED_CARD_HEIGHT = 460;

const TYPE_META: Record<
  PinType,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  character: { label: "Character", Icon: Icons.User },
  job: { label: "Job", Icon: Icons.Briefcase },
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

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "a, button, input, textarea, select, [role='button'], [data-no-flip]",
    ),
  );
}

function tagsHeading(category: PinType): string {
  if (category === "project") return "Tools";
  if (category === "character") return "Skillset";
  if (category === "achievement") return "Marks of Merit";
  return "Tags";
}

function statsHeading(category: PinType): string {
  if (category === "project") return "Metrics";
  return "Abilities";
}

function formatIsoDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function pinHasBack(pin: LorePin): boolean {
  if (pin.category === "quest") return true;
  if (pin.category === "job") {
    return Boolean(pin.content.tasks?.length || pin.content.markdownBody);
  }
  if (pin.category === "easter_egg") {
    return Boolean(
      pin.content.stats?.length ||
        pin.content.tags?.length ||
        pin.content.markdownBody,
    );
  }
  return Boolean(
    pin.content.stats?.length ||
      pin.content.tags?.length ||
      pin.content.joinedAt ||
      pin.content.startDate ||
      pin.content.endDate ||
      pin.content.achievedAt ||
      pin.content.contributorIds?.length ||
      pin.content.markdownBody ||
      pin.category === "achievement",
  );
}

export const LoreDrawer: React.FC<LoreDrawerProps> = ({
  pin,
  pins = [],
  onClose,
  onHire,
  onOpenCalendar,
}) => {
  const cardRef = useRef<HTMLElement>(null);
  const flippedRef = useRef(false);
  const [placement, setPlacement] = useState<CardPlacement | null>(null);
  const [placementPinId, setPlacementPinId] = useState<string | null>(null);
  const [positioned, setPositioned] = useState(false);
  const [flipped, setFlipped] = useState(false);

  flippedRef.current = flipped;

  useEffect(() => {
    if (!pin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (flippedRef.current) setFlipped(false);
        else onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, onClose]);

  useLayoutEffect(() => {
    if (!pin) {
      setPlacement(null);
      setPlacementPinId(null);
      setPositioned(false);
      setFlipped(false);
      return;
    }

    const pinId = pin.id;
    let cancelled = false;
    let raf = 0;
    let revealed = false;
    let lastLeft = -999;
    let lastTop = -999;
    let lastMode: CardPlacement["mode"] | null = null;

    setFlipped(false);
    setPositioned(false);

    // Sync estimate before paint so we never flash the centered fallback.
    const initial = computePlacement(pinId, ESTIMATED_CARD_HEIGHT);
    setPlacement(initial);
    setPlacementPinId(pinId);
    if (initial.mode === "anchored") {
      lastMode = "anchored";
      lastLeft = initial.left;
      lastTop = initial.top;
    } else {
      lastMode = "fallback";
    }

    const applyPlacement = (next: CardPlacement) => {
      if (next.mode === "fallback") {
        if (lastMode !== "fallback") {
          lastMode = "fallback";
          setPlacement(next);
        }
        return;
      }
      if (
        lastMode !== "anchored" ||
        Math.abs(next.left - lastLeft) > 0.5 ||
        Math.abs(next.top - lastTop) > 0.5
      ) {
        lastMode = "anchored";
        lastLeft = next.left;
        lastTop = next.top;
        setPlacement(next);
      }
    };

    const track = () => {
      if (cancelled) return;

      const measured = cardRef.current?.offsetHeight ?? 0;

      if (!flippedRef.current) {
        applyPlacement(
          computePlacement(pinId, measured || ESTIMATED_CARD_HEIGHT),
        );
      }

      // Reveal only after we have a real layout height (or fallback with no pin el).
      if (!revealed) {
        if (measured > 0 || lastMode === "fallback") {
          if (measured > 0 && !flippedRef.current) {
            applyPlacement(computePlacement(pinId, measured));
          }
          revealed = true;
          setPositioned(true);
        }
      }

      raf = requestAnimationFrame(track);
    };

    raf = requestAnimationFrame(track);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [pin?.id]);

  const placementReady =
    Boolean(pin) && placement !== null && placementPinId === pin?.id;

  const cardPositionClass =
    placement?.mode === "anchored"
      ? "fixed z-50 max-h-[min(85dvh,72vh,520px)]"
      : "fixed top-1/2 left-1/2 z-50 w-[min(100%-2rem,340px)] -translate-x-1/2 -translate-y-1/2 max-h-[min(85dvh,72vh,520px)]";

  const avatar = pin ? getAvatarById(pin.avatarId) : undefined;
  const typeMeta = pin ? TYPE_META[pin.category] : null;
  const TypeIcon = typeMeta?.Icon ?? Sparkles;
  const hasBackDetail = Boolean(pin && pinHasBack(pin));

  const contributors = pin?.content.contributorIds
    ?.map((id) => pins.find((p) => p.id === id))
    .filter((p): p is LorePin => Boolean(p));

  const toggleFlip = () => {
    if (!hasBackDetail) return;
    setFlipped((v) => !v);
  };

  const actionFooter =
    pin && (pin.content.externalLink || pin.content.callToAction) ? (
      <div
        className="relative z-10 flex gap-2 border-t parchment-rule px-4 pb-5 pt-3"
        data-no-flip
        onClick={(e) => e.stopPropagation()}
      >
        {pin.content.externalLink && (
          <a
            href={pin.content.externalLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="parchment-btn-secondary flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 py-2.5 text-center text-[11px] font-semibold leading-tight"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{pin.content.externalLink.label}</span>
          </a>
        )}

        {pin.content.callToAction?.actionType === "hire" &&
          !pin.content.externalLink && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCalendar?.();
              }}
              className="parchment-btn-secondary flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 py-2.5 text-center text-[11px] font-semibold leading-tight"
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Schedule meeting</span>
            </button>
          )}

        {pin.content.callToAction &&
          (pin.content.callToAction.actionType === "hire" ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onHire?.();
              }}
              className="parchment-btn-primary flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 py-2.5 text-center text-[11px] font-semibold leading-tight"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{pin.content.callToAction.label}</span>
            </button>
          ) : pin.content.callToAction.actionType === "calendar" ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCalendar?.();
              }}
              className="parchment-btn-primary flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 py-2.5 text-center text-[11px] font-semibold leading-tight"
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{pin.content.callToAction.label}</span>
            </button>
          ) : (
            <a
              href={pin.content.callToAction.target}
              className="parchment-btn-primary flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 py-2.5 text-center text-[11px] font-semibold leading-tight"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{pin.content.callToAction.label}</span>
            </a>
          ))}
      </div>
    ) : null;

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

          {placementReady && (
            <motion.article
              key={pin.id}
              ref={cardRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="lore-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: positioned ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={
                placement.mode === "anchored"
                  ? {
                      position: "fixed",
                      left: placement.left,
                      top: placement.top,
                      width: CARD_WIDTH,
                      // Keep in layout for measuring while invisible
                      visibility: positioned ? "visible" : "hidden",
                    }
                  : {
                      visibility: positioned ? "visible" : "hidden",
                    }
              }
              className={cardPositionClass}
            >
            <div className="relative [perspective:1200px]">
              {/* ── Front (defines shell size; stays in layout while flipped) ── */}
              <motion.div
                className={`parchment-card flex max-h-[min(85dvh,72vh,520px)] min-h-0 flex-col overflow-hidden rounded-[1.25rem] ${
                  hasBackDetail ? "cursor-pointer" : ""
                }`}
                initial={false}
                animate={
                  flipped
                    ? { rotateY: 90, opacity: 0 }
                    : { rotateY: 0, opacity: 1 }
                }
                transition={
                  prefersReducedMotion()
                    ? { duration: 0 }
                    : {
                        duration: 0.32,
                        ease: [0.4, 0.05, 0.2, 1],
                        delay: flipped ? 0 : 0.16,
                        opacity: {
                          duration: 0.18,
                          delay: flipped ? 0 : 0.16,
                        },
                      }
                }
                style={{
                  transformOrigin: "center center",
                  pointerEvents: flipped ? "none" : "auto",
                }}
                aria-hidden={flipped}
                onClick={(e) => {
                  if (isInteractiveTarget(e.target)) return;
                  toggleFlip();
                }}
              >
                <div className="relative z-10 flex items-center justify-between gap-2 px-4 pb-2 pt-3.5">
                  <span className="parchment-pill inline-flex items-center gap-1">
                    <TypeIcon className="h-2.5 w-2.5" />
                    {pin.content.badge || typeMeta?.label || pin.category}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {hasBackDetail && (
                      <span className="flex items-center gap-1 text-[10px] font-medium tracking-wide text-[var(--ink-faint)]">
                        <RotateCcw className="h-3 w-3" />
                        Tap to flip
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="parchment-btn shrink-0 rounded-full p-1.5 text-[var(--ink-faint)] hover:text-[var(--ink)]"
                      aria-label="Close lore"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="parchment-scroll relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-5">
                  {/* Hero image / icon */}
                  <div className="relative mb-3 overflow-hidden rounded-xl border border-[rgba(90,70,45,0.22)] bg-[rgba(42,34,24,0.06)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
                    {pin.category === "character" && avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar.src}
                        alt=""
                        className="aspect-[5/4] w-full object-cover object-top"
                      />
                    ) : (
                      <div className="flex aspect-[5/4] w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(ellipse_at_50%_40%,rgba(15,118,110,0.12),transparent_65%)]">
                        <span className="parchment-icon flex h-16 w-16 rounded-2xl">
                          <DynamicIcon
                            name={pin.iconName}
                            className="h-7 w-7"
                          />
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
                          {typeMeta?.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <h2
                    id="lore-title"
                    className="font-display text-lg font-semibold leading-snug tracking-wide text-[var(--ink)]"
                  >
                    {pin.title}
                  </h2>
                  <p className="mt-0.5 text-xs font-medium tracking-wide text-[var(--ink-faint)]">
                    {pin.subtitle}
                  </p>

                  {pin.category === "job" &&
                    (pin.content.startDate || pin.content.endDate) && (
                      <p className="mt-1.5 font-mono text-[11px] tracking-wide text-[var(--ink-soft)]">
                        {formatIsoDate(pin.content.startDate) ?? "—"}
                        {" → "}
                        {formatIsoDate(pin.content.endDate) ?? "Present"}
                      </p>
                    )}

                  <div className="parchment-body mt-3 rounded-xl p-3 text-sm leading-relaxed">
                    {pin.content.description}
                  </div>
                </div>

                {actionFooter}
              </motion.div>

              {/* ── Back overlays the same box (must beat .parchment-card { position: relative }) ── */}
              <motion.div
                className={`parchment-card flex max-h-[min(85dvh,72vh,520px)] min-h-0 flex-col overflow-hidden rounded-[1.25rem] ${
                  hasBackDetail ? "cursor-pointer" : ""
                }`}
                initial={false}
                animate={
                  flipped
                    ? { rotateY: 0, opacity: 1 }
                    : { rotateY: -90, opacity: 0 }
                }
                transition={
                  prefersReducedMotion()
                    ? { duration: 0 }
                    : {
                        duration: 0.32,
                        ease: [0.4, 0.05, 0.2, 1],
                        delay: flipped ? 0.16 : 0,
                        opacity: {
                          duration: 0.18,
                          delay: flipped ? 0.16 : 0,
                        },
                      }
                }
                style={{
                  position: "absolute",
                  inset: 0,
                  transformOrigin: "center center",
                  pointerEvents: flipped ? "auto" : "none",
                }}
                aria-hidden={!flipped}
                onClick={(e) => {
                  if (isInteractiveTarget(e.target)) return;
                  toggleFlip();
                }}
              >
                <div className="relative z-10 flex items-start justify-between gap-2 border-b parchment-rule px-4 pb-3 pt-3.5">
                  <div className="min-w-0">
                    <span className="parchment-pill inline-flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      Details
                    </span>
                    <h2 className="font-display mt-1.5 text-base font-semibold leading-snug tracking-wide text-[var(--ink)]">
                      {pin.title}
                    </h2>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                    <span className="flex items-center gap-1 text-[10px] font-medium tracking-wide text-[var(--ink-faint)]">
                      <RotateCcw className="h-3 w-3" />
                      Tap to flip
                    </span>
                    <button
                      type="button"
                      onClick={onClose}
                      className="parchment-btn shrink-0 rounded-full p-1.5 text-[var(--ink-faint)] hover:text-[var(--ink)]"
                      aria-label="Close lore"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="parchment-scroll relative z-10 flex-1 overflow-y-auto px-4 pb-5 pt-3">
                  {pin.category === "quest" ? (
                    <div className="flex min-h-[220px] flex-1 flex-col items-center justify-center gap-3 py-8">
                      <span className="parchment-icon flex h-20 w-20 rounded-2xl">
                        <Scroll className="h-9 w-9" />
                      </span>
                      <p className="font-display text-sm tracking-wide text-[var(--ink)]">
                        Quest
                      </p>
                      <p className="max-w-[16rem] text-center text-xs leading-relaxed text-[var(--ink-faint)]">
                        The path is written on the front. The seal alone remains
                        here.
                      </p>
                    </div>
                  ) : pin.category === "job" ? (
                    <div>
                      <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--seal)]">
                        Duties of the post
                      </h3>
                      {pin.content.tasks && pin.content.tasks.length > 0 ? (
                        <ul className="space-y-2.5">
                          {pin.content.tasks.map((task, index) => (
                            <li
                              key={`${task.slice(0, 24)}-${index}`}
                              className="flex gap-2.5 text-sm leading-relaxed text-[var(--ink-soft)]"
                            >
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--seal)]" />
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      ) : pin.content.markdownBody ? (
                        <div className="parchment-body rounded-xl p-3 text-sm leading-relaxed whitespace-pre-wrap">
                          {pin.content.markdownBody}
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--ink-faint)]">
                          No duties recorded for this posting.
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      {pin.content.stats && pin.content.stats.length > 0 && (
                        <div>
                          <h3 className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--seal)]">
                            <Sparkles className="h-3 w-3" />
                            {statsHeading(pin.category)}
                          </h3>
                          <div className="space-y-2.5">
                            {pin.content.stats.map((stat, index) => (
                              <div key={`${stat.label}-${index}`}>
                                <div className="mb-1 flex items-baseline justify-between">
                                  <span className="text-xs text-[var(--ink-soft)]">
                                    {stat.label}
                                  </span>
                                  <span className="font-mono text-[10px] font-semibold text-[var(--seal)]">
                                    {stat.value}
                                    {pin.category !== "project" && (
                                      <span className="text-[var(--ink-faint)]">
                                        %
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className="parchment-stat-track">
                                  <motion.div
                                    initial={false}
                                    animate={{
                                      width: flipped ? `${stat.value}%` : 0,
                                    }}
                                    transition={{
                                      duration: 0.85,
                                      delay: flipped ? index * 0.05 : 0,
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

                      {pin.content.tags && pin.content.tags.length > 0 && (
                        <div
                          className={
                            pin.content.stats?.length ? "mt-4" : undefined
                          }
                        >
                          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                            {tagsHeading(pin.category)}
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

                      {pin.category === "character" &&
                        formatIsoDate(pin.content.joinedAt) && (
                          <div
                            className={
                              pin.content.stats?.length ||
                              pin.content.tags?.length
                                ? "mt-4"
                                : undefined
                            }
                          >
                            <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                              Joined the guild
                            </h3>
                            <p className="text-sm text-[var(--ink-soft)]">
                              {formatIsoDate(pin.content.joinedAt)}
                            </p>
                          </div>
                        )}

                      {pin.category === "project" &&
                        (pin.content.startDate || pin.content.endDate) && (
                          <div
                            className={
                              pin.content.stats?.length ||
                              pin.content.tags?.length
                                ? "mt-4"
                                : undefined
                            }
                          >
                            <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                              Timeline
                            </h3>
                            <p className="text-sm text-[var(--ink-soft)]">
                              {formatIsoDate(pin.content.startDate) ?? "—"}
                              {" → "}
                              {formatIsoDate(pin.content.endDate) ?? "Ongoing"}
                            </p>
                          </div>
                        )}

                      {pin.category === "achievement" && (
                        <>
                          <div
                            className={`${
                              pin.content.stats?.length ||
                              pin.content.tags?.length
                                ? "mt-4"
                                : ""
                            } rounded-xl border border-[var(--seal)]/25 bg-[var(--seal)]/8 px-3 py-2.5 text-center`}
                          >
                            <Trophy className="mx-auto h-5 w-5 text-[var(--seal)]" />
                            <p className="mt-1.5 font-display text-sm text-[var(--ink)]">
                              {pin.content.badge || "Achievement Unlocked"}
                            </p>
                            {formatIsoDate(pin.content.achievedAt) && (
                              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                                {formatIsoDate(pin.content.achievedAt)}
                              </p>
                            )}
                          </div>

                          {contributors && contributors.length > 0 && (
                            <div className="mt-4">
                              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                                Contributors
                              </h3>
                              <div className="flex flex-wrap gap-1.5">
                                {contributors.map((ch) => {
                                  const av = getAvatarById(ch.avatarId);
                                  return (
                                    <span
                                      key={ch.id}
                                      className="parchment-tag inline-flex items-center gap-1.5 !rounded-full !py-1 !pl-1 !pr-2.5"
                                    >
                                      {av ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={av.src}
                                          alt=""
                                          className="h-5 w-5 rounded-full object-cover"
                                        />
                                      ) : null}
                                      {ch.title}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {pin.content.markdownBody && (
                        <div className="parchment-body mt-4 rounded-xl p-3 text-sm leading-relaxed whitespace-pre-wrap">
                          {pin.content.markdownBody}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.article>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
