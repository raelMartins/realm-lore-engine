"use client";

import React, { useEffect, useState } from "react";
import { LorePin } from "@/types/world";
import { Search, MapPin, X, CornerDownLeft } from "lucide-react";

interface CommandPaletteProps {
  pins: LorePin[];
  onSelectPin: (pin: LorePin) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  pins,
  onSelectPin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredPins =
    query === ""
      ? pins
      : pins.filter((pin) => {
          const searchText =
            `${pin.title} ${pin.subtitle} ${pin.content.tags?.join(" ") || ""}`.toLowerCase();
          return searchText.includes(query.toLowerCase());
        });

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="glass-panel absolute top-6 left-6 z-20 flex items-center gap-3 rounded-full px-4 py-2.5 text-xs text-realm-silver-muted transition-all hover:border-realm-teal/40 hover:text-realm-silver group"
      >
        <Search className="h-4 w-4 text-realm-teal" />
        <span className="font-medium">Search map lore & nodes...</span>
        <kbd className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-realm-mist">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#040a0e]/70 p-4 pt-20 backdrop-blur-md">
      <div className="glass-panel-strong w-full max-w-lg overflow-hidden rounded-3xl border-white/15 shadow-2xl">
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
            onClick={() => setIsOpen(false)}
            className="glass-btn rounded-full p-2 text-realm-silver-muted hover:text-realm-silver"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filteredPins.length === 0 ? (
            <p className="py-8 text-center text-xs text-realm-silver-muted">
              No matching lore nodes found.
            </p>
          ) : (
            filteredPins.map((pin) => (
              <button
                key={pin.id}
                type="button"
                onClick={() => {
                  onSelectPin(pin);
                  setIsOpen(false);
                  setQuery("");
                }}
                className="group flex w-full items-start gap-3 rounded-2xl border border-transparent p-3 text-left transition-all hover:border-realm-teal/25 hover:bg-white/5"
              >
                <div className="glass-btn rounded-2xl p-2.5 text-realm-teal transition-colors group-hover:border-realm-teal/40 group-hover:text-realm-teal-soft">
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};
