import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

/**
 * Everything a student can reach without signing in is meant to be found —
 * that is the acquisition funnel. Everything behind a session is private by
 * definition and has no SEO value, so it is disallowed explicitly rather than
 * left to chance.
 *
 * No AI crawler is blocked. A student asking an assistant "best A/L ICT
 * tuition in Sinhala medium" should be able to find this the same way a Google
 * search would, and for a site this young an AI answer engine is a cheaper
 * route to a first visitor than competing for a decade-old backlink profile.
 *
 * The AI crawlers are named explicitly rather than left to the `*` rule
 * because robots.txt group matching is winner-takes-all: a crawler that finds
 * a group naming its own user-agent ignores `*` entirely. Naming them means
 * their access is a decision recorded here, not a side effect — and it stays
 * correct if the `*` group is ever tightened.
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

  /**
   * Two kinds of bot, deliberately treated the same.
   *
   * Training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended,
   * CCBot, Meta) read pages to build models. Retrieval crawlers (OAI-SearchBot,
   * Claude-SearchBot, ChatGPT-User, PerplexityBot, Claude-User) fetch pages to
   * answer a question someone is asking right now, and are the ones that can
   * actually send a student here today.
   *
   * Blocking the first group to protect content costs the second group too on
   * several of these vendors, since they share infrastructure — and this site's
   * free notes exist precisely to be found and quoted.
   */
  const aiCrawlers = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-SearchBot",
    "Claude-User",
    "anthropic-ai",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Applebot",
    "Applebot-Extended",
    "Bingbot",
    "CCBot",
    "meta-externalagent",
    "Amazonbot",
    "DuckAssistBot",
    "cohere-ai",
    "YouBot",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: aiCrawlers, allow: "/", disallow },
    ],
    sitemap: `${publicEnv.appUrl}/sitemap.xml`,
    host: publicEnv.appUrl,
  };
}
