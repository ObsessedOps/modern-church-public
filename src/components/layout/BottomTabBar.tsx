"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { mobileNav } from "@/lib/navigation";
import { NAV_PERMISSIONS } from "@/lib/rbac/nav-permissions";
import { usePermissions } from "@/components/providers/PermissionsProvider";
import { useGracePanelStore } from "@/stores/grace-panel";

export function BottomTabBar() {
  const pathname = usePathname();
  const toggleGrace = useGracePanelStore((s) => s.toggle);
  const { can } = usePermissions();

  const filteredMobileNav = mobileNav.filter((item) => {
    const required = NAV_PERMISSIONS[item.id];
    return !required || can(required);
  });

  const tabs = [
    ...filteredMobileNav,
    { id: "more", label: "More", icon: MoreHorizontal, path: null as string | null, color: undefined as string | undefined },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t bg-white/95 backdrop-blur-sm dark:border-dark-600 dark:bg-dark-900/95 lg:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isGrace = tab.color === "grace";
        const isActive = tab.path
          ? tab.path === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.path)
          : false;

        if (isGrace) {
          return (
            <button
              key={tab.label}
              onClick={toggleGrace}
              className="flex flex-col items-center gap-1 text-violet-600 dark:text-violet-400"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        }

        if (tab.path === null) {
          return (
            <button
              key={tab.label}
              className="flex flex-col items-center gap-1 text-slate-400 dark:text-dark-300"
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={tab.label}
            href={tab.path}
            className={cn(
              "flex flex-col items-center gap-1",
              isActive
                ? "text-primary-600 dark:text-primary-400"
                : "text-slate-400 dark:text-dark-300"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
