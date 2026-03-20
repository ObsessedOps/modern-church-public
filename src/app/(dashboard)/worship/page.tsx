import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getServiceData } from "@/lib/queries";
import { redirect } from "next/navigation";
import { Music, Mic2, PlayCircle, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const SERVICE_TYPE_COLORS: Record<string, string> = {
  WEEKEND: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  MIDWEEK: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  SPECIAL: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  ONLINE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

// Mock song library data
const MOCK_SONGS = [
  { title: "Way Maker", artist: "Sinach", key: "E", timesPlayed: 24, lastUsed: "Mar 9, 2026" },
  { title: "Goodness of God", artist: "Bethel Music", key: "C", timesPlayed: 21, lastUsed: "Mar 9, 2026" },
  { title: "Build My Life", artist: "Housefires", key: "G", timesPlayed: 18, lastUsed: "Mar 2, 2026" },
  { title: "What A Beautiful Name", artist: "Hillsong Worship", key: "D", timesPlayed: 16, lastUsed: "Feb 23, 2026" },
  { title: "Great Are You Lord", artist: "All Sons & Daughters", key: "G", timesPlayed: 14, lastUsed: "Mar 2, 2026" },
  { title: "Holy Spirit", artist: "Francesca Battistelli", key: "Ab", timesPlayed: 12, lastUsed: "Feb 16, 2026" },
  { title: "Reckless Love", artist: "Cory Asbury", key: "C", timesPlayed: 11, lastUsed: "Feb 23, 2026" },
  { title: "10,000 Reasons", artist: "Matt Redman", key: "G", timesPlayed: 10, lastUsed: "Mar 9, 2026" },
];

// Mock team schedule
const MOCK_TEAM = [
  { name: "Marcus Johnson", role: "Worship Leader", status: "CONFIRMED" },
  { name: "Sarah Kim", role: "Vocalist", status: "CONFIRMED" },
  { name: "David Martinez", role: "Keys", status: "CONFIRMED" },
  { name: "Ashley Brown", role: "Drums", status: "PENDING" },
  { name: "Tyler Greene", role: "Bass", status: "CONFIRMED" },
  { name: "Rachel White", role: "Electric Guitar", status: "DECLINED" },
];

export default async function WorshipPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, 'worship:view')) return <AccessDenied />;
  const services = await getServiceData(session.churchId);

  const totalAttendance = services.reduce((sum, s) => sum + (s.adultCount ?? 0) + (s.childCount ?? 0) + (s.onlineCount ?? 0), 0);
  const avgAttendance = services.length > 0 ? Math.round(totalAttendance / services.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Worship &amp; Services
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Plan services, manage worship teams, and track service metrics across campuses.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/20">
              <Calendar className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Recent Services</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{services.length}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Avg Attendance</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{avgAttendance.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <Music className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Song Library</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{MOCK_SONGS.length}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
              <Mic2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Team Members</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{MOCK_TEAM.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Schedule + Team */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Services */}
        <div className="card overflow-hidden">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">Recent Services</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-dark-600">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Date</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Type</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Campus</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-600">
                {services.slice(0, 12).map((service) => (
                  <tr key={service.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-dark-700">
                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-dark-200" suppressHydrationWarning>
                      {formatDate(service.serviceDate)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("badge text-[10px]", SERVICE_TYPE_COLORS[service.serviceType] ?? SERVICE_TYPE_COLORS.WEEKEND)}>
                        {service.serviceType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-dark-200">
                      {service.campus?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-medium text-slate-900 dark:text-dark-50">
                      {((service.adultCount ?? 0) + (service.childCount ?? 0) + (service.onlineCount ?? 0)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team Schedule */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">Next Sunday — Worship Team</h3>
          <div className="space-y-2">
            {MOCK_TEAM.map((member) => (
              <div key={member.name} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 dark:border-dark-600">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  member.status === "CONFIRMED" ? "bg-emerald-500" : member.status === "PENDING" ? "bg-amber-500" : "bg-rose-500"
                )} />
                <span className="flex-1 text-xs font-medium text-slate-700 dark:text-dark-200">{member.name}</span>
                <span className="text-[10px] text-slate-400 dark:text-dark-400">{member.role}</span>
                <span className={cn(
                  "badge text-[10px]",
                  member.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  member.status === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                )}>
                  {member.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Song Library */}
      <div className="card overflow-hidden">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-emerald-500" />
            Song Library
          </div>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-dark-600">
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Song</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Artist</th>
                <th className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Key</th>
                <th className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Times Played</th>
                <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Last Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-600">
              {MOCK_SONGS.map((song) => (
                <tr key={song.title} className="transition-colors hover:bg-slate-50 dark:hover:bg-dark-700">
                  <td className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-dark-50">{song.title}</td>
                  <td className="px-4 py-2 text-xs text-slate-600 dark:text-dark-200">{song.artist}</td>
                  <td className="px-4 py-2 text-center">
                    <span className="badge bg-slate-100 text-[10px] text-slate-600 dark:bg-dark-600 dark:text-dark-300">{song.key}</span>
                  </td>
                  <td className="px-4 py-2 text-center text-xs font-medium text-slate-900 dark:text-dark-50">{song.timesPlayed}</td>
                  <td className="px-4 py-2 text-right text-xs text-slate-500 dark:text-dark-300">{song.lastUsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
