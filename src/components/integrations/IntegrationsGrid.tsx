"use client";

import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Database,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  type: string;
  status: string;
  lastSyncAt: string | null;
  recordCount: number;
  createdAt: string;
}

interface IntegrationsGridProps {
  integrations: Integration[];
}

// Rich metadata for each platform
const platformMeta: Record<
  string,
  {
    name: string;
    description: string;
    category: string;
    logo: string;
    color: string;
    bgColor: string;
    dataTypes: string[];
    website: string;
  }
> = {
  CCB: {
    name: "Church Community Builder",
    description: "Member management, groups, attendance tracking, and family data",
    category: "Church Management",
    logo: "CCB",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    dataTypes: ["Members", "Families", "Groups", "Attendance", "Check-ins"],
    website: "churchcommunitybuilder.com",
  },
  PLANNING_CENTER: {
    name: "Planning Center",
    description: "Worship planning, scheduling, check-ins, and giving management",
    category: "Worship & Planning",
    logo: "PC",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    dataTypes: ["Services", "Songs", "Schedules", "Check-ins", "Giving"],
    website: "planningcenter.com",
  },
  MAILCHIMP: {
    name: "Mailchimp",
    description: "Email campaigns, newsletters, audience engagement metrics",
    category: "Email Marketing",
    logo: "MC",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10 dark:bg-yellow-500/20",
    dataTypes: ["Campaigns", "Subscribers", "Open Rates", "Click Rates"],
    website: "mailchimp.com",
  },
  TEXT_IN_CHURCH: {
    name: "Text In Church",
    description: "SMS communication, automated follow-ups, and response tracking",
    category: "SMS & Messaging",
    logo: "TiC",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-500/10 dark:bg-violet-500/20",
    dataTypes: ["SMS Campaigns", "Contacts", "Responses", "Automations"],
    website: "textinchurch.com",
  },
  MICROSOFT_365: {
    name: "Microsoft 365",
    description: "Staff email, calendars, documents, and team collaboration",
    category: "Productivity",
    logo: "M365",
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-500/10 dark:bg-sky-500/20",
    dataTypes: ["Staff Calendars", "Email", "Documents", "Teams"],
    website: "microsoft.com/microsoft-365",
  },
  SUBSPLASH: {
    name: "Subsplash",
    description: "Church app, streaming, media, and digital engagement",
    category: "App & Media",
    logo: "SS",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10 dark:bg-orange-500/20",
    dataTypes: ["App Users", "Streaming Views", "Media", "Push Notifications"],
    website: "subsplash.com",
  },
  QUICKBOOKS: {
    name: "QuickBooks",
    description: "Chart of accounts, expenses, payroll, and financial reporting",
    category: "Accounting",
    logo: "QB",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10 dark:bg-green-500/20",
    dataTypes: ["Transactions", "Accounts", "Expenses", "Payroll", "Reports"],
    website: "quickbooks.intuit.com",
  },
  VANCO: {
    name: "Vanco / Pushpay",
    description: "Digital giving, recurring donations, and donor management",
    category: "Online Giving",
    logo: "VP",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-500/10 dark:bg-teal-500/20",
    dataTypes: ["Transactions", "Recurring Gifts", "Donors", "Fund Reports"],
    website: "vancopayments.com",
  },
  PUSHPAY: {
    name: "Pushpay",
    description: "Mobile giving, donor engagement, and contribution tracking",
    category: "Online Giving",
    logo: "PP",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
    dataTypes: ["Transactions", "Recurring Gifts", "Donors"],
    website: "pushpay.com",
  },
  PROTECT_MY_MINISTRY: {
    name: "Protect My Ministry",
    description: "Background checks, volunteer screening, and safety compliance",
    category: "Safety & Compliance",
    logo: "PMM",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10 dark:bg-rose-500/20",
    dataTypes: ["Background Checks", "Clearance Status", "Expiration Dates"],
    website: "protectmyministry.com",
  },
};

const statusConfig = {
  CONNECTED: {
    label: "Connected",
    icon: CheckCircle2,
    classes: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20",
  },
  DISCONNECTED: {
    label: "Not Connected",
    icon: XCircle,
    classes: "text-slate-400 dark:text-dark-400",
    badgeBg: "bg-slate-50 border-slate-200 dark:bg-dark-700 dark:border-dark-500",
  },
  ERROR: {
    label: "Error",
    icon: AlertTriangle,
    classes: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20",
  },
  SYNCING: {
    label: "Syncing",
    icon: RefreshCw,
    classes: "text-blue-600 dark:text-blue-400 animate-spin",
    badgeBg: "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20",
  },
};

function timeAgo(date: string | null): string {
  if (!date) return "Never";
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function IntegrationsGrid({ integrations }: IntegrationsGridProps) {
  // Sort: connected first, then errors, then disconnected
  const sorted = [...integrations].sort((a, b) => {
    const order = { CONNECTED: 0, ERROR: 1, SYNCING: 2, DISCONNECTED: 3 };
    return (order[a.status as keyof typeof order] ?? 4) - (order[b.status as keyof typeof order] ?? 4);
  });

  return (
    <div className="space-y-8">
      {/* Connected integrations */}
      {sorted.some((i) => i.status === "CONNECTED" || i.status === "ERROR" || i.status === "SYNCING") && (
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
            Active Connections
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {sorted
              .filter((i) => i.status !== "DISCONNECTED")
              .map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
          </div>
        </div>
      )}

      {/* Available integrations */}
      {sorted.some((i) => i.status === "DISCONNECTED") && (
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
            Available to Connect
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {sorted
              .filter((i) => i.status === "DISCONNECTED")
              .map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const meta = platformMeta[integration.type] ?? {
    name: integration.type.replace(/_/g, " "),
    description: "External platform integration",
    category: "Other",
    logo: integration.type.slice(0, 2),
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-500/10 dark:bg-slate-500/20",
    dataTypes: [],
    website: "",
  };

  const status = statusConfig[integration.status as keyof typeof statusConfig] ?? statusConfig.DISCONNECTED;
  const StatusIcon = status.icon;
  const isConnected = integration.status === "CONNECTED";
  const isError = integration.status === "ERROR";

  return (
    <div
      className={cn(
        "card group relative overflow-hidden transition-all hover:shadow-lg",
        isError && "ring-1 ring-amber-400/30",
        isConnected && "ring-1 ring-emerald-400/10"
      )}
    >
      {/* Top gradient accent */}
      <div
        className={cn(
          "absolute left-0 right-0 top-0 h-1",
          isConnected && "bg-emerald-500",
          isError && "bg-amber-500",
          integration.status === "SYNCING" && "bg-blue-500",
          integration.status === "DISCONNECTED" && "bg-slate-300 dark:bg-dark-500"
        )}
      />

      {/* Header */}
      <div className="flex items-start gap-3 pt-2">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
            meta.bgColor,
            meta.color
          )}
        >
          {meta.logo}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50 truncate">
              {meta.name}
            </h3>
          </div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-dark-400">
            {meta.category}
          </p>
        </div>
        <div className={cn("flex items-center gap-1 rounded-full border px-2.5 py-1", status.badgeBg)}>
          <StatusIcon className={cn("h-3.5 w-3.5", status.classes)} />
          <span className={cn("text-[10px] font-medium", status.classes)}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs text-slate-500 dark:text-dark-300 line-clamp-2">
        {meta.description}
      </p>

      {/* Data types */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {meta.dataTypes.map((dt) => (
          <span
            key={dt}
            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-dark-600 dark:text-dark-200"
          >
            {dt}
          </span>
        ))}
      </div>

      {/* Stats (only for connected) */}
      {integration.status !== "DISCONNECTED" && (
        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 dark:border-dark-600">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-slate-400 dark:text-dark-400" />
            <span className="text-xs text-slate-600 dark:text-dark-200">
              {integration.recordCount.toLocaleString()} records
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400 dark:text-dark-400" />
            <span className="text-xs text-slate-600 dark:text-dark-200" suppressHydrationWarning>
              Synced {timeAgo(integration.lastSyncAt)}
            </span>
          </div>
        </div>
      )}

      {/* Error message */}
      {isError && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-500/10">
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            Sync failed — last successful sync was {timeAgo(integration.lastSyncAt)}. Check API credentials.
          </p>
        </div>
      )}

      {/* Action button */}
      <div className="mt-4">
        {integration.status === "DISCONNECTED" ? (
          <button className="btn btn-outline w-full gap-2 py-2 text-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            Connect {meta.name.split(" ")[0]}
          </button>
        ) : isError ? (
          <button className="btn w-full gap-2 bg-amber-600 py-2 text-xs text-white hover:bg-amber-700">
            <RefreshCw className="h-3.5 w-3.5" />
            Reconnect
          </button>
        ) : (
          <div className="flex gap-2">
            <button className="btn btn-soft flex-1 gap-1.5 py-2 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Sync Now
            </button>
            <button className="btn btn-outline px-3 py-2 text-xs">
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Settings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
