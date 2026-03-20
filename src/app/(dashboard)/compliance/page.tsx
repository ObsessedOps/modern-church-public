import { getServerSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { ShieldCheck, FileCheck, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock background check data
const MOCK_CHECKS = [
  { name: "Marcus Johnson", role: "Worship Leader", team: "Worship", checkDate: "Jan 15, 2026", expiry: "Jan 15, 2028", status: "CLEAR" },
  { name: "Sarah Kim", role: "Kids Ministry Lead", team: "Children's", checkDate: "Nov 3, 2025", expiry: "Nov 3, 2027", status: "CLEAR" },
  { name: "David Martinez", role: "Youth Pastor", team: "Youth", checkDate: "Sep 22, 2025", expiry: "Sep 22, 2027", status: "CLEAR" },
  { name: "Ashley Brown", role: "Nursery Volunteer", team: "Children's", checkDate: "Mar 1, 2024", expiry: "Mar 1, 2026", status: "EXPIRING" },
  { name: "Tyler Greene", role: "Van Driver", team: "Transportation", checkDate: "Feb 14, 2024", expiry: "Feb 14, 2026", status: "EXPIRED" },
  { name: "Rachel White", role: "Sunday School Teacher", team: "Children's", checkDate: "Aug 10, 2025", expiry: "Aug 10, 2027", status: "CLEAR" },
  { name: "James Wilson", role: "Security Team", team: "Safety", checkDate: "Dec 5, 2025", expiry: "Dec 5, 2027", status: "CLEAR" },
  { name: "Emma Davis", role: "Counseling Ministry", team: "Pastoral Care", checkDate: "Jun 20, 2025", expiry: "Jun 20, 2027", status: "CLEAR" },
  { name: "Chris Thompson", role: "Kids Check-In", team: "Children's", checkDate: null, expiry: null, status: "PENDING" },
  { name: "Mia Rodriguez", role: "Youth Volunteer", team: "Youth", checkDate: null, expiry: null, status: "PENDING" },
];

// Mock compliance policies
const MOCK_POLICIES = [
  { name: "Child Protection Policy", status: "CURRENT", lastReview: "Jan 2026", nextReview: "Jan 2027" },
  { name: "Sexual Harassment Prevention", status: "CURRENT", lastReview: "Nov 2025", nextReview: "Nov 2026" },
  { name: "Data Privacy (CCPA/GDPR)", status: "CURRENT", lastReview: "Sep 2025", nextReview: "Sep 2026" },
  { name: "Financial Controls & Audit", status: "REVIEW_NEEDED", lastReview: "Mar 2025", nextReview: "Mar 2026" },
  { name: "Emergency Response Plan", status: "CURRENT", lastReview: "Dec 2025", nextReview: "Dec 2026" },
  { name: "Volunteer Screening Standards", status: "CURRENT", lastReview: "Oct 2025", nextReview: "Oct 2026" },
  { name: "Facility Use Agreement", status: "REVIEW_NEEDED", lastReview: "Feb 2025", nextReview: "Feb 2026" },
];

const CHECK_STATUS_COLORS: Record<string, string> = {
  CLEAR: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  EXPIRING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  EXPIRED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  PENDING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const POLICY_STATUS_COLORS: Record<string, string> = {
  CURRENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  REVIEW_NEEDED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  OVERDUE: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default async function CompliancePage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, 'compliance:view')) return <AccessDenied />;

  const clearCount = MOCK_CHECKS.filter((c) => c.status === "CLEAR").length;
  const expiringCount = MOCK_CHECKS.filter((c) => c.status === "EXPIRING").length;
  const expiredCount = MOCK_CHECKS.filter((c) => c.status === "EXPIRED").length;
  const pendingCount = MOCK_CHECKS.filter((c) => c.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Compliance &amp; Safety
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Background checks, child safety protocols, data privacy, and regulatory compliance.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Cleared</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{clearCount}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Expiring Soon</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{expiringCount}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/20">
              <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Expired</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{expiredCount}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <FileCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Pending</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Background Checks Table */}
      <div className="card overflow-hidden">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Background Check Status
          </div>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-dark-600">
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Name</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Role</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Team</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Check Date</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Expiry</th>
                <th className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-600">
              {MOCK_CHECKS.map((check) => (
                <tr key={check.name} className="transition-colors hover:bg-slate-50 dark:hover:bg-dark-700">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-dark-50">{check.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-dark-200">{check.role}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-dark-200">{check.team}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-dark-200">{check.checkDate ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-dark-200">{check.expiry ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("badge text-[10px]", CHECK_STATUS_COLORS[check.status])}>
                      {check.status === "EXPIRING" ? "EXPIRING SOON" : check.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Compliance */}
      <div className="card">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-blue-500" />
            Policy Compliance Checklist
          </div>
        </h3>
        <div className="space-y-2">
          {MOCK_POLICIES.map((policy) => (
            <div key={policy.name} className="flex items-center gap-3 rounded-lg border border-slate-100 px-4 py-3 dark:border-dark-600">
              {policy.status === "CURRENT" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-dark-200">{policy.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-dark-400">
                  Last review: {policy.lastReview} • Next: {policy.nextReview}
                </p>
              </div>
              <span className={cn("badge text-[10px]", POLICY_STATUS_COLORS[policy.status])}>
                {policy.status === "REVIEW_NEEDED" ? "REVIEW NEEDED" : policy.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
