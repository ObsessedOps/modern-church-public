"use client";

import { useEffect, useState } from "react";
import { X, Keyboard } from "lucide-react";

const shortcuts = [
  { keys: ["⌘", "K"], description: "Open Grace AI" },
  { keys: ["/"], description: "Global search" },
  { keys: ["?"], description: "Keyboard shortcuts" },
  { keys: ["Esc"], description: "Close panel / drawer" },
];

const navigationShortcuts = [
  { keys: ["G", "D"], description: "Go to Command Center" },
  { keys: ["G", "M"], description: "Go to Members" },
  { keys: ["G", "G"], description: "Go to Groups" },
  { keys: ["G", "V"], description: "Go to Visitors" },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (
        e.key === "?" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-dark-600 dark:bg-dark-800">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary-600" />
            <h2 className="text-base font-semibold text-slate-800 dark:text-dark-100">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-dark-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-dark-300">
              General
            </h3>
            <div className="space-y-2">
              {shortcuts.map((s) => (
                <div key={s.description} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-dark-200">{s.description}</span>
                  <div className="flex gap-1">
                    {s.keys.map((key) => (
                      <kbd
                        key={key}
                        className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-slate-600 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-200"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-dark-300">
              Navigation
            </h3>
            <div className="space-y-2">
              {navigationShortcuts.map((s) => (
                <div key={s.description} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-dark-200">{s.description}</span>
                  <div className="flex gap-1">
                    {s.keys.map((key, i) => (
                      <kbd
                        key={`${key}-${i}`}
                        className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-slate-600 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-200"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-slate-400 dark:text-dark-400">
          Press <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono text-[10px] dark:border-dark-600 dark:bg-dark-700">?</kbd> to toggle this dialog
        </p>
      </div>
    </>
  );
}
