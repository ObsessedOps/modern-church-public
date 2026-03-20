"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function RouteProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathname = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Route changed — animate completion
      setProgress(100);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      prevPathname.current = pathname;
    }
    return () => clearTimeout(timerRef.current);
  }, [pathname]);

  // Intercept link clicks to show progress
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href === pathname) return;
      setVisible(true);
      setProgress(30);
      // Simulate progress
      setTimeout(() => setProgress(60), 100);
      setTimeout(() => setProgress(80), 300);
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[110] h-0.5">
      <div
        className="h-full bg-primary-600 shadow-sm shadow-primary-600/50 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
