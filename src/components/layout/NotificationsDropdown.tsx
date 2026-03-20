"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell, UserPlus, Users, ShieldCheck, Check,
  Lightbulb, Heart, TrendingDown, Search, PartyPopper,
} from "lucide-react";
import Link from "next/link";

type Notification = {
  id: string;
  type: "visitor" | "volunteer" | "compliance" | "insight";
  title: string;
  detail: string;
  time: string;
  read: boolean;
  href?: string;
};

const typeConfig = {
  visitor: { Icon: UserPlus, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-600/10" },
  volunteer: { Icon: Users, color: "text-primary-600", bg: "bg-primary-600/10" },
  compliance: { Icon: ShieldCheck, color: "text-warning", bg: "bg-warning/10" },
  insight: { Icon: Lightbulb, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/10" },
};

const insightTypeIcons: Record<string, typeof Lightbulb> = {
  STAFFING_GAP: Users,
  TREND_ALERT: TrendingDown,
  PATTERN_DETECTED: Search,
  MEMBER_CARE: Heart,
  CELEBRATION: PartyPopper,
  RECOMMENDATION: Lightbulb,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    // Fetch real insights as notifications
    async function loadNotifications() {
      try {
        const res = await fetch("/api/insights");
        if (!res.ok) return;
        const insights = await res.json();
        if (!Array.isArray(insights)) return;

        const notifs: Notification[] = insights
          .filter((i: { readAt: string | null }) => !i.readAt)
          .slice(0, 5)
          .map((i: { id: string; type: string; title: string; body: string; createdAt: string; readAt: string | null }) => ({
            id: i.id,
            type: "insight" as const,
            title: i.title,
            detail: i.body.slice(0, 80) + (i.body.length > 80 ? "..." : ""),
            time: timeAgo(i.createdAt),
            read: !!i.readAt,
            href: "/insights",
          }));

        setNotifications(notifs);
      } catch {
        // Fallback to empty
      } finally {
        setLoaded(true);
      }
    }

    loadNotifications();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    // Mark insights as read via API
    notifications.forEach((n) => {
      if (!n.read) {
        fetch(`/api/insights/${n.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "read" }),
        }).catch(() => {});
      }
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error ring-2 ring-white dark:ring-dark-900" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-dark-600 dark:bg-dark-800">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-dark-600">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-dark-100">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {!loaded && (
              <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-dark-300">
                Loading...
              </div>
            )}
            {loaded && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-slate-400 dark:text-dark-300">
                No recent notifications
              </p>
            )}
            {notifications.map((n) => {
              const { Icon, color, bg } = typeConfig[n.type];
              const content = (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 border-b border-slate-50 px-4 py-3 transition-colors last:border-0 dark:border-dark-700 ${
                    n.read
                      ? "opacity-60"
                      : "bg-slate-50/50 dark:bg-dark-700/30"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${bg}`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 dark:text-dark-100">
                      {n.title}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-dark-300">
                      {n.detail}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-400 dark:text-dark-400">
                    {n.time}
                  </span>
                </div>
              );

              if (n.href) {
                return (
                  <Link key={n.id} href={n.href} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                );
              }
              return content;
            })}
          </div>
          <div className="border-t border-slate-100 px-4 py-2.5 text-center dark:border-dark-600">
            <Link
              href="/insights"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              View all insights
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
