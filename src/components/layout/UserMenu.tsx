"use client";

import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/lib/actions";
import { usePermissions } from "@/components/providers/PermissionsProvider";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRole(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = usePermissions();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-dark-700"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
          {getInitials(user.name || "U")}
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-dark-200 max-sm:hidden">
          {user.name?.split(" ")[0] || "User"}
        </span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform max-sm:hidden ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-dark-600 dark:bg-dark-800">
          {/* User info */}
          <div className="border-b border-slate-100 px-3 py-2.5 dark:border-dark-600">
            <p className="text-sm font-medium text-slate-800 dark:text-dark-100">{user.name || "User"}</p>
            <p className="text-xs text-slate-400 dark:text-dark-400">{formatRole(user.role)}</p>
          </div>

          {/* Links */}
          <div className="py-1">
            <button
              onClick={() => navigate("/settings")}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:text-dark-200 dark:hover:bg-dark-700"
            >
              <User className="h-4 w-4 text-slate-400 dark:text-dark-300" />
              Profile
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:text-dark-200 dark:hover:bg-dark-700"
            >
              <Settings className="h-4 w-4 text-slate-400 dark:text-dark-300" />
              Settings
            </button>
          </div>

          {/* Sign out */}
          <div className="border-t border-slate-100 py-1 dark:border-dark-600">
            <button
              onClick={() => signOutAction()}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-error transition-colors hover:bg-error/5"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
