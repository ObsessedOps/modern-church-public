"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { mobileNav } from "@/lib/navigation";
import { NAV_PERMISSIONS } from "@/lib/rbac/nav-permissions";
import { usePermissions } from "@/components/providers/PermissionsProvider";
import { useGracePanelStore } from "@/stores/grace-panel";

export function BottomTabBar() {
  const pathname = usePathname();
  const toggleGrace = useGracePanelStore((s) => s.toggle);
  const { can } = usePermissions();

  const tabs = mobileNav.filter((item) => {
    const required = NAV_PERMISSIONS[item.id];
    return !required || can(required);
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t bg-white/95 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm dark:border-dark-600 dark:bg-dark-900/95 lg:hidden">
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
              className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 text-violet-600 active:opacity-70 dark:text-violet-400"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={tab.label}
            href={tab.path}
            className={cn(
              "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 active:opacity-70",
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
