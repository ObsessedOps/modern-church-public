"use client";

import { Mail, MessageSquare } from "lucide-react";
import { useComposeStore } from "@/stores/compose";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
  name: string;
  email?: string | null;
  phone?: string | null;
  context?: string;
  size?: "sm" | "md";
}

export function MessageActions({ name, email, phone, context, size = "sm" }: MessageActionsProps) {
  const { openEmail, openSms } = useComposeStore();

  const btnClass = cn(
    "rounded-lg transition-colors",
    size === "sm"
      ? "p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-dark-700 dark:hover:text-blue-400"
      : "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-700"
  );

  return (
    <div className="flex items-center gap-0.5">
      {email && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openEmail({ name, email, context });
          }}
          title={`Email ${name}`}
          className={btnClass}
        >
          <Mail className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          {size === "md" && <span>Email</span>}
        </button>
      )}
      {phone && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openSms({ name, phone, context });
          }}
          title={`Text ${name}`}
          className={btnClass}
        >
          <MessageSquare className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          {size === "md" && <span>Text</span>}
        </button>
      )}
    </div>
  );
}
