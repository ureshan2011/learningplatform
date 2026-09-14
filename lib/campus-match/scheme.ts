import "server-only";

import scheme from "@/lib/content/ugc/scheme.json";

/**
 * What the published handbook says about the admission scheme itself.
 *
 * Only Section 2 of the Courses of Study handbook is published, and it does not
 * state how the UGC works down an ordered preference list. That absence is
 * recorded in `scheme.json` rather than filled in, and it is read here so the
 * order builder can say so in its own words instead of implying a rule the
 * source does not carry.
 */

export interface SchemeRule {
  rule: string;
  text: string;
  handbookPage?: number;
}

export function schemeRule(name: string): SchemeRule | undefined {
  return scheme.rules.find((r) => r.rule === name);
}

/** True where the handbook does not state this, and the product must not either. */
export function schemeUnstated(field: string): boolean {
  return scheme.notFound.some((n) => n.field === field);
}

export const SCHEME_COVER_YEAR = scheme.coverYear;
