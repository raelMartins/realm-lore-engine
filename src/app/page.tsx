"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCompanyData } from "@/lib/getCompanyData";
import { MapCanvas, type CameraCommand, type CameraCommandInput } from "@/components/MapCanvas";
import { LoreDrawer } from "@/components/LoreDrawer";
import { CommandPalette } from "@/components/CommandPalette";
import { RealmOverview } from "@/components/RealmOverview";
import { GuildChartControls } from "@/components/GuildChartControls";
import { ExplorationProgress } from "@/components/ExplorationProgress";
import { Confetti } from "@/components/hire/Confetti";
import { AllianceCongrats } from "@/components/hire/AllianceCongrats";
import { CalendarModal } from "@/components/CalendarModal";
import { getSchedulingUrl } from "@/lib/scheduling";
import { CompanyLoreConfig, LorePin, RealmSide } from "@/types/world";
import { musicFx, soundFx } from "@/lib/audio";
import {
  PLACEMENT_ERROR_MESSAGE,
  validateGuildPlacement,
} from "@/lib/world/placement";
import {
  clearExploredPinIds,
  countExploredDiscoverable,
  loadExploredPinIds,
  markPinExplored,
} from "@/lib/exploration";
import {
  ADVENTURER_PIN_ID,
  applyUnitedToPins,
  findAllianceSpawn,
  homeUnitedState,
  prefersReducedMotion,
  saveUnitedState,
  todayIsoDate,
  type HireMotion,
  type UnitedPersist,
} from "@/lib/hire";
import { SecretToast } from "@/components/SecretToast";
import { LandscapeGate } from "@/components/LandscapeGate";
import { DesktopHint } from "@/components/DesktopHint";
import { useKonami } from "@/lib/useKonami";
import {
  EASTER_EGG_PIN_ID,
  filterVisiblePins,
  loadRevealedSecrets,
  revealSecret,
  clearRevealedSecrets,
  isSecretPin,
} from "@/lib/secrets";
import type { RealmColorPhase } from "@/components/RealmHitLayer";
import {
  startTracking,
  track,
  TRACK_EVENTS,
} from "@/lib/clientTrack";
import {
  Volume2,
  VolumeX,
  Music2,
  Music,
  Sparkles,
  CalendarDays,
  X,
} from "lucide-react";

type WorldApiResponse = CompanyLoreConfig & {
  _meta?: { source: string; worldId: string };
};

export default function Home() {
  const [worldData, setWorldData] = useState<CompanyLoreConfig | null>(null);
  const [worldId, setWorldId] = useState("default");
  const [selectedPin, setSelectedPin] = useState<LorePin | null>(null);
  const [selectedRealm, setSelectedRealm] = useState<RealmSide | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);

  const [unlocked, setUnlocked] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [draft, setDraft] = useState<{
    coordinates: { x: number; y: number };
  } | null>(null);
  const [placeHint, setPlaceHint] = useState<string | null>(null);
  const [spawnPinId, setSpawnPinId] = useState<string | null>(null);
  const [exploredIds, setExploredIds] = useState<Set<string>>(() => new Set());

  const [unitedState, setUnitedState] = useState<UnitedPersist>(() =>
    homeUnitedState(),
  );
  const [allianceForged, setAllianceForged] = useState(false);
  const [congratsOpen, setCongratsOpen] = useState(false);
  const [realmColorPhase, setRealmColorPhase] =
    useState<RealmColorPhase>("idle");
  const [showTransferTrails, setShowTransferTrails] = useState(false);
  const [trailsRetreating, setTrailsRetreating] = useState(false);
  const [trailSpanMs, setTrailSpanMs] = useState(9000);
  const [confettiOn, setConfettiOn] = useState(false);
  const [confettiHeavy, setConfettiHeavy] = useState(false);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand | null>(
    null,
  );
  const [exitPinId, setExitPinId] = useState<string | null>(null);
  const [exitMotion, setExitMotion] = useState<HireMotion | null>(null);
  const [enterPinId, setEnterPinId] = useState<string | null>(null);
  const [enterMotion, setEnterMotion] = useState<HireMotion | null>(null);
  const [hiddenPinId, setHiddenPinId] = useState<string | null>(null);
  const [hireBusy, setHireBusy] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(
    () => new Set(),
  );
  const [secretToast, setSecretToast] = useState<string | null>(null);
  const schedulingUrl = getSchedulingUrl();
  const allianceEpoch = useRef(0);

  const refreshWorld = async () => {
    const res = await fetch("/api/world");
    if (!res.ok) throw new Error(`World API ${res.status}`);
    const json = (await res.json()) as WorldApiResponse;
    const { _meta, ...data } = json;
    if (_meta?.worldId) setWorldId(_meta.worldId);
    setWorldData(data);
    return { data, worldId: _meta?.worldId ?? "default" };
  };

  useEffect(() => {
    void musicFx.start();
  }, []);

  useEffect(() => {
    startTracking();
  }, []);

  /** Hard interaction lock for the full alliance cinematic. */
  useEffect(() => {
    if (!hireBusy) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const block = (event: Event) => {
      event.preventDefault();
    };
    const blockKeys = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", blockKeys, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", blockKeys, true);
    };
  }, [hireBusy]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const worldPromise = refreshWorld().catch((error: unknown) => {
        console.error("Failed to load /api/world, using local fallback:", error);
        return null;
      });
      const unlockPromise = fetch("/api/guild/unlock")
        .then(async (unlockRes) => {
          if (!unlockRes.ok) return null;
          return (await unlockRes.json()) as { unlocked?: boolean };
        })
        .catch(() => null);

      const [worldResult, unlockStatus] = await Promise.all([
        worldPromise,
        unlockPromise,
      ]);

      if (cancelled) return;

      if (worldResult) {
        const { data, worldId: id } = worldResult;
        setWorldData(data);
        setWorldId(id);
        setExploredIds(loadExploredPinIds(id));
        setRevealedSecrets(loadRevealedSecrets(id));
        const home = homeUnitedState();
        setUnitedState(home);
        saveUnitedState(id, home);
        setHiddenPinId(null);
      } else {
        setWorldData(getCompanyData());
        setExploredIds(loadExploredPinIds("default"));
        setRevealedSecrets(loadRevealedSecrets("default"));
        const home = homeUnitedState();
        setUnitedState(home);
        saveUnitedState("default", home);
        setHiddenPinId(null);
      }

      if (unlockStatus?.unlocked) setUnlocked(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayPins = useMemo(() => {
    if (!worldData) return [];
    return applyUnitedToPins(worldData.pins, unitedState);
  }, [worldData, unitedState]);

  const displayData = useMemo(() => {
    if (!worldData) return null;
    return { ...worldData, pins: displayPins };
  }, [worldData, displayPins]);

  const exploration = useMemo(() => {
    if (!displayData) return { explored: 0, total: 0 };
    return countExploredDiscoverable(displayData.pins, exploredIds);
  }, [displayData, exploredIds]);

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => window.setTimeout(resolve, ms));

  const issueCamera = (command: CameraCommandInput) => {
    setCameraCommand({ ...command, token: Date.now() } as CameraCommand);
  };

  /** Celebrate → color align → portal out west → pan east → portal in. */
  const runPortalCinematic = async () => {
    if (!worldData || hireBusy) return;
    const motion: HireMotion = "portal";
    const epoch = ++allianceEpoch.current;

    setHireBusy(true);
    setSelectedPin(null);
    setSelectedRealm(null);
    setEnterPinId(null);
    setEnterMotion(null);
    setHiddenPinId(null);

    const reduced = prefersReducedMotion();
    const westPin = worldData.pins.find((p) => p.id === ADVENTURER_PIN_ID);
    if (!westPin) {
      setHireBusy(false);
      return;
    }

    const celebrateMs = reduced ? 200 : 900;
    const alignMs = reduced ? 200 : 2800;
    const postBannerMs = reduced ? 120 : 1000;
    const focusMs = reduced ? 200 : 750;
    const exitMs = reduced ? 80 : 1100;
    const holdGoneMs = reduced ? 120 : 380;
    const panMs = reduced ? 320 : 1000;
    const panWaitMs = reduced ? 360 : 1150;
    const enterMs = reduced ? 120 : 950;
    const preCalendarMs = schedulingUrl ? (reduced ? 200 : 2000) : 0;
    // Arcs run from forge (align) through to calendar open, not gated on banner.
    const trailSpanMs =
      alignMs +
      postBannerMs +
      focusMs +
      exitMs +
      30 +
      holdGoneMs +
      60 +
      panWaitMs +
      enterMs +
      preCalendarMs;

    // 0) Confetti + parchment congrats; both isles lit as if hovered
    setUnitedState(homeUnitedState());
    setShowTransferTrails(false);
    setTrailSpanMs(trailSpanMs);
    setConfettiHeavy(true);
    setConfettiOn(true);
    setCongratsOpen(true);
    setRealmColorPhase("celebrate");
    soundFx.playSelectSound();
    await sleep(celebrateMs);

    // 1) Forge begins, color align + skill arcs start (banner still up)
    setRealmColorPhase("aligning");
    setShowTransferTrails(true);
    await sleep(alignMs);

    // 2) Banner clears; brief hold so arcs stay readable before portal
    setCongratsOpen(false);
    setRealmColorPhase("aligned");
    setAllianceForged(true);
    setConfettiOn(false);
    setConfettiHeavy(false);
    track(TRACK_EVENTS.allianceForge);
    await sleep(postBannerMs);

    // 3) Center on west pin, then portal out
    issueCamera({
      type: "focus-pin",
      pinId: ADVENTURER_PIN_ID,
      scale: 2.75,
      durationMs: 600,
    });
    await sleep(focusMs);

    setExitPinId(ADVENTURER_PIN_ID);
    setExitMotion(motion);
    soundFx.playSelectSound();
    await sleep(exitMs);

    setHiddenPinId(ADVENTURER_PIN_ID);
    await sleep(30);
    setExitPinId(null);
    setExitMotion(null);
    await sleep(holdGoneMs);

    // 4) Stage on east while still invisible
    const spawn = findAllianceSpawn(
      worldData.pins.filter((p) => p.realm === "company"),
    );
    const allied: UnitedPersist = {
      united: true,
      motion,
      migratedCoords: spawn,
      joinedAt: todayIsoDate(),
    };
    setUnitedState(allied);
    saveUnitedState(worldId, allied);
    await sleep(60);

    // 5) Camera pans to east pin (still hidden)
    issueCamera({
      type: "focus-pin",
      pinId: ADVENTURER_PIN_ID,
      scale: 2.75,
      durationMs: panMs,
    });
    await sleep(panWaitMs);

    // 6) Portal in
    setEnterPinId(ADVENTURER_PIN_ID);
    setEnterMotion(motion);
    setHiddenPinId(null);
    soundFx.playSelectSound();
    void fetch("/api/world/unite", { method: "POST" });

    await sleep(enterMs);
    setEnterPinId(null);
    setEnterMotion(null);
    setCameraCommand(null);

    if (schedulingUrl) {
      await sleep(2000);
      if (allianceEpoch.current === epoch) {
        setCalendarOpen(true);
        track(TRACK_EVENTS.calendarOpen, { source: "alliance_cinematic" });
      }
    }
    // Unlock only once the calendar is ready to appear (or skipped).
    if (allianceEpoch.current === epoch) {
      setHireBusy(false);
    }
  };

  const handleHire = () => {
    if (hireBusy) return;
    if (allianceForged) {
      if (schedulingUrl) {
        setCalendarOpen(true);
        track(TRACK_EVENTS.calendarOpen, { source: "forge_button" });
      }
      return;
    }
    void runPortalCinematic();
  };

  const unforgeAlliance = async () => {
    if (hireBusy || !allianceForged) return;
    track(TRACK_EVENTS.allianceUnforge);
    const motion: HireMotion = "portal";
    const epoch = ++allianceEpoch.current;

    setHireBusy(true);
    setCalendarOpen(false);
    setCongratsOpen(false);
    setConfettiOn(false);
    setConfettiHeavy(false);
    setSelectedPin(null);
    setSelectedRealm(null);

    const reduced = prefersReducedMotion();
    const focusMs = reduced ? 200 : 700;
    const exitMs = reduced ? 80 : 1100;
    const holdGoneMs = reduced ? 120 : 380;
    const panMs = reduced ? 320 : 1000;
    const panWaitMs = reduced ? 360 : 1150;
    const enterMs = reduced ? 120 : 950;
    const colorMs = reduced ? 200 : 2800;
    const retreatMs = reduced ? 200 : 1400;

    // 1) Focus east pin; start color revert + arrow retreat
    issueCamera({
      type: "focus-pin",
      pinId: ADVENTURER_PIN_ID,
      scale: 2.75,
      durationMs: 600,
    });
    setTrailsRetreating(true);
    setAllianceForged(false);
    setRealmColorPhase("reverting");
    soundFx.playSelectSound();
    await sleep(focusMs);
    if (allianceEpoch.current !== epoch) return;

    // 2) Portal out from guild shore
    setExitPinId(ADVENTURER_PIN_ID);
    setExitMotion(motion);
    soundFx.playSelectSound();
    await sleep(exitMs);
    if (allianceEpoch.current !== epoch) return;

    setHiddenPinId(ADVENTURER_PIN_ID);
    await sleep(30);
    setExitPinId(null);
    setExitMotion(null);
    await sleep(holdGoneMs);
    if (allianceEpoch.current !== epoch) return;

    // 3) Restore west placement while invisible
    const home = homeUnitedState();
    setUnitedState(home);
    saveUnitedState(worldId, home);
    await sleep(60);

    // 4) Camera back to west, then portal in
    issueCamera({
      type: "focus-pin",
      pinId: ADVENTURER_PIN_ID,
      scale: 2.75,
      durationMs: panMs,
    });
    await sleep(panWaitMs);
    if (allianceEpoch.current !== epoch) return;

    setEnterPinId(ADVENTURER_PIN_ID);
    setEnterMotion(motion);
    setHiddenPinId(null);
    soundFx.playSelectSound();
    await sleep(enterMs);
    if (allianceEpoch.current !== epoch) return;

    setEnterPinId(null);
    setEnterMotion(null);

    // Finish trail retreat / color morph if still running
    const elapsed =
      focusMs + exitMs + 30 + holdGoneMs + 60 + panWaitMs + enterMs;
    const trailRemain = Math.max(0, retreatMs - elapsed);
    if (trailRemain > 0) await sleep(trailRemain);
    setShowTransferTrails(false);
    setTrailsRetreating(false);

    const colorRemain = Math.max(0, colorMs - (elapsed + trailRemain));
    if (colorRemain > 0) await sleep(colorRemain);
    if (allianceEpoch.current !== epoch) return;

    setRealmColorPhase("idle");
    issueCamera({ type: "reset", durationMs: 500 });
    window.setTimeout(() => setCameraCommand(null), 520);
    setHireBusy(false);
  };

  const listPins = useMemo(() => {
    if (!displayData) return [];
    return filterVisiblePins(displayData.pins, revealedSecrets);
  }, [displayData, revealedSecrets]);

  const unlockEasterEgg = (
    source: "konami" | "map",
    pinId: string = EASTER_EGG_PIN_ID,
  ) => {
    if (!displayData) return;
    const pin = displayData.pins.find(
      (p) => p.id === pinId && isSecretPin(p),
    );
    if (!pin) return;

    const already = revealedSecrets.has(pin.id);
    setRevealedSecrets((prev) => revealSecret(worldId, pin.id, prev));

    if (!already) {
      track(TRACK_EVENTS.easterEggReveal, {
        pinId: pin.id,
        pinTitle: pin.title,
        source,
      });
      setSecretToast(
        source === "konami"
          ? "Konami accepted: a secret node shimmers into view."
          : pin.coordinates.y < 40
            ? "You noticed a faint glimmer on the northern ridge."
            : "A quiet shimmer answers from the southern shore.",
      );
      window.setTimeout(() => setSecretToast(null), 3200);
      setSpawnPinId(pin.id);
      window.setTimeout(() => setSpawnPinId(null), 900);
      setConfettiOn(true);
      window.setTimeout(() => setConfettiOn(false), 2200);
    }

    issueCamera({
      type: "focus-pin",
      pinId: pin.id,
      scale: 2.5,
      durationMs: 520,
    });
    window.setTimeout(() => setCameraCommand(null), 600);

    soundFx.playSelectSound();
    setSelectedRealm(null);
    setSelectedPin(pin);
  };

  useKonami(
    () => unlockEasterEgg("konami", EASTER_EGG_PIN_ID),
    Boolean(displayData) && !hireBusy,
  );

  const handleSelectPin = (pin: LorePin) => {
    if (placing || hireBusy) return;
    if (isSecretPin(pin) && !revealedSecrets.has(pin.id)) {
      unlockEasterEgg("map", pin.id);
      return;
    }
    soundFx.playSelectSound();
    setSelectedRealm(null);
    setSelectedPin(pin);
    setExploredIds((prev) => markPinExplored(worldId, pin, prev));
    track(TRACK_EVENTS.pinOpen, {
      pinId: pin.id,
      pinTitle: pin.title,
      realm: pin.realm,
    });
  };

  const handleSelectRealm = (realm: RealmSide) => {
    if (placing || hireBusy) return;
    soundFx.playHoverSound();
    setSelectedPin(null);
    setSelectedRealm(realm);
    track(TRACK_EVENTS.realmOpen, { realm });
  };

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleMusic = async () => {
    const enabled = await musicFx.toggle();
    setMusicOn(enabled);
  };

  const handlePlaceAttempt = (coords: { x: number; y: number }) => {
    if (!worldData) return;
    const guildPins = displayPins.filter((p) => p.realm === "company");
    const error = validateGuildPlacement(coords, guildPins, {
      checkSpacing: false,
    });
    if (error) {
      setPlaceHint(PLACEMENT_ERROR_MESSAGE[error]);
      soundFx.playHoverSound();
      return;
    }
    setPlaceHint(null);
    setPlacing(false);
    setDraft({
      coordinates: {
        x: Math.round(coords.x * 10) / 10,
        y: Math.round(coords.y * 10) / 10,
      },
    });
    soundFx.playSelectSound();
  };

  const handlePinCreated = async (pinId: string) => {
    try {
      await refreshWorld();
      setSpawnPinId(pinId);
      window.setTimeout(() => setSpawnPinId(null), 900);
      soundFx.playSelectSound();
    } catch (error) {
      console.error("Failed to refresh world after pin create:", error);
    }
  };

  if (!displayData) {
    return (
      <main className="realm-atmosphere relative flex h-dvh w-full items-center justify-center overflow-hidden">
        <LandscapeGate />
        <div
          id="landscape-gate-fallback"
          className="landscape-gate fixed inset-0 z-[100] flex-col items-center justify-center gap-5 px-8 text-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="landscape-gate-fallback-title"
        >
          <h2
            id="landscape-gate-fallback-title"
            className="font-display text-xl tracking-wide text-realm-silver"
          >
            Rotate to explore
          </h2>
          <p className="max-w-[18rem] text-sm leading-relaxed text-realm-mist/85">
            This realm is built for landscape. Turn your device sideways to chart
            the map.
          </p>
        </div>
        <p className="font-display text-sm tracking-[0.2em] text-realm-mist/80 uppercase">
          Charting the realm…
        </p>
      </main>
    );
  }

  return (
    <main
      className={`realm-atmosphere relative h-dvh w-full overflow-hidden ${
        unitedState.united || allianceForged ? "realm-united" : ""
      } ${
        realmColorPhase === "aligning"
          ? "realm-color-aligning"
          : realmColorPhase === "aligned"
            ? "realm-color-aligned"
            : realmColorPhase === "celebrate"
              ? "realm-color-celebrate"
              : realmColorPhase === "reverting"
                ? "realm-color-reverting"
                : ""
      }`}
      aria-busy={hireBusy || undefined}
    >
      <LandscapeGate />
      <div
        id="landscape-gate-fallback"
        className="landscape-gate fixed inset-0 z-[100] flex-col items-center justify-center gap-5 px-8 text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="landscape-gate-fallback-title"
      >
        <h2
          id="landscape-gate-fallback-title"
          className="font-display text-xl tracking-wide text-realm-silver"
        >
          Rotate to explore
        </h2>
        <p className="max-w-[18rem] text-sm leading-relaxed text-realm-mist/85">
          This realm is built for landscape. Turn your device sideways to chart
          the map.
        </p>
      </div>
      <div id="realm-app" className="contents">
      <DesktopHint />
      {hireBusy && (
        <div
          className="fixed inset-0 z-[70]"
          style={{ touchAction: "none", cursor: "wait" }}
          aria-hidden
        />
      )}
      <div className="pointer-events-none absolute z-30 hud-safe-tl">
        <div className="pointer-events-auto">
          <CommandPalette
            pins={listPins}
            onSelectPin={handleSelectPin}
            onOpen={() => track(TRACK_EVENTS.searchOpen)}
            realmLabels={displayData.realmLabels}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 hud-safe-tc">
        <div className="pointer-events-auto flex items-center gap-2">
          {!allianceForged ? (
            <button
              type="button"
              onClick={handleHire}
              disabled={hireBusy}
              className="glass-panel glass-btn hud-compact-pill flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold tracking-wide text-realm-mist hover:text-realm-silver disabled:opacity-50"
              title="Forge alliance"
            >
              <Sparkles className="h-4 w-4 text-amber-200/90" />
              <span className="hud-pill-label">
                {hireBusy ? "Crossing…" : "Forge Alliance"}
              </span>
            </button>
          ) : (
            <>
              {schedulingUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setCalendarOpen(true);
                    track(TRACK_EVENTS.calendarOpen, { source: "hud" });
                  }}
                  disabled={hireBusy}
                  className="glass-panel glass-btn hud-compact-pill flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold tracking-wide text-realm-mist hover:text-realm-silver disabled:opacity-50"
                  title="Chart a meeting"
                >
                  <CalendarDays className="h-4 w-4 text-amber-200/90" />
                  <span className="hud-pill-label">Chart a meeting</span>
                </button>
              ) : (
                <div className="glass-panel hud-compact-pill flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold tracking-wide text-realm-mist">
                  <Sparkles className="h-4 w-4 text-teal-300" />
                  <span className="hud-pill-label">Alliance Forged</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => void unforgeAlliance()}
                disabled={hireBusy}
                className="glass-panel glass-btn hud-compact-icon rounded-full p-2.5 text-realm-mist hover:text-realm-silver disabled:opacity-50"
                title="Unforge alliance"
                aria-label="Unforge alliance"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute z-30 hud-safe-tr">
        <div className="glass-panel pointer-events-auto hidden items-center gap-2.5 rounded-full px-3.5 py-2 text-xs text-realm-mist sm:flex">
          <span
            className={`h-2 w-2 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.8)] animate-pulse ${
              allianceForged ? "bg-teal-300" : "bg-violet-300"
            }`}
          />
          <span className="font-semibold tracking-wide text-realm-silver">
            {allianceForged
              ? `${displayData.companyName} · Allied`
              : displayData.companyName}
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute z-30 hud-safe-bl">
        <div className="pointer-events-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={handleToggleMute}
            className="glass-panel glass-btn hud-compact-icon rounded-full p-2.5 text-realm-mist hover:text-realm-silver"
            title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => void handleToggleMusic()}
            className="glass-panel glass-btn hud-compact-icon rounded-full p-2.5 text-realm-mist hover:text-realm-silver"
            title={musicOn ? "Mute music" : "Play music"}
          >
            {musicOn ? (
              <Music2 className="h-4 w-4" />
            ) : (
              <Music className="h-4 w-4 opacity-50" />
            )}
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 z-30 w-[min(100%-2rem,280px)] -translate-x-1/2 hud-safe-bc">
        <ExplorationProgress
          explored={exploration.explored}
          total={exploration.total}
          onClear={() => {
            clearExploredPinIds(worldId);
            clearRevealedSecrets(worldId);
            setExploredIds(new Set());
            setRevealedSecrets(new Set());
            setSelectedPin((prev) =>
              prev && isSecretPin(prev) ? null : prev,
            );
            soundFx.playSelectSound();
          }}
        />
      </div>

      <MapCanvas
        data={displayData}
        selectedPinId={selectedPin?.id || null}
        onSelectPin={handleSelectPin}
        selectedRealm={selectedRealm}
        onSelectRealm={handleSelectRealm}
        mapImageUrl="/maps/realm-map.png"
        placementMode={placing}
        onPlaceAttempt={handlePlaceAttempt}
        spawnPinId={spawnPinId}
        united={unitedState.united}
        exitPinId={exitPinId}
        exitMotion={exitMotion}
        enterPinId={enterPinId}
        enterMotion={enterMotion}
        hireBusy={hireBusy}
        hiddenPinId={hiddenPinId}
        cameraCommand={cameraCommand}
        revealedSecretIds={revealedSecrets}
        exploredPinIds={exploredIds}
        realmColorPhase={
          allianceForged && realmColorPhase === "idle"
            ? "aligned"
            : realmColorPhase
        }
        showTransferTrails={showTransferTrails}
        trailsRetreating={trailsRetreating}
        trailSpanMs={trailSpanMs}
      />

      <GuildChartControls
        unlocked={unlocked}
        onUnlocked={() => setUnlocked(true)}
        placing={placing}
        onStartPlace={() => {
          setSelectedPin(null);
          setSelectedRealm(null);
          setPlaceHint(null);
          setPlacing(true);
        }}
        onCancelPlace={() => {
          setPlacing(false);
          setPlaceHint(null);
        }}
        draft={draft}
        onClearDraft={() => setDraft(null)}
        onPinCreated={(pinId) => void handlePinCreated(pinId)}
        placeHint={placeHint}
        guildCharacters={listPins.filter(
          (p) => p.realm === "company" && p.category === "character",
        )}
      />

      <RealmOverview
        realm={selectedRealm}
        data={{ ...displayData, pins: listPins }}
        onClose={() => setSelectedRealm(null)}
        onSelectPin={handleSelectPin}
      />

      <LoreDrawer
        pin={selectedPin}
        pins={listPins}
        onClose={() => setSelectedPin(null)}
        onHire={handleHire}
        onOpenCalendar={() => {
          setCalendarOpen(true);
          track(TRACK_EVENTS.calendarOpen, { source: "lore_drawer" });
        }}
      />

      <CalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        schedulingUrl={schedulingUrl}
      />

      <SecretToast message={secretToast} />

      <AllianceCongrats
        open={congratsOpen}
        companyName={displayData.companyName}
      />

      <Confetti
        active={confettiOn}
        durationMs={confettiHeavy ? 6500 : 3200}
        intensity={confettiHeavy ? "heavy" : "normal"}
      />
      </div>
    </main>
  );
}
