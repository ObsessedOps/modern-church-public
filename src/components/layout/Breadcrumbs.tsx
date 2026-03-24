"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const labelMap: Record<string, string> = {
  "": "Command Center",
  grace: "Grace",
  alerts: "Alerts",
  insights: "Insights",
  members: "Members",
  groups: "Groups",
  visitors: "Visitors",
  "connect-cards": "Connect Cards",
  worship: "Worship",
  giving: "Giving",
  volunteers: "Volunteers",
  events: "Events",
  campuses: "Campuses",
  communications: "Communications",
  analytics: "Analytics",
  staff: "Staff",
  compliance: "Compliance",
  settings: "Settings",
  pathways: "Pathways",
  "growth-track": "Growth Track",
  integrations: "Integrations",
  thresholds: "Thresholds",
};

// Context-aware labels for dynamic [id] segments based on parent route
const detailLabelMap: Record<string, string> = {
  members: "Profile",
  alerts: "Alert Details",
  insights: "Insight",
  groups: "Group Details",
  workflows: "Workflow",
};

// Detect CUID-like strings (start with c/C, 20+ alphanumeric chars)
function isCuid(seg: string): boolean {
  return /^c[a-z0-9]{19,}$/i.test(seg);
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    let label = labelMap[seg];
    if (!label && isCuid(seg)) {
      // Use parent route context for a friendly label
      const parent = segments[i - 1];
      label = detailLabelMap[parent] ?? "Details";
    }
    return {
      label: label ?? decodeURIComponent(seg).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: "/" + segments.slice(0, i + 1).join("/"),
      isLast: i === segments.length - 1,
    };
  });

  return (
    <nav className="flex items-center gap-1 text-xs text-slate-400 dark:text-dark-300">
      <Link
        href="/"
        className="flex items-center gap-1 transition-colors hover:text-primary-600 dark:hover:text-primary-400"
      >
        <Home className="h-3 w-3" />
      </Link>
      {crumbs.map((crumb) => (
        <div key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {crumb.isLast ? (
            <span className="font-medium text-slate-600 dark:text-dark-200">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="transition-colors hover:text-primary-600 dark:hover:text-primary-400"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
