"use client";

import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Users,
  Heart,
  UserPlus,
  Cross,
  HandHeart,
  UsersRound,
  Footprints,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Users,
  Heart,
  UserPlus,
  Cross,
  HandHeart,
  UsersRound,
  Footprints,
};

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number | null;
  deltaLabel?: string;
  detail?: string;
  icon: string;
  color: string;
  href?: string;
}

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  violet: {
    border: "border-l-violet-500",
    bg: "bg-violet-500/10 dark:bg-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
  },
  emerald: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  blue: {
    border: "border-l-blue-500",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    border: "border-l-rose-500",
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
  },
  purple: {
    border: "border-l-purple-500",
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-600 dark:text-purple-400",
  },
  cyan: {
    border: "border-l-cyan-500",
    bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    text: "text-cyan-600 dark:text-cyan-400",
  },
  sky: {
    border: "border-l-sky-500",
    bg: "bg-sky-500/10 dark:bg-sky-500/20",
    text: "text-sky-600 dark:text-sky-400",
  },
  teal: {
    border: "border-l-teal-500",
    bg: "bg-teal-500/10 dark:bg-teal-500/20",
    text: "text-teal-600 dark:text-teal-400",
  },
};

export function KpiCard({
  label,
  value,
  delta,
  deltaLabel,
  detail,
  icon,
  color,
  href,
}: KpiCardProps) {
  const colors = colorMap[color] ?? colorMap.violet;
  const Icon = iconMap[icon] ?? Users;

  const cardClassName = `card border-l-4 ${colors.border} flex items-start gap-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] ${href ? "cursor-pointer group" : ""}`;

  const content = (
    <>
      {/* Icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}
      >
        <Icon className={`h-5 w-5 ${colors.text}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 relative">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-dark-300">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-dark-50">
          {value}
        </p>

        {/* Delta */}
        {delta != null && (
          <div className="mt-1 flex items-center gap-1">
            {delta > 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : delta < 0 ? (
              <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
            ) : (
              <Minus className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span
              className={`text-xs font-semibold ${
                delta > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : delta < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-500 dark:text-dark-300"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {delta}%
            </span>
            {deltaLabel && (
              <span className="text-xs text-slate-500 dark:text-dark-300">
                {deltaLabel}
              </span>
            )}
          </div>
        )}

        {/* Detail */}
        {detail && (
          <p className="mt-1 truncate text-xs text-slate-500 dark:text-dark-300">
            {detail}
          </p>
        )}
        {href && (
          <ChevronRight className="absolute right-0 top-0 h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-dark-400" />
        )}
      </div>
    </>
  );

  if (href) {
    return <Link href={href} className={cardClassName}>{content}</Link>;
  }

  return <div className={cardClassName}>{content}</div>;
}
