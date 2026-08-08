"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LorePin } from "@/types/world";
import { X, ExternalLink, Mail, Sparkles } from "lucide-react";
import * as Icons from "lucide-react";

interface LoreDrawerProps {
  pin: LorePin | null;
  onClose: () => void;
}

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

export const LoreDrawer: React.FC<LoreDrawerProps> = ({ pin, onClose }) => {
  return (
    <AnimatePresence>
      {pin && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[#040a0e]/55 backdrop-blur-sm md:bg-[#040a0e]/25"
          />

          <motion.aside
            initial={{ x: "100%", opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.6 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="glass-panel-strong fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col justify-between overflow-y-auto rounded-l-[1.75rem] border-l border-white/15 p-7 text-realm-silver"
          >
            <div>
              <div className="mb-7 flex items-center justify-between border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                  <span className="glass-btn flex h-10 w-10 items-center justify-center rounded-2xl text-realm-teal">
                    <DynamicIcon name={pin.iconName} className="h-5 w-5" />
                  </span>
                  <span className="pill text-[10px] uppercase tracking-[0.14em] text-realm-teal-soft">
                    {pin.content.badge || pin.category}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="glass-btn rounded-full p-2.5 text-realm-silver-muted hover:text-realm-silver"
                  aria-label="Close lore drawer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h2 className="font-display text-3xl font-semibold leading-snug tracking-wide text-realm-silver">
                {pin.title}
              </h2>
              <p className="mt-2 text-sm font-medium tracking-wide text-realm-silver-muted">
                {pin.subtitle}
              </p>

              <div className="glass-panel mt-6 rounded-2xl p-4 text-sm leading-relaxed text-realm-mist">
                {pin.content.description}
              </div>

              {pin.content.stats && pin.content.stats.length > 0 && (
                <div className="mt-7">
                  <h3 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-realm-teal-soft">
                    <Sparkles className="h-3.5 w-3.5" />
                    Attributes & Proficiency
                  </h3>
                  <div className="space-y-4">
                    {pin.content.stats.map((stat, index) => (
                      <div key={stat.label}>
                        <div className="mb-1.5 flex items-baseline justify-between">
                          <span className="text-sm text-realm-mist">
                            {stat.label}
                          </span>
                          <span className="font-mono text-xs font-semibold text-realm-teal-soft">
                            {stat.value}
                            <span className="text-realm-silver-muted">%</span>
                          </span>
                        </div>
                        <div className="stat-track">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.value}%` }}
                            transition={{
                              duration: 0.9,
                              delay: index * 0.06,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="stat-fill"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pin.content.tags && pin.content.tags.length > 0 && (
                <div className="mt-7">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-realm-silver-muted">
                    Key Tech & Concepts
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {pin.content.tags.map((tag) => (
                      <span key={tag} className="pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
              {pin.content.externalLink && (
                <a
                  href={pin.content.externalLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-btn flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-realm-silver"
                >
                  <ExternalLink className="h-4 w-4 text-realm-teal" />
                  {pin.content.externalLink.label}
                </a>
              )}

              {pin.content.callToAction && (
                <a
                  href={pin.content.callToAction.target}
                  className="btn-primary flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold"
                >
                  <Mail className="h-4 w-4" />
                  {pin.content.callToAction.label}
                </a>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
