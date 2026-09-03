"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/analytics";

/**
 * Logs a GA4 page_view on every route change.
 *
 * The Firebase Analytics SDK does not auto-track Next.js App Router
 * navigations (no full page load happens between them), so this replaces
 * that with an explicit event on every pathname/query change.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    track("page_view", {
      page_path: query ? `${pathname}?${query}` : pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
