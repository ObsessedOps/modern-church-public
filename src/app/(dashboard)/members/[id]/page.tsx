import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getMemberDetail } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Tag,
  Users,
  Heart,
  HandHeart,
  Star,
  Clock,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  VISITOR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ATTENDEE:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  MEMBER:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  INACTIVE: "bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-dark-300",
  TRANSFERRED:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  DECEASED: "bg-slate-200 text-slate-500 dark:bg-dark-700 dark:text-dark-400",
};

const TIER_COLORS: Record<string, string> = {
  CHAMPION:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ENGAGED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CASUAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  AT_RISK:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  DISENGAGED:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function formatTier(tier: string): string {
  return tier.replace("_", " ");
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "--";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession();
  if (!can(session, 'members:view')) return <AccessDenied />;
  const member = await getMemberDetail(id, session.churchId);

  if (!member) {
    notFound();
  }

  const familyMembers =
    member.familyMembers?.flatMap((fm) =>
      fm.familyUnit.members.filter((m) => m.id !== member.id)
    ) ?? [];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/members"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-violet-600 dark:text-dark-300 dark:hover:text-violet-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Congregation
      </Link>

      {/* Member Header */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 text-xl font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
            {getInitials(member.firstName, member.lastName)}
          </div>

          {/* Name & Badges */}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
              {member.firstName} {member.lastName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`badge ${STATUS_COLORS[member.membershipStatus] ?? "bg-slate-100 text-slate-600"}`}
              >
                {member.membershipStatus}
              </span>
              <span
                className={`badge ${TIER_COLORS[member.engagementTier] ?? "bg-slate-100 text-slate-600"}`}
              >
                {formatTier(member.engagementTier)}
              </span>
              <span className="badge bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-dark-300">
                Score: {Math.round(member.engagementScore)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-dark-50">
            Contact Info
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-slate-400 dark:text-dark-400" />
              <span className="text-slate-600 dark:text-dark-200">
                {member.email ?? "No email"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-slate-400 dark:text-dark-400" />
              <span className="text-slate-600 dark:text-dark-200">
                {member.phone ?? "No phone"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-dark-400" />
              <span className="text-slate-600 dark:text-dark-200">
                DOB: {formatDate(member.dateOfBirth)}
              </span>
            </div>
          </div>
        </div>

        {/* Church Info */}
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-dark-50">
            Church Info
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-slate-400 dark:text-dark-400" />
              <span className="text-slate-600 dark:text-dark-200">
                Campus: {member.primaryCampusId ? "Assigned" : "--"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-slate-400 dark:text-dark-400" />
              <span className="text-slate-600 dark:text-dark-200">
                Member since: {formatDate(member.memberSince)}
              </span>
            </div>
            {member.tags.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <Tag className="mt-0.5 h-4 w-4 text-slate-400 dark:text-dark-400" />
                <div className="flex flex-wrap gap-1">
                  {member.tags.map((tag) => (
                    <span
                      key={tag}
                      className="badge bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-dark-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Family */}
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-dark-50">
            Family
          </h2>
          {familyMembers.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-dark-400">
              No family connections recorded.
            </p>
          ) : (
            <div className="space-y-2">
              {familyMembers.map((fm) => (
                <Link
                  key={fm.id}
                  href={`/members/${fm.id}`}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-violet-600 dark:text-dark-200 dark:hover:text-violet-400"
                >
                  <Users className="h-4 w-4 text-slate-400 dark:text-dark-400" />
                  {fm.firstName} {fm.lastName}
                  <span
                    className={`badge text-[10px] ${STATUS_COLORS[fm.membershipStatus] ?? ""}`}
                  >
                    {fm.membershipStatus}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance History */}
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-dark-50">
          <Clock className="h-4 w-4" />
          Attendance History
        </h2>
        {member.attendanceRecords.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-dark-400">
            No attendance records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-dark-600">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Service Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-600">
                {member.attendanceRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-3 py-2 text-slate-600 dark:text-dark-200">
                      {formatDate(record.serviceDate)}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-dark-200">
                      {record.serviceType ?? "--"}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-dark-200">
                      {record.serviceTime ?? "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Giving History */}
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-dark-50">
          <Heart className="h-4 w-4" />
          Giving History
        </h2>
        {member.contributions.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-dark-400">
            No giving records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-dark-600">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Fund
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                    Method
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-600">
                {member.contributions.map((contribution) => (
                  <tr key={contribution.id}>
                    <td className="px-3 py-2 text-slate-600 dark:text-dark-200">
                      {formatDate(contribution.transactionDate)}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900 dark:text-dark-50">
                      {formatCurrency(contribution.amount)}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-dark-200">
                      {contribution.fund ?? "--"}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-dark-200">
                      {contribution.method ?? "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Groups */}
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-dark-50">
          <Users className="h-4 w-4" />
          Groups
        </h2>
        {member.groupMemberships.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-dark-400">
            Not a member of any groups.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {member.groupMemberships.map((gm) => (
              <div key={gm.group.id} className="item-bordered">
                <h3 className="text-sm font-medium text-slate-900 dark:text-dark-50">
                  {gm.group.name}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="badge bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-dark-300">
                    {gm.group.type}
                  </span>
                  {gm.group.healthScore != null && (
                    <span className="text-xs text-slate-500 dark:text-dark-300">
                      Health: {Math.round(gm.group.healthScore)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Volunteer Positions */}
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-dark-50">
          <HandHeart className="h-4 w-4" />
          Volunteer Positions
        </h2>
        {member.volunteerPositions.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-dark-400">
            No volunteer positions assigned.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {member.volunteerPositions.map((vp) => (
              <div key={vp.id} className="item-bordered">
                <h3 className="text-sm font-medium text-slate-900 dark:text-dark-50">
                  {vp.team.name}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {vp.team.ministryArea ?? "General"}
                  </span>
                  <span className="badge bg-slate-100 text-slate-600 dark:bg-dark-600 dark:text-dark-300">
                    {vp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Life Events */}
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-dark-50">
          <Star className="h-4 w-4" />
          Life Events
        </h2>
        {member.lifeEvents.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-dark-400">
            No life events recorded.
          </p>
        ) : (
          <div className="space-y-2">
            {member.lifeEvents.map((event) => (
              <div
                key={event.id}
                className="item-bordered flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-dark-50">
                    {event.type.replace("_", " ")}
                  </span>
                  {event.description && (
                    <p className="text-xs text-slate-500 dark:text-dark-300">
                      {event.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-dark-300">
                  {formatDate(event.date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
