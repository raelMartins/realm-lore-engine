"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LorePin, RealmSide } from "@/types/world";
import { Search, MapPin, X, CornerDownLeft } from "lucide-react";

interface CommandPaletteProps {
  pins: LorePin[];
  onSelectPin: (pin: LorePin) => void;
  onOpen?: () => void;
  realmLabels?: {
    adventurer?: string;
    company?: string;
  };
  /** Icon-only trigger for the bottom dock. */
  variant?: "pill" | "icon";
  className?: string;
  disabled?: boolean;
}

const DEFAULT_LABELS: Record<RealmSide, string> = {
  adventurer: "Adventurer's Reach",
  company: "Guild Shore",
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  pins,
  onSelectPin,
  onOpen,
  realmLabels,
  variant = "pill",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => {
          const next = !prev;
          if (next) onOpen?.();
          return next;
        });
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);

  const close = () => {
    setIsOpen(false);
    setQuery("");
  };

  const open = () => {
    if (disabled) return;
    onOpen?.();
    setIsOpen(true);
  };

  const filteredPins =
    query === ""
      ? pins
      : pins.filter((pin) => {
          const searchText =
            `${pin.title} ${pin.subtitle} ${pin.realm} ${pin.content.tags?.join(" ") || ""}`.toLowerCase();
          return searchText.includes(query.toLowerCase());
        });

  const grouped: { realm: RealmSide; label: string; pins: LorePin[] }[] = (
    ["adventurer", "company"] as RealmSide[]
  )
    .map((realm) => ({
      realm,
      label: realmLabels?.[realm] || DEFAULT_LABELS[realm],
      pins: filteredPins.filter((p) => p.realm === realm),
    }))
    .filter((g) => g.pins.length > 0);

  const trigger =
    variant === "icon" ? (
      <button
        type="button"
        disabled={disabled}
        onClick={open}
        title="Search map lore (⌘K)"
        aria-label="Search map lore"
        className={`pointer-events-auto glass-btn flex h-9 w-9 items-center justify-center rounded-full text-realm-mist hover:text-realm-silver disabled:opacity-40 ${className}`}
      >
        <Search className="h-4 w-4" />
      </button>
    ) : (
      <button
        type="button"
        disabled={disabled}
        onClick={open}
        className={`glass-panel flex items-center gap-3 rounded-full px-4 py-2.5 text-xs text-realm-silver-muted transition-all hover:border-realm-teal/40 hover:text-realm-silver group disabled:opacity-40 ${className}`}
      >
        <Search className="h-4 w-4 text-realm-teal" />
        <span className="font-medium">Search map lore & nodes...</span>
        <kbd className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-realm-mist">
          ⌘K
        </kbd>
      </button>
    );

  const dialog =
    isOpen && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-start justify-center bg-[#040a0e]/70 p-4 pt-20 backdrop-blur-md"
            role="presentation"
            onClick={close}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Search map lore"
              className="glass-panel-strong w-full max-w-lg overflow-hidden rounded-3xl border-white/15 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
                <Search className="h-5 w-5 shrink-0 text-realm-teal" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a topic, skill, or node title..."
                  className="w-full bg-transparent text-sm text-realm-silver placeholder:text-realm-silver-muted/70 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={close}
                  className="glass-btn rounded-full p-2 text-realm-silver-muted hover:text-realm-silver"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="glass-scroll max-h-80 overflow-y-auto p-2">
                {grouped.length === 0 ? (
                  <p className="py-8 text-center text-xs text-realm-silver-muted">
                    No matching lore nodes found.
                  </p>
                ) : (
                  grouped.map((group) => (
                    <div key={group.realm} className="mb-2">
                      <p
                        className={`px-3 py-2 font-display text-[10px] font-semibold uppercase tracking-[0.14em] ${
                          group.realm === "adventurer"
                            ? "text-[color:var(--pin-west-stroke)]"
                            : "text-realm-teal-soft"
                        }`}
                      >
                        {group.label}
                      </p>
                      {group.pins.map((pin) => (
                        <button
                          key={pin.id}
                          type="button"
                          onClick={() => {
                            onSelectPin(pin);
                            close();
                          }}
                          className={`group flex w-full items-start gap-3 rounded-2xl border border-transparent p-3 text-left transition-all hover:bg-white/5 ${
                            pin.realm === "adventurer"
                              ? "hover:border-[color:color-mix(in_srgb,var(--pin-west-stroke)_30%,transparent)]"
                              : "hover:border-realm-teal/25"
                          }`}
                        >
                          <div
                            className={`glass-btn rounded-2xl p-2.5 transition-colors ${
                              pin.realm === "adventurer"
                                ? "text-[color:var(--pin-west-fill)] group-hover:border-[color:color-mix(in_srgb,var(--pin-west-stroke)_40%,transparent)]"
                                : "text-realm-teal group-hover:border-realm-teal/40 group-hover:text-realm-teal-soft"
                            }`}
                          >
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-realm-silver">
                              {pin.title}
                            </p>
                            <p className="mt-0.5 text-xs text-realm-silver-muted">
                              {pin.subtitle}
                            </p>
                          </div>
                          <CornerDownLeft className="mt-1 h-3.5 w-3.5 shrink-0 text-realm-silver-muted opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {trigger}
      {dialog}
    </>
  );
};
