"use client";

import dynamic from "next/dynamic";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomTabBar } from "./BottomTabBar";
import { ToastContainer } from "@/components/ui/ToastContainer";
import Breadcrumbs from "./Breadcrumbs";
import ErrorBoundary from "@/components/ErrorBoundary";
import RouteProgress from "./RouteProgress";
import ScrollToTop from "./ScrollToTop";
import { useSidebarStore } from "@/stores/sidebar";
import { useGracePanelStore } from "@/stores/grace-panel";
import { Sparkles } from "lucide-react";
import { DemoBanner } from "./DemoBanner";

// Lazy load overlay components — not needed on initial render
const GracePanel = dynamic(() => import("./GracePanel").then((m) => ({ default: m.GracePanel })), { ssr: false });
const SearchOverlay = dynamic(() => import("./SearchOverlay").then((m) => ({ default: m.SearchOverlay })), { ssr: false });
const KeyboardShortcuts = dynamic(() => import("./KeyboardShortcuts"), { ssr: false });
const NavigationShortcuts = dynamic(() => import("./NavigationShortcuts"), { ssr: false });
const GlobalCompose = dynamic(() => import("@/components/messaging/GlobalCompose").then((m) => ({ default: m.GlobalCompose })), { ssr: false });
const ProductTour = dynamic(() => import("./ProductTour").then((m) => ({ default: m.ProductTour })), { ssr: false });

function GraceFab() {
  const { isOpen, toggle } = useGracePanelStore();
  if (isOpen) return null;
  return (
    <button
      onClick={toggle}
      className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-600/40 active:scale-95 lg:bottom-8 lg:right-8"
      aria-label="Open Grace AI"
    >
      <Sparkles className="h-6 w-6" />
    </button>
  );
}

interface AppShellProps {
  children: React.ReactNode;
  campuses?: { id: string; name: string; slug: string }[];
  demoRoles?: Record<string, string>;
  activeDemoRole?: string;
  activeDemoRoleLabel?: string;
}

export function AppShell({ children, campuses = [], demoRoles, activeDemoRole = "", activeDemoRoleLabel = "" }: AppShellProps) {
  const isOpen = useSidebarStore((s) => s.isOpen);

  return (
    <>
      <DemoBanner />
      <div className="min-h-screen">
      <a
        href="#main-content"
        className="fixed left-2 top-2 z-[100] -translate-y-16 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>
      <Sidebar />
      <Topbar campuses={campuses} demoRoles={demoRoles} activeDemoRole={activeDemoRole} activeDemoRoleLabel={activeDemoRoleLabel} />
      <main
        id="main-content"
        className="pb-24 transition-all duration-200 ease-out lg:pb-6"
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
          <ErrorBoundary>
            <div className="animate-fade-up">{children}</div>
          </ErrorBoundary>
        </div>
      </main>
      <BottomTabBar />
      {/* <GraceFab /> — hidden for now */}
      <GracePanel />
      <ToastContainer />
      <SearchOverlay />
      <KeyboardShortcuts />
      <NavigationShortcuts />
      <GlobalCompose />
      <RouteProgress />
      <ScrollToTop />
      <ProductTour />
    </div>
    </>
  );
}
