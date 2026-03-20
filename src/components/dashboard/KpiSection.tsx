"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Settings2, Check } from "lucide-react";
import { useKpiCardsStore, ALL_KPI_CARDS, type KpiCardId } from "@/stores/kpi-cards";

interface KpiSectionProps {
  /** Map of card label → rendered ReactNode (already permission-gated by server) */
  cards: { id: KpiCardId; node: ReactNode }[];
}

export function KpiSection({ cards }: KpiSectionProps) {
  const { visible, toggle } = useKpiCardsStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const visibleCards = cards.filter((c) => visible.includes(c.id));

  return (
    <div>
      {/* Section header with customize button */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-dark-300">
          Key Metrics
        </h2>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-700"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>Customize</span>
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg dark:border-dark-600 dark:bg-dark-800">
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-400">
                Show / Hide Cards
              </p>
              {ALL_KPI_CARDS.map((id) => {
                const available = cards.some((c) => c.id === id);
                const checked = visible.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => available && toggle(id)}
                    disabled={!available}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                      available
                        ? "text-slate-700 hover:bg-slate-50 dark:text-dark-200 dark:hover:bg-dark-700"
                        : "cursor-not-allowed text-slate-300 dark:text-dark-500"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked && available
                          ? "border-violet-500 bg-violet-500 text-white"
                          : "border-slate-300 dark:border-dark-500"
                      }`}
                    >
                      {checked && available && <Check className="h-3 w-3" />}
                    </span>
                    <span>{id}</span>
                    {!available && (
                      <span className="ml-auto text-[10px] text-slate-400 dark:text-dark-400">
                        No access
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* KPI card grid */}
      {visibleCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {visibleCards.map((c) => (
            <div key={c.id}>{c.node}</div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-400 dark:border-dark-600 dark:text-dark-400">
          No cards selected. Click <strong>Customize</strong> to add metrics.
        </div>
      )}
    </div>
  );
}
