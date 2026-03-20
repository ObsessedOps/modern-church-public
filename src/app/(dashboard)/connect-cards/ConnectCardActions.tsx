"use client";

import { ClipboardCopy, ExternalLink } from "lucide-react";
import { useToastStore } from "@/stores/toast";

export function ConnectCardActions({ connectUrl }: { connectUrl: string }) {
  const add = useToastStore((s) => s.add);

  function copyLink() {
    const fullUrl = `${window.location.origin}${connectUrl}`;
    navigator.clipboard.writeText(fullUrl);
    add("success", "Link copied to clipboard!");
  }

  function openPreview() {
    window.open(connectUrl, "_blank");
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-dark-500 dark:text-dark-200 dark:hover:bg-dark-700"
      >
        <ClipboardCopy className="h-3.5 w-3.5" />
        Copy Link
      </button>
      <button
        onClick={openPreview}
        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Preview
      </button>
    </div>
  );
}
