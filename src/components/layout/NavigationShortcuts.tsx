"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const navMap: Record<string, string> = {
  d: "/",
  m: "/members",
  g: "/groups",
  v: "/visitors",
  w: "/worship",
  e: "/events",
  a: "/analytics",
  s: "/settings",
};

export default function NavigationShortcuts() {
  const router = useRouter();
  const waitingForG = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ignore if inside an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (waitingForG.current) {
        waitingForG.current = false;
        clearTimeout(timeout.current);
        const path = navMap[e.key.toLowerCase()];
        if (path) {
          e.preventDefault();
          router.push(path);
        }
        return;
      }

      if (e.key === "g" || e.key === "G") {
        waitingForG.current = true;
        // Reset after 1s if no second key
        timeout.current = setTimeout(() => {
          waitingForG.current = false;
        }, 1000);
      }
    }

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      clearTimeout(timeout.current);
    };
  }, [router]);

  return null;
}
