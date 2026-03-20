import { getServerSession } from "@/lib/server-auth";
import { getLifeEvents } from "@/lib/queries";
import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { Calendar, Heart, Baby, Gem, Droplets, MapPin, Clock, Users, ArrowRightLeft, Star } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const EVENT_TYPE_META: Record<string, { icon: typeof Heart; color: string; bg: string }> = {
  SALVATION: { icon: Heart, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-900/20" },
  BAPTISM: { icon: Droplets, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/20" },
  BABY_DEDICATION: { icon: Baby, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-100 dark:bg-pink-900/20" },
  MARRIAGE: { icon: Gem, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/20" },
  MEMBERSHIP: { icon: Users, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/20" },
  DEATH: { icon: Heart, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-900/20" },
  TRANSFER_IN: { icon: ArrowRightLeft, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-100 dark:bg-cyan-900/20" },
  TRANSFER_OUT: { icon: ArrowRightLeft, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/20" },
  RECOMMITMENT: { icon: Star, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/20" },
  OTHER: { icon: Calendar, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-900/20" },
};

// Mock upcoming calendar events
const MOCK_UPCOMING = [
  { name: "Easter Sunday Services", date: "Apr 5, 2026", time: "8:00 AM, 9:30 AM, 11:00 AM", location: "All Campuses", type: "WORSHIP" },
  { name: "Good Friday Service", date: "Apr 3, 2026", time: "7:00 PM", location: "Downtown Campus", type: "WORSHIP" },
  { name: "Volunteer Training", date: "Mar 21, 2026", time: "9:00 AM - 12:00 PM", location: "Main Building", type: "TRAINING" },
  { name: "Youth Spring Retreat", date: "Mar 28-29, 2026", time: "All Day", location: "Camp Horizon", type: "RETREAT" },
  { name: "Women's Bible Study", date: "Mar 18, 2026", time: "6:30 PM", location: "Fellowship Hall", type: "STUDY" },
  { name: "Men's Breakfast", date: "Mar 22, 2026", time: "7:30 AM", location: "Café", type: "FELLOWSHIP" },
];

const UPCOMING_TYPE_COLORS: Record<string, string> = {
  WORSHIP: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  TRAINING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  RETREAT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  STUDY: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  FELLOWSHIP: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default async function EventsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, 'events:view')) return <AccessDenied />;
  const lifeEvents = await getLifeEvents(session.churchId);

  // Count by type
  const typeCounts = new Map<string, number>();
  for (const e of lifeEvents) {
    typeCounts.set(e.type, (typeCounts.get(e.type) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Events &amp; Calendar
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Upcoming events, life event milestones, and church calendar management.
        </p>
      </div>

      {/* Life Event Stats */}
      <div className="flex flex-wrap gap-3">
        {Array.from(typeCounts.entries()).map(([type, count]) => {
          const meta = EVENT_TYPE_META[type];
          return (
            <div key={type} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 dark:border-dark-500 dark:bg-dark-700">
              <span className="text-xs text-slate-600 dark:text-dark-200">
                {count} {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}{count > 1 ? "s" : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Upcoming Events + Life Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Calendar Events */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-500" />
              Upcoming Events
            </div>
          </h3>
          <div className="space-y-3">
            {MOCK_UPCOMING.map((event) => (
              <div key={event.name} className="rounded-lg border border-slate-100 p-3 dark:border-dark-600">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-dark-50">{event.name}</h4>
                  <span className={cn("badge text-[10px]", UPCOMING_TYPE_COLORS[event.type] ?? UPCOMING_TYPE_COLORS.FELLOWSHIP)}>
                    {event.type}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-300">
                    <Calendar className="h-3 w-3 text-slate-400 dark:text-dark-400" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-300">
                    <Clock className="h-3 w-3 text-slate-400 dark:text-dark-400" />
                    {event.time}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-300">
                    <MapPin className="h-3 w-3 text-slate-400 dark:text-dark-400" />
                    {event.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Life Events Timeline */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              Life Event Milestones
            </div>
          </h3>
          <div className="space-y-3">
            {lifeEvents.slice(0, 15).map((event) => {
              const meta = EVENT_TYPE_META[event.type] ?? EVENT_TYPE_META.SALVATION;
              const Icon = meta.icon;
              return (
                <div key={event.id} className="flex items-center gap-3">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.bg)}>
                    <Icon className={cn("h-4 w-4", meta.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-dark-200">
                      {event.member.firstName} {event.member.lastName}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-dark-400" suppressHydrationWarning>
                      {event.type.replace(/_/g, " ")} • {formatDate(event.date)}
                    </p>
                  </div>
                  {event.description && (
                    <p className="max-w-[140px] truncate text-[10px] text-slate-400 dark:text-dark-400">{event.description}</p>
                  )}
                </div>
              );
            })}
            {lifeEvents.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-dark-400">No life events recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
