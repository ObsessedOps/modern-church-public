import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getGivingData, getGivingTrend, getGivingHealthData } from "@/lib/queries";
import { redirect } from "next/navigation";
import {
  DollarSign, TrendingUp, PieChart, Heart, CreditCard,
  Sparkles, AlertTriangle, UserPlus, TrendingDown, BarChart3,
} from "lucide-react";
import { MessageActions } from "@/components/messaging/MessageActions";
import { cn } from "@/lib/utils";
import { GivingTrendChart } from "@/components/dashboard/GivingTrendChart";

const METHOD_COLORS: Record<string, string> = {
  ONLINE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CHECK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CASH: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ACH: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  CREDIT_CARD: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  DEBIT_CARD: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function GivingPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, 'giving:view')) return <AccessDenied />;
  const [data, givingTrend, health] = await Promise.all([
    getGivingData(session.churchId),
    getGivingTrend(session.churchId),
    getGivingHealthData(session.churchId),
  ]);

  const maxFund = data.fundBreakdown.length > 0 ? data.fundBreakdown[0].total : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Giving &amp; Stewardship
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Track contributions, analyze giving trends, and nurture generosity across your congregation.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Weekly Giving</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{formatCurrency(data.weeklyTotal)}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Month-to-Date</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{formatCurrency(data.mtdTotal)}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/20">
              <PieChart className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Year-to-Date</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{formatCurrency(data.ytdTotal)}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/20">
              <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Avg per Giver (YTD)</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{formatCurrency(data.avgPerGiver)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Giving Trend Chart */}
      <GivingTrendChart data={givingTrend} />

      {/* Fund Breakdown + Recent Transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Fund Breakdown */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">Fund Breakdown (YTD)</h3>
          <div className="space-y-3">
            {data.fundBreakdown.map((fund) => (
              <div key={fund.fund}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-dark-200">{fund.fund}</span>
                  <span className="text-slate-500 dark:text-dark-300">{formatCurrency(fund.total)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-dark-600">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${(fund.total / maxFund) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {data.fundBreakdown.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-dark-400">No fund data available</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card overflow-hidden">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">Recent Transactions</h3>
          <div className="space-y-2">
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 dark:border-dark-600">
                <CreditCard className="h-4 w-4 shrink-0 text-slate-400 dark:text-dark-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-700 dark:text-dark-200">
                    {tx.member ? `${tx.member.firstName} ${tx.member.lastName}` : "Anonymous"}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-dark-400" suppressHydrationWarning>
                    {formatDate(tx.transactionDate)} • {tx.fund}
                  </p>
                </div>
                <span className={cn("badge text-[10px]", METHOD_COLORS[tx.method] ?? METHOD_COLORS.ONLINE)}>
                  {tx.method}
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-dark-50">
                  ${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            {data.recentTransactions.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-dark-400">No transactions recorded yet</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Giving Health Intelligence ─────────────────────── */}
      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/20">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              Grace AI — Giving Health
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-dark-300">
              AI-powered giving pattern analysis
            </p>
          </div>
        </div>

        {/* Health KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 p-3 dark:border-dark-600">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                Giving Rate
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-dark-50">
              {health.givingAttendanceRatio}%
            </p>
            <p className="text-[10px] text-slate-400 dark:text-dark-400">
              {health.activeGiversThisMonth} of {health.activeAttendees} attendees
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3 dark:border-dark-600">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                Lapsed Recurring
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-dark-50">
              {health.lapsedRecurringCount}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-dark-400">
              No gift in 30 days
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3 dark:border-dark-600">
            <div className="flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                New Givers
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-dark-50">
              {health.firstTimeGiverCount}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-dark-400">
              First gift this month
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3 dark:border-dark-600">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                Declining
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-dark-50">
              {health.decliningGiverCount}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-dark-400">
              50%+ decrease vs last month
            </p>
          </div>
        </div>
      </div>

      {/* ── Lapsed Recurring Donors ──────────────────────── */}
      {health.lapsedRecurring.length > 0 && (
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              Lapsed Recurring Donors
            </h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {health.lapsedRecurringCount}
            </span>
          </div>
          <p className="mb-3 text-xs text-slate-500 dark:text-dark-300">
            These members had recurring gifts but haven&apos;t given in 30+ days. A personal check-in can help.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {health.lapsedRecurring.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-dark-600"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-dark-100">
                    {member.firstName} {member.lastName}
                  </p>
                  {member.email && (
                    <p className="truncate text-[10px] text-slate-400 dark:text-dark-400">
                      {member.email}
                    </p>
                  )}
                </div>
                <MessageActions
                  name={`${member.firstName} ${member.lastName}`}
                  email={member.email}
                  phone={member.phone}
                  context={`Lapsed recurring donor: ${member.firstName} ${member.lastName} — no recurring gift in 30+ days. Reach out with care.`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── First-Time Givers ────────────────────────────── */}
      {health.firstTimeGivers.length > 0 && (
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              First-Time Givers This Month
            </h3>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {health.firstTimeGiverCount}
            </span>
          </div>
          <p className="mb-3 text-xs text-slate-500 dark:text-dark-300">
            Celebrate these new givers! A thank-you message can turn a first gift into a habit.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {health.firstTimeGivers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2 dark:border-emerald-900/30 dark:bg-emerald-900/10"
              >
                <p className="text-xs font-medium text-slate-800 dark:text-dark-100">
                  {member.firstName} {member.lastName}
                </p>
                <MessageActions
                  name={`${member.firstName} ${member.lastName}`}
                  email={member.email}
                  phone={member.phone}
                  context={`First-time giver: ${member.firstName} ${member.lastName} — send a warm thank-you to encourage continued generosity.`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Declining Givers ─────────────────────────────── */}
      {health.decliningGivers.length > 0 && (
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              Declining Givers
            </h3>
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
              {health.decliningGiverCount}
            </span>
          </div>
          <p className="mb-3 text-xs text-slate-500 dark:text-dark-300">
            These members gave 50%+ less this month than last. May indicate a life change worth checking on.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {health.decliningGivers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-dark-600"
              >
                <p className="text-xs font-medium text-slate-800 dark:text-dark-100">
                  {member.firstName} {member.lastName}
                </p>
                <MessageActions
                  name={`${member.firstName} ${member.lastName}`}
                  email={member.email}
                  phone={member.phone}
                  context={`Declining giver: ${member.firstName} ${member.lastName} — giving dropped significantly. Check in with care.`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
