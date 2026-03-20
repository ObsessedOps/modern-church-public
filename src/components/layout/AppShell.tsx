"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomTabBar } from "./BottomTabBar";
import { GracePanel } from "./GracePanel";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { SearchOverlay } from "./SearchOverlay";
import Breadcrumbs from "./Breadcrumbs";
import KeyboardShortcuts from "./KeyboardShortcuts";
import ErrorBoundary from "@/components/ErrorBoundary";
import NavigationShortcuts from "./NavigationShortcuts";
import RouteProgress from "./RouteProgress";
import ScrollToTop from "./ScrollToTop";
import { useSidebarStore } from "@/stores/sidebar";
import { useGracePanelStore } from "@/stores/grace-panel";
import { Sparkles } from "lucide-react";
import { DemoBanner } from "./DemoBanner";

function GraceFab() {
  const { isOpen, toggle } = useGracePanelStore();
  if (isOpen) return null;
  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-600/40 active:scale-95 lg:bottom-8 lg:right-8"
      aria-label="Open Grace AI"
    >
      <Sparkles className="h-6 w-6" />
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isOpen = useSidebarStore((s) => s.isOpen);

  return (
    <div className="min-h-screen">
      <DemoBanner />
      <a
        href="#main-content"
        className="fixed left-2 top-2 z-[100] -translate-y-16 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>
      <Sidebar />
      <Topbar />
      <main
        id="main-content"
        className="pb-20 transition-all duration-200 ease-out lg:pb-6"
        style={{
          marginLeft: `var(--sidebar-ml, 0px)`,
        }}
      >
        {/* Inject the sidebar margin as a CSS custom property based on state */}
        <style>{`
          @media (min-width: 1024px) {
            #main-content {
              --sidebar-ml: ${isOpen ? "var(--sidebar-width)" : "68px"};
            }
          }
        `}</style>
        <div className="px-[var(--margin-x)] py-5 lg:py-6">
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
      <BottomTabBar />
      <GraceFab />
      <GracePanel />
      <ToastContainer />
      <SearchOverlay />
      <KeyboardShortcuts />
      <NavigationShortcuts />
      <RouteProgress />
      <ScrollToTop />
    </div>
  );
}
