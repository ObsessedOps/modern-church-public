"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

let sessionId: string | null = null;

function getSessionId() {
  if (sessionId) return sessionId;
  if (typeof window !== "undefined") {
    sessionId = sessionStorage.getItem("mc_sid");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("mc_sid", sessionId);
    }
  }
  return sessionId;
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    if (pathname === lastTracked.current) return;
    lastTracked.current = pathname;

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pagePath: pathname,
        sessionId: getSessionId(),
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
