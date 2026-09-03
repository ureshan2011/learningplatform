import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

/**
 * Everything a student can reach without signing in is meant to be found —
 * that is the acquisition funnel. Everything behind a session is private by
 * definition and has no SEO value, so it is disallowed explicitly rather than
 * left to chance.
 *
 * No AI crawler is singled out or blocked. GPTBot, ClaudeBot, PerplexityBot,
 * Google-Extended and the rest follow the same `*` rule as every search
 * engine: a student asking an AI assistant "best A/L ICT tuition" should be
 * able to find this the same way a Google search would.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/api/",
    "/dashboard",
    "/account",
    "/live/",
    "/pay/",
    "/subjects/",
    "/teacher/",
    "/receipt/",
    "/parent/",
    "/payments/success",
    "/payments/cancelled",
  ];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    sitemap: `${publicEnv.appUrl}/sitemap.xml`,
  };
}
