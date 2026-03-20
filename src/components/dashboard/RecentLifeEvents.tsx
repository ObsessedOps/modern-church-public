"use client";

import Link from "next/link";
import { Heart, ChevronRight } from "lucide-react";
import type { EventType } from "@/generated/prisma/enums";

interface LifeEvent {
  id: string;
  type: EventType;
  date: Date;
  description: string | null;
  member: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface RecentLifeEventsProps {
  lifeEvents: LifeEvent[];
}

const eventTypeColors: Record<string, string> = {
  BAPTISM: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  SALVATION: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  MEMBERSHIP: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  MARRIAGE: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  BABY_DEDICATION: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  DEATH: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  TRANSFER_IN: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  TRANSFER_OUT: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  RECOMMITMENT: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  OTHER: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

function formatEventType(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function RecentLifeEvents({ lifeEvents }: RecentLifeEventsProps) {
  return (
    <div className="card">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 dark:bg-pink-500/20">
          <Heart className="h-4 w-4 text-pink-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
          Recent Life Events
        </h3>
      </div>

      {/* List */}
      {lifeEvents.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Heart className="mb-2 h-8 w-8 text-slate-300 dark:text-dark-400" />
          <p className="text-sm text-slate-500 dark:text-dark-300">
            No life events recorded yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {lifeEvents.slice(0, 5).map((event) => {
            const colorClass =
              eventTypeColors[event.type] ?? eventTypeColors.OTHER;
            return (
              <Link
                key={event.id}
                href={`/members/${event.member.id}`}
                className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-dark-500 dark:hover:bg-dark-600"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800 dark:text-dark-100">
                    {event.member.firstName} {event.member.lastName}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`badge text-[10px] ${colorClass}`}>
                      {formatEventType(event.type)}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-dark-400">
                      {formatDate(event.date)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-dark-400" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
