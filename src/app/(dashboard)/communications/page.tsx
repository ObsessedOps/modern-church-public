import { getServerSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { Mail, Smartphone, Megaphone, Send, BarChart3, Users, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock email campaigns
const MOCK_EMAIL_CAMPAIGNS = [
  { subject: "Easter Weekend Invite", sent: 2847, openRate: 68.3, clickRate: 24.1, date: "Mar 10, 2026", status: "SENT" },
  { subject: "Weekly Newsletter — March 2nd", sent: 3120, openRate: 52.7, clickRate: 12.4, date: "Mar 2, 2026", status: "SENT" },
  { subject: "Volunteer Appreciation Night", sent: 487, openRate: 74.2, clickRate: 41.3, date: "Feb 28, 2026", status: "SENT" },
  { subject: "Spring Small Groups Launch", sent: 2956, openRate: 61.8, clickRate: 28.7, date: "Feb 24, 2026", status: "SENT" },
  { subject: "Annual Giving Statement", sent: 1823, openRate: 83.1, clickRate: 45.2, date: "Feb 15, 2026", status: "SENT" },
];

// Mock SMS campaigns
const MOCK_SMS_CAMPAIGNS = [
  { message: "Easter service times updated! 8am, 9:30am, 11am at all campuses.", sent: 1842, deliveryRate: 98.2, responseRate: 12.4, date: "Mar 10, 2026" },
  { message: "Prayer night tonight at 7pm. All campuses. Childcare provided.", sent: 1756, deliveryRate: 97.8, responseRate: 8.1, date: "Mar 5, 2026" },
  { message: "Volunteer reminder: Training this Saturday 9am-12pm.", sent: 487, deliveryRate: 99.1, responseRate: 34.2, date: "Feb 28, 2026" },
  { message: "Snow advisory: Wednesday service moved online this week.", sent: 3089, deliveryRate: 98.7, responseRate: 15.6, date: "Feb 19, 2026" },
];

const STATUS_COLORS: Record<string, string> = {
  SENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  DRAFT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default async function CommunicationsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, 'communications:view')) return <AccessDenied />;

  const totalEmailsSent = MOCK_EMAIL_CAMPAIGNS.reduce((sum, c) => sum + c.sent, 0);
  const avgOpenRate = MOCK_EMAIL_CAMPAIGNS.reduce((sum, c) => sum + c.openRate, 0) / MOCK_EMAIL_CAMPAIGNS.length;
  const avgClickRate = MOCK_EMAIL_CAMPAIGNS.reduce((sum, c) => sum + c.clickRate, 0) / MOCK_EMAIL_CAMPAIGNS.length;
  const totalSMSSent = MOCK_SMS_CAMPAIGNS.reduce((sum, c) => sum + c.sent, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
          Communications Hub
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
          Reach your congregation through email, SMS, push notifications, and in-app messaging.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Emails Sent</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{totalEmailsSent.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Avg Open Rate</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{avgOpenRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/20">
              <MousePointerClick className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">Avg Click Rate</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{avgClickRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="card-bordered p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
              <Smartphone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-dark-300">SMS Sent</p>
              <p className="text-xl font-bold text-slate-900 dark:text-dark-50">{totalSMSSent.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Campaigns */}
      <div className="card overflow-hidden">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-500" />
            Email Campaigns
          </div>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-dark-600">
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Campaign</th>
                <th className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Sent</th>
                <th className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Open Rate</th>
                <th className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Click Rate</th>
                <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-600">
              {MOCK_EMAIL_CAMPAIGNS.map((campaign) => (
                <tr key={campaign.subject} className="transition-colors hover:bg-slate-50 dark:hover:bg-dark-700">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-dark-50">{campaign.subject}</p>
                      <span className={cn("badge text-[10px]", STATUS_COLORS[campaign.status])}>{campaign.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600 dark:text-dark-200">{campaign.sent.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "text-sm font-medium",
                      campaign.openRate >= 60 ? "text-emerald-600 dark:text-emerald-400" :
                      campaign.openRate >= 40 ? "text-amber-600 dark:text-amber-400" :
                      "text-rose-600 dark:text-rose-400"
                    )}>{campaign.openRate}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "text-sm font-medium",
                      campaign.clickRate >= 25 ? "text-emerald-600 dark:text-emerald-400" :
                      campaign.clickRate >= 15 ? "text-amber-600 dark:text-amber-400" :
                      "text-slate-600 dark:text-dark-200"
                    )}>{campaign.clickRate}%</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500 dark:text-dark-300">{campaign.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SMS Campaigns */}
      <div className="card overflow-hidden">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-dark-50">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-emerald-500" />
            SMS &amp; Text Campaigns
          </div>
        </h3>
        <div className="space-y-3">
          {MOCK_SMS_CAMPAIGNS.map((sms) => (
            <div key={sms.message} className="rounded-lg border border-slate-100 p-4 dark:border-dark-600">
              <p className="text-sm text-slate-800 dark:text-dark-100">&ldquo;{sms.message}&rdquo;</p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span className="text-xs text-slate-500 dark:text-dark-300">
                  <span className="font-medium text-slate-700 dark:text-dark-200">{sms.sent.toLocaleString()}</span> sent
                </span>
                <span className="text-xs text-slate-500 dark:text-dark-300">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{sms.deliveryRate}%</span> delivered
                </span>
                <span className="text-xs text-slate-500 dark:text-dark-300">
                  <span className="font-medium text-blue-600 dark:text-blue-400">{sms.responseRate}%</span> responded
                </span>
                <span className="ml-auto text-xs text-slate-400 dark:text-dark-400">{sms.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
