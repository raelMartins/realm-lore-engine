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
  type HireMotion,
  type UnitedPersist,
} from "@/lib/hire";
import { SecretToast } from "@/components/SecretToast";
import { useKonami } from "@/lib/useKonami";
import {
  EASTER_EGG_PIN_ID,
  filterVisiblePins,
  loadRevealedSecrets,
  revealSecret,
  isSecretPin,
} from "@/lib/secrets";
import type { RealmColorPhase } from "@/components/RealmHitLayer";
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
    let cancelled = false;

    async function load() {
      try {
        const { data, worldId: id } = await refreshWorld();
        if (cancelled) return;
        setWorldData(data);
        setWorldId(id);
        setExploredIds(loadExploredPinIds(id));
        setRevealedSecrets(loadRevealedSecrets(id));
        // Adventurer always homes on the west isle; clear any stale east visit.
        const home = homeUnitedState();
        setUnitedState(home);
        saveUnitedState(id, home);
        setHiddenPinId(null);
      } catch (error) {
        console.error("Failed to load /api/world, using local fallback:", error);
        if (!cancelled) {
          setWorldData(getCompanyData());
          setExploredIds(loadExploredPinIds("default"));
          setRevealedSecrets(loadRevealedSecrets("default"));
          const home = homeUnitedState();
          setUnitedState(home);
          saveUnitedState("default", home);
          setHiddenPinId(null);
        }
      }

      try {
        const unlockRes = await fetch("/api/guild/unlock");
        if (unlockRes.ok) {
          const status = (await unlockRes.json()) as { unlocked?: boolean };
          if (!cancelled && status.unlocked) setUnlocked(true);
        }
      } catch {
        /* explore-only if unlock status fails */
      }
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

    const celebrateMs = reduced ? 400 : 2600;
    const alignMs = reduced ? 200 : 3000;
    const focusMs = reduced ? 200 : 750;
    const exitMs = reduced ? 80 : 1100;
    const holdGoneMs = reduced ? 120 : 380;
    const panMs = reduced ? 320 : 1000;
    const panWaitMs = reduced ? 360 : 1150;
    const enterMs = reduced ? 120 : 950;

    // 0) Confetti + parchment congrats; both isles lit as if hovered
    setUnitedState(homeUnitedState());
    setConfettiHeavy(true);
    setConfettiOn(true);
    setCongratsOpen(true);
    setRealmColorPhase("celebrate");
    soundFx.playSelectSound();
    await sleep(celebrateMs);

    // 1) Adventurer isle slowly takes on guild colors
    setRealmColorPhase("aligning");
    await sleep(alignMs);

    // 2) Banner clears; colors stay aligned
    setCongratsOpen(false);
    setRealmColorPhase("aligned");
    setAllianceForged(true);
    setConfettiOn(false);
    setConfettiHeavy(false);
    await sleep(reduced ? 120 : 450);

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
    setUnitedState({
      united: true,
      motion,
      migratedCoords: spawn,
    });
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
    setHireBusy(false);

    if (schedulingUrl) {
      await sleep(2000);
      if (allianceEpoch.current === epoch) {
        setCalendarOpen(true);
      }
    }
  };

  const handleHire = () => {
    if (hireBusy) return;
    if (allianceForged) {
      if (schedulingUrl) setCalendarOpen(true);
      return;
    }
    void runPortalCinematic();
  };

  const unforgeAlliance = async () => {
    if (hireBusy) return;
    allianceEpoch.current += 1;
    setCalendarOpen(false);
    setCongratsOpen(false);
    setConfettiOn(false);
    setConfettiHeavy(false);
    setAllianceForged(false);
    setRealmColorPhase("idle");
    setExitPinId(null);
    setExitMotion(null);
    setEnterPinId(null);
    setEnterMotion(null);
    setHiddenPinId(ADVENTURER_PIN_ID);
    const home = homeUnitedState();
    setUnitedState(home);
    saveUnitedState(worldId, home);
    await sleep(40);
    setHiddenPinId(null);
    issueCamera({ type: "reset", durationMs: 500 });
    window.setTimeout(() => setCameraCommand(null), 520);
    soundFx.playSelectSound();
  };

  const listPins = useMemo(() => {
    if (!displayData) return [];
    return filterVisiblePins(displayData.pins, revealedSecrets);
  }, [displayData, revealedSecrets]);

  const unlockEasterEgg = (source: "konami" | "map") => {
    if (!displayData) return;
    const pin = displayData.pins.find((p) => p.id === EASTER_EGG_PIN_ID);
    if (!pin) return;

    const already = revealedSecrets.has(EASTER_EGG_PIN_ID);
    setRevealedSecrets((prev) =>
      revealSecret(worldId, EASTER_EGG_PIN_ID, prev),
    );

    if (!already) {
      setSecretToast(
        source === "konami"
          ? "Konami accepted — a secret node shimmers into view."
          : "You noticed a faint glimmer on the northern ridge.",
      );
      window.setTimeout(() => setSecretToast(null), 3200);
      setSpawnPinId(EASTER_EGG_PIN_ID);
      window.setTimeout(() => setSpawnPinId(null), 900);
      setConfettiOn(true);
      window.setTimeout(() => setConfettiOn(false), 2200);
    }

    issueCamera({
      type: "focus-pin",
      pinId: EASTER_EGG_PIN_ID,
      scale: 2.5,
      durationMs: 520,
    });
    window.setTimeout(() => setCameraCommand(null), 600);

    soundFx.playSelectSound();
    setSelectedRealm(null);
    setSelectedPin(pin);
  };

  useKonami(() => unlockEasterEgg("konami"), Boolean(displayData) && !hireBusy);

  const handleSelectPin = (pin: LorePin) => {
    if (placing || hireBusy) return;
    if (isSecretPin(pin) && !revealedSecrets.has(pin.id)) {
      unlockEasterEgg("map");
      return;
    }
    soundFx.playSelectSound();
    setSelectedRealm(null);
    setSelectedPin(pin);
    setExploredIds((prev) => markPinExplored(worldId, pin, prev));
  };

  const handleSelectRealm = (realm: RealmSide) => {
    if (placing || hireBusy) return;
    soundFx.playHoverSound();
    setSelectedPin(null);
    setSelectedRealm(realm);
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
    const error = validateGuildPlacement(coords, guildPins);
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
      <main className="realm-atmosphere relative flex h-screen w-full items-center justify-center overflow-hidden">
        <p className="font-display text-sm tracking-[0.2em] text-realm-mist/80 uppercase">
          Charting the realm…
        </p>
      </main>
    );
  }

  return (
    <main
      className={`realm-atmosphere relative h-screen w-full overflow-hidden ${
        unitedState.united ? "realm-united" : ""
      }`}
    >
      <div className="pointer-events-none absolute top-6 left-6 z-30">
        <div className="pointer-events-auto">
          <CommandPalette
            pins={listPins}
            onSelectPin={handleSelectPin}
            realmLabels={displayData.realmLabels}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute top-5 left-1/2 z-30 -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-2">
          {!allianceForged ? (
            <button
              type="button"
              onClick={handleHire}
              disabled={hireBusy}
              className="glass-panel glass-btn flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold tracking-wide text-realm-mist hover:text-realm-silver disabled:opacity-50"
              title="Forge alliance"
            >
              <Sparkles className="h-4 w-4 text-amber-200/90" />
              {hireBusy ? "Crossing…" : "Forge Alliance"}
            </button>
          ) : (
            <>
              {schedulingUrl ? (
                <button
                  type="button"
                  onClick={() => setCalendarOpen(true)}
                  disabled={hireBusy}
                  className="glass-panel glass-btn flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold tracking-wide text-realm-mist hover:text-realm-silver disabled:opacity-50"
                  title="Chart a meeting"
                >
                  <CalendarDays className="h-4 w-4 text-amber-200/90" />
                  Chart a meeting
                </button>
              ) : (
                <div className="glass-panel flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold tracking-wide text-realm-mist">
                  <Sparkles className="h-4 w-4 text-teal-300" />
                  Alliance Forged
                </div>
              )}
              <button
                type="button"
                onClick={() => void unforgeAlliance()}
                disabled={hireBusy}
                className="glass-panel glass-btn rounded-full p-2.5 text-realm-mist hover:text-realm-silver disabled:opacity-50"
                title="Unforge alliance"
                aria-label="Unforge alliance"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute top-6 right-6 z-30">
        <div className="glass-panel pointer-events-auto hidden items-center gap-2.5 rounded-full px-3.5 py-2 text-xs text-realm-mist sm:flex">
          <span
            className={`h-2 w-2 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.8)] animate-pulse ${
              allianceForged ? "bg-teal-300" : "bg-amber-300"
            }`}
          />
          <span className="font-semibold tracking-wide text-realm-silver">
            {allianceForged
              ? `${displayData.companyName} · Allied`
              : displayData.companyName}
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-6 z-30">
        <div className="pointer-events-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={handleToggleMute}
            className="glass-panel glass-btn rounded-full p-2.5 text-realm-mist hover:text-realm-silver"
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
            className="glass-panel glass-btn rounded-full p-2.5 text-realm-mist hover:text-realm-silver"
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

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 w-[min(100%-2rem,280px)] -translate-x-1/2">
        <ExplorationProgress
          explored={exploration.explored}
          total={exploration.total}
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
        realmColorPhase={
          allianceForged && realmColorPhase === "idle"
            ? "aligned"
            : realmColorPhase
        }
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
      />

      <RealmOverview
        realm={selectedRealm}
        data={{ ...displayData, pins: listPins }}
        onClose={() => setSelectedRealm(null)}
        onSelectPin={handleSelectPin}
      />

      <LoreDrawer
        pin={selectedPin}
        onClose={() => setSelectedPin(null)}
        onHire={handleHire}
        onOpenCalendar={() => setCalendarOpen(true)}
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
        durationMs={confettiHeavy ? 5200 : 3200}
        intensity={confettiHeavy ? "heavy" : "normal"}
      />
    </main>
  );
}
