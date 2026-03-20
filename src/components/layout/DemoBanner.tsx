"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex w-full items-center justify-center gap-3 bg-violet-600 px-4 py-2 text-sm text-white">
      <span className="text-center">
        <strong>Live Demo</strong> — This is a public demo of Modern.Church with synthetic data.{" "}
        <a
          href="https://modern.church"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-violet-100"
        >
          Request Access
        </a>
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 transition-colors hover:bg-violet-500"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
