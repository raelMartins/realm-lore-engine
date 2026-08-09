"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  MapPinPlus,
  X,
  Loader2,
  Plus,
} from "lucide-react";
import { getAvatarById, getSelectableAvatars } from "@/config/avatars";
import type { AttributeStat, LorePin, PinType } from "@/types/world";

const PIN_TYPES: { id: PinType; label: string }[] = [
  { id: "character", label: "Character" },
  { id: "job", label: "Job" },
  { id: "project", label: "Project" },
  { id: "achievement", label: "Achievement" },
  { id: "quest", label: "Quest" },
];

type QuestCtaMode = "none" | "calendar" | "link";

export type ChartDraft = {
  coordinates: { x: number; y: number };
};

interface GuildChartControlsProps {
  unlocked: boolean;
  onUnlocked: () => void;
  placing: boolean;
  onStartPlace: () => void;
  onCancelPlace: () => void;
  draft: ChartDraft | null;
  onClearDraft: () => void;
  onPinCreated: (pinId: string) => void;
  placeHint?: string | null;
  /** Guild character pins for achievement contributor picking */
  guildCharacters?: LorePin[];
}

const fieldClass =
  "mt-1 rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-realm-silver outline-none focus:border-teal-400/40";
const fieldFullClass = `${fieldClass} w-full`;

function ChipEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setDraft("");
  };

  return (
    <div>
      <p className="text-xs text-realm-silver-muted">{label}</p>
      {values.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {values.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onChange(values.filter((t) => t !== tag))}
              className="inline-flex items-center gap-1 rounded-full border border-teal-400/35 bg-teal-950/40 px-2.5 py-1 text-[11px] text-teal-100"
              title="Remove"
            >
              {tag}
              <X className="h-3 w-3 opacity-70" />
            </button>
          ))}
        </div>
      )}
      <div className="mt-1 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={`${fieldClass} mt-0 flex-1`}
        />
        <button
          type="button"
          onClick={add}
          className="glass-btn shrink-0 rounded-xl px-3 text-realm-silver"
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Chip-style editor for named values with a proficiency / score. */
function StatEditor({
  label,
  stats,
  onChange,
  namePlaceholder = "Name",
  showPercent = true,
}: {
  label: string;
  stats: AttributeStat[];
  onChange: (next: AttributeStat[]) => void;
  namePlaceholder?: string;
  showPercent?: boolean;
}) {
  const [draftLabel, setDraftLabel] = useState("");
  const [draftValue, setDraftValue] = useState(70);

  const add = () => {
    const name = draftLabel.trim();
    if (!name) return;
    if (stats.some((s) => s.label.toLowerCase() === name.toLowerCase())) return;
    const value = Math.max(0, Math.min(100, Number(draftValue) || 0));
    onChange([...stats, { label: name, value }]);
    setDraftLabel("");
    setDraftValue(70);
  };

  return (
    <div className="min-w-0">
      <p className="text-xs text-realm-silver-muted">{label}</p>
      {stats.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {stats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={() =>
                onChange(stats.filter((s) => s.label !== stat.label))
              }
              className="inline-flex max-w-full items-center overflow-hidden rounded-full border border-teal-400/35 bg-teal-950/40 text-[11px] text-teal-100"
              title="Remove"
            >
              <span className="truncate px-2.5 py-1">{stat.label}</span>
              <span className="inline-flex items-center gap-1 bg-teal-500 px-2 py-1 font-semibold text-[#042f2e]">
                {stat.value}
                {showPercent ? "%" : ""}
                <X className="h-3 w-3 opacity-70" />
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-1 flex min-w-0 items-center gap-1.5">
        <input
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={namePlaceholder}
          className={`${fieldClass} mt-0 min-w-0 flex-1`}
        />
        <input
          type="number"
          min={0}
          max={100}
          value={draftValue}
          onChange={(e) => setDraftValue(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className={`${fieldClass} mt-0 w-12 shrink-0 appearance-none px-1 text-center tabular-nums sm:w-14 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
          aria-label={`${label} value`}
        />
        <button
          type="button"
          onClick={add}
          className="glass-btn shrink-0 rounded-xl px-2.5 py-2 text-realm-silver"
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export const GuildChartControls: React.FC<GuildChartControlsProps> = ({
  unlocked,
  onUnlocked,
  placing,
  onStartPlace,
  onCancelPlace,
  draft,
  onClearDraft,
  onPinCreated,
  placeHint,
  guildCharacters = [],
}) => {
  const [showUnlock, setShowUnlock] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState<PinType>("character");
  const [avatarId, setAvatarId] = useState(
    () => getSelectableAvatars("company")[0]?.id ?? "cool",
  );
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [stats, setStats] = useState<AttributeStat[]>([]);
  const [joinedAt, setJoinedAt] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [achievedAt, setAchievedAt] = useState("");
  const [contributorIds, setContributorIds] = useState<string[]>([]);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [questCta, setQuestCta] = useState<QuestCtaMode>("none");
  const [tasks, setTasks] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [avatarsExpanded, setAvatarsExpanded] = useState(false);

  const guildAvatars = getSelectableAvatars("company");
  const AVATAR_PREVIEW_COUNT = 5;
  const visibleAvatars = avatarsExpanded
    ? guildAvatars
    : guildAvatars.slice(0, AVATAR_PREVIEW_COUNT);
  const hasMoreAvatars = guildAvatars.length > AVATAR_PREVIEW_COUNT;

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setDescription("");
    setTags([]);
    setStats([]);
    setJoinedAt("");
    setStartDate("");
    setEndDate("");
    setAchievedAt("");
    setContributorIds([]);
    setLinkLabel("");
    setLinkUrl("");
    setQuestCta("none");
    setTasks([]);
    setSubmitError(null);
    setCategory("character");
    setAvatarsExpanded(false);
  };

  useEffect(() => {
    if (!draft) resetForm();
  }, [draft]);

  const titleLabel = useMemo(() => {
    if (category === "character") return "Name";
    if (category === "job") return "Role / title";
    return "Title";
  }, [category]);

  const subtitleLabel = useMemo(() => {
    if (category === "character") return "Mantle";
    if (category === "job") return "Company / guild";
    if (category === "quest") return "Subtitle (optional)";
    return "Subtitle";
  }, [category]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlocking(true);
    setUnlockError(null);
    try {
      const res = await fetch("/api/guild/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      if (!res.ok) {
        setUnlockError(
          res.status === 401
            ? "That passphrase does not open this guild chart."
            : "Could not unlock charting.",
        );
        return;
      }
      setPassphrase("");
      setShowUnlock(false);
      onUnlocked();
    } catch {
      setUnlockError("Could not unlock charting.");
    } finally {
      setUnlocking(false);
    }
  };

  const buildContent = (): LorePin["content"] => {
    const content: LorePin["content"] = { description };

    if (category === "character") {
      if (tags.length) content.tags = tags;
      if (stats.some((s) => s.label.trim())) {
        content.stats = stats.filter((s) => s.label.trim());
      }
      if (joinedAt) content.joinedAt = joinedAt;
      if (linkUrl.trim()) {
        content.externalLink = {
          label: linkLabel.trim() || "View portfolio",
          url: linkUrl.trim(),
        };
      }
    }

    if (category === "project") {
      if (tags.length) content.tags = tags;
      if (stats.some((s) => s.label.trim())) {
        content.stats = stats.filter((s) => s.label.trim());
      }
      if (startDate) content.startDate = startDate;
      if (endDate) content.endDate = endDate;
      if (linkUrl.trim()) {
        content.externalLink = {
          label: linkLabel.trim() || "View project",
          url: linkUrl.trim(),
        };
      }
    }

    if (category === "job") {
      if (startDate) content.startDate = startDate;
      if (endDate) content.endDate = endDate;
      if (tasks.length) content.tasks = tasks;
    }

    if (category === "achievement") {
      if (achievedAt) content.achievedAt = achievedAt;
      if (contributorIds.length) content.contributorIds = contributorIds;
    }

    if (category === "quest") {
      if (questCta === "calendar") {
        content.callToAction = {
          label: "Chart a meeting",
          actionType: "calendar",
          target: "#calendar",
        };
      } else if (questCta === "link" && linkUrl.trim()) {
        content.externalLink = {
          label: linkLabel.trim() || "Open link",
          url: linkUrl.trim(),
        };
      }
    }

    return content;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/world/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle:
            category === "character" ||
            category === "quest" ||
            category === "job"
              ? subtitle
              : "",
          category,
          avatarId: category === "character" ? avatarId : undefined,
          coordinates: draft.coordinates,
          content: buildContent(),
        }),
      });
      const json = (await res.json()) as { error?: string; pin?: { id: string } };
      if (!res.ok) {
        setSubmitError(json.error || "Could not chart pin.");
        return;
      }
      onClearDraft();
      if (json.pin?.id) onPinCreated(json.pin.id);
    } catch {
      setSubmitError("Could not chart pin.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleContributor = (id: string) => {
    setContributorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const typePillClass = (id: PinType) =>
    `rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide transition ${
      category === id
        ? "border-teal-300 text-teal-100 shadow-[0_0_0_1px_rgba(94,234,212,0.25)]"
        : "border-white/15 text-realm-silver-muted hover:border-white/30 hover:text-realm-silver"
    }`;

  const questCtaPillClass = (mode: QuestCtaMode) =>
    `rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-wide transition ${
      questCta === mode
        ? "border-teal-300 text-teal-100"
        : "border-white/15 text-realm-silver-muted hover:border-white/30 hover:text-realm-silver"
    }`;

  return (
    <>
      <div className="pointer-events-auto absolute z-30 flex flex-col gap-2 hud-safe-b right-[calc(5.5rem+env(safe-area-inset-right,0px))] max-[500px]:right-[calc(4.75rem+env(safe-area-inset-right,0px))]">
        {!unlocked ? (
          <button
            type="button"
            onClick={() => setShowUnlock(true)}
            className="glass-panel glass-btn hud-compact-pill flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-semibold tracking-wide text-realm-mist hover:text-realm-silver"
          >
            <KeyRound className="h-4 w-4 text-amber-200/80" />
            <span className="hud-pill-label">Unlock guild chart</span>
          </button>
        ) : !placing && !draft ? (
          <button
            type="button"
            onClick={onStartPlace}
            className="glass-panel glass-btn hud-compact-pill flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-semibold tracking-wide text-realm-mist hover:text-realm-silver"
          >
            <MapPinPlus className="h-4 w-4 text-teal-300" />
            <span className="hud-pill-label">Chart a pin</span>
          </button>
        ) : placing ? (
          <div className="glass-panel-strong max-w-[220px] rounded-2xl px-3.5 py-3 text-xs text-realm-mist">
            <p className="font-semibold text-realm-silver">Placement mode</p>
            <p className="mt-1 leading-snug text-realm-silver-muted">
              Click Guild Shore land to place a marker.
            </p>
            {placeHint && (
              <p className="mt-2 text-amber-200/90">{placeHint}</p>
            )}
            <button
              type="button"
              onClick={onCancelPlace}
              className="mt-3 text-[11px] uppercase tracking-wider text-realm-teal-soft hover:text-realm-silver"
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {showUnlock && (
          <>
            <motion.button
              type="button"
              aria-label="Dismiss"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-[#040a0e]/45 backdrop-blur-[2px]"
              onClick={() => setShowUnlock(false)}
            />
            <motion.form
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              onSubmit={(e) => void handleUnlock(e)}
              className="glass-panel-strong fixed top-1/2 left-1/2 z-[70] w-[min(100%-2rem,340px)] -translate-x-1/2 -translate-y-1/2 rounded-[1.35rem] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/80">
                    Guild steward
                  </p>
                  <h2 className="font-display mt-1 text-lg text-realm-silver">
                    Unlock charting
                  </h2>
                  <p className="mt-1 text-sm text-realm-silver-muted">
                    Enter the passphrase for this realm to chart east-isle pins.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUnlock(false)}
                  className="glass-btn rounded-full p-2 text-realm-silver-muted"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                type="password"
                autoFocus
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Passphrase"
                className="mt-4 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-sm text-realm-silver outline-none placeholder:text-realm-silver-muted/50 focus:border-teal-400/40"
              />
              {unlockError && (
                <p className="mt-2 text-xs text-amber-200/90">{unlockError}</p>
              )}
              <button
                type="submit"
                disabled={unlocking || !passphrase}
                className="glass-btn mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-realm-silver disabled:opacity-50"
              >
                {unlocking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Unlock"
                )}
              </button>
            </motion.form>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {draft && (
          <>
            <motion.button
              type="button"
              aria-label="Dismiss"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-[#040a0e]/45 backdrop-blur-[2px]"
              onClick={onClearDraft}
            />
            <motion.form
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              onSubmit={(e) => void handleCreate(e)}
              className="glass-panel-strong fixed top-1/2 left-1/2 z-[70] flex max-h-[min(92dvh,92vh,620px)] w-[min(100%-1.5rem,760px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.35rem]"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 pt-4 pb-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-300/80">
                    New guild pin · {draft.coordinates.x.toFixed(1)},{" "}
                    {draft.coordinates.y.toFixed(1)}
                  </p>
                  <h2 className="font-display mt-1 text-lg text-realm-silver">
                    Chart a node
                  </h2>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Pin type">
                    {PIN_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={category === t.id}
                        onClick={() => setCategory(t.id)}
                        className={typePillClass(t.id)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={onClearDraft}
                    className="glass-btn rounded-full p-2 text-realm-silver-muted"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-x-hidden overflow-y-auto parchment-scroll px-5 py-3.5">
                <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                  {category === "character" && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-realm-silver-muted">Avatar</p>
                      <div className="mt-1 grid w-full grid-cols-5 gap-2">
                        {visibleAvatars.map((avatar) => (
                          <button
                            key={avatar.id}
                            type="button"
                            onClick={() => setAvatarId(avatar.id)}
                            className={`aspect-square w-full overflow-hidden rounded-xl border-2 transition ${
                              avatarId === avatar.id
                                ? "border-teal-300 shadow-[0_0_0_1px_rgba(94,234,212,0.35)]"
                                : "border-white/15 opacity-75 hover:border-white/30 hover:opacity-100"
                            }`}
                            title={avatar.label}
                            aria-pressed={avatarId === avatar.id}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={avatar.src}
                              alt={avatar.label}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                      {hasMoreAvatars && (
                        <button
                          type="button"
                          onClick={() => setAvatarsExpanded((v) => !v)}
                          className="mt-1.5 text-[11px] font-medium tracking-wide text-teal-300/90 hover:text-teal-200"
                        >
                          {avatarsExpanded
                            ? "Show less"
                            : `Show more (${guildAvatars.length - AVATAR_PREVIEW_COUNT})`}
                        </button>
                      )}
                    </div>
                  )}

                  <label
                    className={`block text-xs text-realm-silver-muted ${
                      category === "project" ? "sm:col-span-2" : ""
                    }`}
                  >
                    {titleLabel}
                    <input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={fieldFullClass}
                    />
                  </label>

                  {category === "character" && (
                    <label className="block text-xs text-realm-silver-muted">
                      {subtitleLabel}
                      <input
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="e.g. Cartographer of Interfaces"
                        className={fieldFullClass}
                      />
                    </label>
                  )}

                  {category === "job" && (
                    <label className="block text-xs text-realm-silver-muted">
                      {subtitleLabel}
                      <input
                        required
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="e.g. Moonwell Forge"
                        className={fieldFullClass}
                      />
                    </label>
                  )}

                  {category === "quest" && (
                    <label className="block text-xs text-realm-silver-muted">
                      {subtitleLabel}
                      <input
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        className={fieldFullClass}
                      />
                    </label>
                  )}

                  {category === "achievement" && (
                    <label className="block text-xs text-realm-silver-muted">
                      Achievement date
                      <input
                        type="date"
                        value={achievedAt}
                        onChange={(e) => setAchievedAt(e.target.value)}
                        className={fieldFullClass}
                      />
                    </label>
                  )}

                  <label className="block text-xs text-realm-silver-muted sm:col-span-2">
                    Lore
                    <textarea
                      required
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`${fieldFullClass} resize-none`}
                    />
                  </label>

                  {category === "character" && (
                    <label className="block text-xs text-realm-silver-muted">
                      Joined date
                      <input
                        type="date"
                        value={joinedAt}
                        onChange={(e) => setJoinedAt(e.target.value)}
                        className={fieldFullClass}
                      />
                    </label>
                  )}

                  {category === "character" && (
                    <label className="block text-xs text-realm-silver-muted">
                      Portfolio link
                      <input
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://"
                        className={fieldFullClass}
                      />
                    </label>
                  )}

                  {category === "project" && (
                    <label className="block text-xs text-realm-silver-muted">
                      Start date
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={fieldFullClass}
                      />
                    </label>
                  )}

                  {category === "job" && (
                    <label className="block text-xs text-realm-silver-muted">
                      Start date
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={fieldFullClass}
                      />
                    </label>
                  )}

                  {category === "job" && (
                    <label className="block text-xs text-realm-silver-muted">
                      End date
                      <span className="ml-1 text-[10px] opacity-70">
                        (optional; leave empty if current)
                      </span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={fieldFullClass}
                      />
                    </label>
                  )}

                  {category === "project" && (
                    <label className="block text-xs text-realm-silver-muted">
                      End date
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={fieldFullClass}
                      />
                    </label>
                  )}

                  {category === "project" && (
                    <label className="block text-xs text-realm-silver-muted">
                      Link label
                      <input
                        value={linkLabel}
                        onChange={(e) => setLinkLabel(e.target.value)}
                        placeholder="Optional"
                        className={fieldFullClass}
                      />
                    </label>
                  )}

                  {category === "project" && (
                    <label className="block text-xs text-realm-silver-muted">
                      External link
                      <input
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://"
                        className={fieldFullClass}
                      />
                    </label>
                  )}

                  {category === "achievement" && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-realm-silver-muted">
                        Contributors
                      </p>
                      {guildCharacters.length === 0 ? (
                        <p className="mt-1 text-[11px] text-realm-silver-muted">
                          Chart character pins first to name contributors.
                        </p>
                      ) : (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {guildCharacters.map((ch) => {
                            const selected = contributorIds.includes(ch.id);
                            const avatar = getAvatarById(ch.avatarId);
                            return (
                              <button
                                key={ch.id}
                                type="button"
                                onClick={() => toggleContributor(ch.id)}
                                aria-pressed={selected}
                                className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium transition ${
                                  selected
                                    ? "border-teal-300 text-teal-100"
                                    : "border-white/15 text-realm-silver-muted hover:border-white/30 hover:text-realm-silver"
                                }`}
                              >
                                {avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={avatar.src}
                                    alt=""
                                    className="h-5 w-5 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[9px]">
                                    {ch.title.slice(0, 1)}
                                  </span>
                                )}
                                <span className="truncate">{ch.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {category === "quest" && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-realm-silver-muted">
                        Call to action (optional)
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {(
                          [
                            ["none", "None"],
                            ["calendar", "Chart a meeting"],
                            ["link", "External link"],
                          ] as const
                        ).map(([mode, label]) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setQuestCta(mode)}
                            className={questCtaPillClass(mode)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {questCta === "link" && (
                        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <input
                            value={linkLabel}
                            onChange={(e) => setLinkLabel(e.target.value)}
                            placeholder="Label"
                            className={`${fieldFullClass} mt-0`}
                          />
                          <input
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://"
                            className={`${fieldFullClass} mt-0`}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {category === "character" && (
                    <ChipEditor
                      label="Skillset"
                      values={tags}
                      onChange={setTags}
                      placeholder="Add a skill…"
                    />
                  )}

                  {category === "job" && (
                    <div className="sm:col-span-2">
                      <ChipEditor
                        label="Duties / tasks (card back)"
                        values={tasks}
                        onChange={setTasks}
                        placeholder="Add a duty…"
                      />
                    </div>
                  )}

                  {category === "character" && (
                    <StatEditor
                      label="Abilities"
                      stats={stats}
                      onChange={setStats}
                      namePlaceholder="Ability"
                    />
                  )}

                  {category === "project" && (
                    <ChipEditor
                      label="Tools"
                      values={tags}
                      onChange={setTags}
                      placeholder="Add a tool…"
                    />
                  )}

                  {category === "project" && (
                    <StatEditor
                      label="Metrics"
                      stats={stats}
                      onChange={setStats}
                      namePlaceholder="Metric"
                    />
                  )}
                </div>

                {submitError && (
                  <p className="mt-3 text-xs text-amber-200/90">{submitError}</p>
                )}
              </div>

              <div className="border-t border-white/10 px-5 py-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="glass-btn flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-realm-silver disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Place pin"
                  )}
                </button>
              </div>
            </motion.form>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
