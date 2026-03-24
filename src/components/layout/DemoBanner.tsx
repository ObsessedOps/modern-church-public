"use client";

import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { InterestModal } from "@/components/layout/InterestModal";

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <div className="relative w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-4 py-3 text-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-bold tracking-wide">
              Your data has always been there.
            </p>
            <p className="text-xs text-white/80">
              Modern.Church connects your platforms and surfaces what matters — in language your whole team can act on.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="flex shrink-0 items-center gap-1 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-50"
            >
              I&apos;m Interested
              <ArrowRight className="h-3 w-3" />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Dismiss banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <InterestModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
