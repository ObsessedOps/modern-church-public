"use client";

import { useState } from "react";
import { Users, ChevronDown, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoRoleSwitcherProps {
  roles: Record<string, string>; // { SENIOR_PASTOR: "Lead Pastor", ... }
  activeRole: string; // current demo role key or ""
  activeRoleLabel: string; // human-readable label or ""
}

export function DemoRoleSwitcher({ roles, activeRole, activeRoleLabel }: DemoRoleSwitcherProps) {
  const [open, setOpen] = useState(false);

  function switchRole(roleKey: string) {
    // Set cookie and reload to apply new permissions from server
    if (roleKey === activeRole) return;
    document.cookie = roleKey
      ? `demo_role=${roleKey}; path=/; max-age=86400; SameSite=Lax`
      : "demo_role=; path=/; max-age=0";
    window.location.href = "/";
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
          activeRole
            ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
            : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-dark-500 dark:text-dark-200 dark:hover:border-dark-400"
        )}
      >
        <Users className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">
          {activeRoleLabel || "Switch Role"}
        </span>
        <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-dark-600 dark:bg-dark-800">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-400">
              Demo Role Switcher
            </div>

            {/* Reset to real role */}
            <button
              onClick={() => switchRole("")}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                !activeRole
                  ? "bg-violet-50 font-medium text-violet-600 dark:bg-violet-600/10 dark:text-violet-400"
                  : "text-slate-600 hover:bg-slate-50 dark:text-dark-200 dark:hover:bg-dark-700"
              )}
            >
              <RotateCcw className="h-3 w-3 shrink-0" />
              Your Real Role
              {!activeRole && <Check className="ml-auto h-3 w-3" />}
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-dark-600" />

            {/* Demo roles */}
            {Object.entries(roles).map(([key, label]) => (
              <button
                key={key}
                onClick={() => switchRole(key)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                  activeRole === key
                    ? "bg-violet-50 font-medium text-violet-600 dark:bg-violet-600/10 dark:text-violet-400"
                    : "text-slate-600 hover:bg-slate-50 dark:text-dark-200 dark:hover:bg-dark-700"
                )}
              >
                {label}
                {activeRole === key && <Check className="ml-auto h-3 w-3" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
