"use client";

import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-dark-50">
          Something went wrong
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <button onClick={reset} className="btn btn-primary">
        Try again
      </button>
    </div>
  );
}
