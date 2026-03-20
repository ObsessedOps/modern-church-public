"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { navigation } from "@/lib/navigation";

interface SearchResult {
  label: string;
  path: string;
  icon: React.ElementType;
  category: string;
  detail?: string;
}

const pages: SearchResult[] = navigation.map((item) => ({
  label: item.label,
  path: item.path,
  icon: item.icon,
  category: "Pages",
}));

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [liveResults, setLiveResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setLiveResults([]);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        return;
      }
      if (e.key === "/") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);

  // Live search with debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setLiveResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          const results: SearchResult[] = [];
          if (data.members) {
            (data.members as Array<{ id: string; firstName: string; lastName: string }>).forEach((m) =>
              results.push({
                label: `${m.firstName} ${m.lastName}`,
                path: `/members/${m.id}`,
                icon: navigation.find((n) => n.id === "members")!.icon,
                category: "Member",
              })
            );
          }
          setLiveResults(results);
        }
      } catch {
        // silent
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const pageResults = query
    ? pages.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
    : pages;

  const allResults = [...liveResults, ...pageResults];

  const navigate = (path: string) => {
    router.push(path);
    close();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} aria-hidden="true" />
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-dark-600 dark:bg-dark-800">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-dark-600">
          {searching ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary-600" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
          )}
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search pages, members, groups..."
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-dark-100"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && allResults.length > 0) {
                navigate(allResults[selectedIndex]?.path ?? allResults[0].path);
              }
            }}
          />
          <button
            onClick={close}
            className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-dark-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {allResults.length === 0 && query.length >= 2 ? (
            <p className="py-6 text-center text-sm text-slate-400 dark:text-dark-300">
              No results found
            </p>
          ) : (
            <div className="space-y-1">
              {/* Live results first */}
              {liveResults.length > 0 && (
                <p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-dark-400">
                  Results
                </p>
              )}
              {liveResults.map((result, i) => {
                const Icon = result.icon;
                const isSelected = selectedIndex === i;
                return (
                  <button
                    key={`live-${i}`}
                    onClick={() => navigate(result.path)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition-colors dark:text-dark-200 ${isSelected ? "bg-primary-600/10 text-primary-600 dark:text-primary-400" : "hover:bg-slate-100 dark:hover:bg-dark-700"}`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary-600" />
                    <span className="font-medium">{result.label}</span>
                    {result.detail && (
                      <span className="text-xs text-slate-400 dark:text-dark-300">
                        {result.detail}
                      </span>
                    )}
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-400 dark:text-dark-400">
                      {result.category}
                    </span>
                  </button>
                );
              })}

              {/* Page results */}
              {pageResults.length > 0 && (
                <p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-dark-400">
                  Pages
                </p>
              )}
              {pageResults.map((result, pi) => {
                const Icon = result.icon;
                const isSelected = selectedIndex === liveResults.length + pi;
                return (
                  <button
                    key={result.path}
                    onClick={() => navigate(result.path)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition-colors dark:text-dark-200 ${isSelected ? "bg-primary-600/10 text-primary-600 dark:text-primary-400" : "hover:bg-slate-100 dark:hover:bg-dark-700"}`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-slate-400 dark:text-dark-300" />
                    <span>{result.label}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-400 dark:text-dark-400">
                      {result.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400 dark:border-dark-600 dark:text-dark-400">
          <span><kbd className="rounded bg-slate-100 px-1 py-0.5 dark:bg-dark-600">Enter</kbd> to select</span>
          <span><kbd className="rounded bg-slate-100 px-1 py-0.5 dark:bg-dark-600">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
