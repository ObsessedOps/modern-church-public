import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { getGivingData, getGivingTrend } from "@/lib/queries";
import { redirect } from "next/navigation";
import { DollarSign, TrendingUp, PieChart, Heart, CreditCard } from "lucide-react";
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
  const [data, givingTrend] = await Promise.all([
    getGivingData(session.churchId),
    getGivingTrend(session.churchId),
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
    </div>
  );
}
