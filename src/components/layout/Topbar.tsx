"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Menu, Search, Sparkles, Sun, Moon, ChevronDown, Building2 } from "lucide-react";
import { useSidebarStore } from "@/stores/sidebar";
import { useGracePanelStore } from "@/stores/grace-panel";
import { useThemeStore } from "@/stores/theme";
import NotificationsDropdown from "@/components/layout/NotificationsDropdown";
import UserMenu from "@/components/layout/UserMenu";

interface TopbarProps {
  campuses?: { id: string; name: string; slug: string }[];
}

export function Topbar({ campuses = [] }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toggleMobile, isOpen } = useSidebarStore();
  const toggleGrace = useGracePanelStore((s) => s.toggle);
  const { mode, toggle: toggleTheme } = useThemeStore();
  const currentCampusSlug = searchParams.get("campus") ?? "";
  const selectedCampus = campuses.find((c) => c.slug === currentCampusSlug)?.name ?? "All Campuses";
  const [campusOpen, setCampusOpen] = useState(false);

  function selectCampus(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("campus", slug);
    } else {
      params.delete("campus");
    }
    const qs = params.toString();
    // Full navigation to bypass Next.js client-side router cache
    window.location.href = qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <>
      <style>{`
        @media (min-width: 1024px) {
          .topbar-dynamic { padding-left: calc(${isOpen ? "var(--sidebar-width)" : "68px"} + var(--margin-x)) !important; }
        }
      `}</style>
      <header
        className="topbar-dynamic sticky top-0 z-20 flex h-[var(--topbar-height)] shrink-0 items-center justify-between border-b bg-white/80 px-[var(--margin-x)] backdrop-blur-sm transition-all duration-200 ease-out dark:border-dark-600 dark:bg-dark-900/80"
      >
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobile}
          aria-label="Toggle navigation menu"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-700 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <button aria-label="Search" className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs-plus text-slate-400 transition-colors hover:border-slate-300 dark:border-dark-500 dark:hover:border-dark-400 max-sm:hidden sm:w-48">
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <span className="ml-auto rounded bg-slate-100 px-1 py-px text-[10px] text-slate-400 dark:bg-dark-600 dark:text-dark-300">
            /
          </span>
        </button>
        <button aria-label="Search" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-700 sm:hidden">
          <Search className="h-5 w-5" />
        </button>

        {/* Campus selector */}
        <div className="relative">
          <button
            onClick={() => setCampusOpen(!campusOpen)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 dark:border-dark-500 dark:text-dark-200 dark:hover:border-dark-400 sm:px-2.5"
          >
            <Building2 className="h-4 w-4 shrink-0 text-slate-400 dark:text-dark-300 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">{selectedCampus}</span>
            <ChevronDown className={`h-3 w-3 shrink-0 text-slate-400 transition-transform ${campusOpen ? "rotate-180" : ""}`} />
          </button>

          {campusOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setCampusOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-dark-600 dark:bg-dark-800">
                <button
                  onClick={() => selectCampus("")}
                  className={`flex w-full items-center px-3 py-2 text-left text-xs transition-colors ${
                    !currentCampusSlug
                      ? "bg-violet-50 font-medium text-violet-600 dark:bg-violet-600/10 dark:text-violet-400"
                      : "text-slate-600 hover:bg-slate-50 dark:text-dark-200 dark:hover:bg-dark-700"
                  }`}
                >
                  All Campuses
                </button>
                {campuses.map((campus) => (
                  <button
                    key={campus.id}
                    onClick={() => selectCampus(campus.slug)}
                    className={`flex w-full items-center px-3 py-2 text-left text-xs transition-colors ${
                      currentCampusSlug === campus.slug
                        ? "bg-violet-50 font-medium text-violet-600 dark:bg-violet-600/10 dark:text-violet-400"
                        : "text-slate-600 hover:bg-slate-50 dark:text-dark-200 dark:hover:bg-dark-700"
                    }`}
                  >
                    {campus.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-700"
        >
          {mode === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* Grace AI toggle */}
        <button
          onClick={toggleGrace}
          className="ml-1 flex items-center gap-1.5 rounded-lg bg-violet-600/10 px-3 py-1.5 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-600/15 dark:text-violet-400"
        >
          <Sparkles className="h-4 w-4" />
          <span className="max-sm:hidden">Grace</span>
        </button>

        {/* User menu */}
        <div className="ml-1 border-l border-slate-200 pl-2 dark:border-dark-600">
          <UserMenu />
        </div>
      </div>
    </header>
    </>
  );
}
