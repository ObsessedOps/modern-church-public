"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Sparkles, PanelLeftClose, PanelLeft, Cross } from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups, type NavItem } from "@/lib/navigation";
import { NAV_PERMISSIONS } from "@/lib/rbac/nav-permissions";
import { usePermissions } from "@/components/providers/PermissionsProvider";
import { useSidebarStore } from "@/stores/sidebar";
import { useGracePanelStore } from "@/stores/grace-panel";

function NavLink({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const isGrace = item.color === "grace";
  const isAlert = item.color === "alert";

  return (
    <Link
      href={item.path}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group flex items-center rounded-lg text-sm font-medium tracking-wide transition-colors",
        collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2.5",
        isActive
          ? isGrace
            ? "bg-violet-600/10 text-violet-600 dark:text-violet-400"
            : isAlert
              ? "bg-rose-600/10 text-rose-600 dark:text-rose-400"
              : "bg-primary-600/10 text-primary-600 dark:text-primary-400"
          : "text-slate-600 hover:bg-slate-100 dark:text-dark-200 dark:hover:bg-dark-600",
        item.isStub && "opacity-40"
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0",
          isActive
            ? isGrace
              ? "text-violet-600 dark:text-violet-400"
              : isAlert
                ? "text-rose-600 dark:text-rose-400"
                : "text-primary-600 dark:text-primary-400"
            : "text-slate-400 group-hover:text-slate-600 dark:text-dark-300 dark:group-hover:text-dark-100"
        )}
      />
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          <span
            data-nav-badge={item.id}
            className="ml-auto rounded-badge bg-error/10 px-1.5 py-0.5 text-[10px] font-semibold text-error"
            style={{ display: "none" }}
          />
          {item.badge && (
            <span className="ml-auto rounded-badge bg-primary-600/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary-600 dark:text-primary-400">
              {item.badge}
            </span>
          )}
          {item.isStub && (
            <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-400">
              Soon
            </span>
          )}
        </>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, isMobileOpen, toggle, closeMobile } = useSidebarStore();
  const toggleGrace = useGracePanelStore((s) => s.toggle);
  const { can, user } = usePermissions();

  // Filter nav groups by permission
  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.hidden) return false;
        const required = NAV_PERMISSIONS[item.id];
        return !required || can(required);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const collapsed = !isOpen && !isMobileOpen;

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        style={
          {
            "--sb-w": collapsed ? "68px" : "var(--sidebar-width)",
          } as React.CSSProperties
        }
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[var(--sb-w)] flex-col border-r bg-white transition-all duration-200 ease-out dark:border-dark-600 dark:bg-dark-900 lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-[var(--topbar-height)] items-center border-b",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={closeMobile}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600">
              <Cross className="h-[18px] w-[18px] text-white" />
            </div>
            {!collapsed && (
              <span className="text-base font-bold tracking-tight text-slate-800 dark:text-dark-100">
                Modern.Church
              </span>
            )}
          </Link>

          {/* Close on mobile only */}
          <button
            onClick={closeMobile}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-dark-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Grace AI Quick Access */}
        <div className={cn("px-3 pt-4 pb-2", collapsed && "px-2")}>
          <button
            onClick={() => {
              toggleGrace();
              closeMobile();
            }}
            title={collapsed ? "Grace AI (⌘K)" : undefined}
            className={cn(
              "flex w-full items-center rounded-lg border border-violet-500/20 bg-violet-500/5 text-sm font-medium text-violet-600 transition-all hover:bg-violet-500/10 hover:shadow-sm dark:text-violet-400",
              collapsed
                ? "justify-center px-2 py-2.5"
                : "gap-3 px-3 py-2.5"
            )}
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span>Grace AI</span>
                <span className="ml-auto rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-500/70">
                  ⌘K
                </span>
              </>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Main navigation"
          className={cn(
            "custom-scrollbar flex-1 overflow-y-auto py-2",
            collapsed ? "px-2" : "px-3"
          )}
        >
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <div key={group.label}>
                {/* Section heading */}
                {!collapsed ? (
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-dark-400">
                    {group.label}
                  </p>
                ) : (
                  <div className="mx-auto mb-1 w-5 border-t border-slate-200 dark:border-dark-600" />
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      item.path === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.path);

                    return (
                      <div key={item.id} onClick={closeMobile}>
                        <NavLink
                          item={item}
                          isActive={isActive}
                          collapsed={collapsed}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer: collapse toggle + user */}
        <div className="border-t p-3 space-y-1">
          {/* Collapse / Expand toggle — desktop only */}
          <button
            onClick={toggle}
            className={cn(
              "hidden w-full items-center rounded-lg py-2 text-sm text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-700 dark:hover:text-dark-100 lg:flex",
              collapsed ? "justify-center px-2" : "gap-3 px-3"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>

          {/* User */}
          <Link
            href="/settings"
            className={cn(
              "flex items-center rounded-lg text-sm transition-colors hover:bg-slate-100 dark:hover:bg-dark-700",
              collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2"
            )}
            onClick={closeMobile}
            title={collapsed ? user.name : undefined}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
              {user.name
                ? user.name
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "U"}
            </div>
            {!collapsed && (
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-slate-800 dark:text-dark-100">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-slate-400 dark:text-dark-300">
                  {user.role
                    .split("_")
                    .map((w: string) => w.charAt(0) + w.slice(1).toLowerCase())
                    .join(" ")}
                </p>
              </div>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
