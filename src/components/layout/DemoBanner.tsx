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
      <div className="flex w-full items-center justify-center gap-3 bg-violet-600 px-4 py-1.5 text-sm text-white">
        <span className="text-center text-xs">
          <strong>Live Demo</strong> — Exploring Modern.Church with sample data
        </span>
        <button
          onClick={() => setModalOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-violet-600 transition-colors hover:bg-violet-50"
        >
          I&apos;m Interested
          <ArrowRight className="h-3 w-3" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-0.5 transition-colors hover:bg-violet-500"
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <InterestModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
