"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { fetchWithSession } from "@/lib/auth/session-client";
import { Badge, IconBadge } from "@/components/ds";
import { formatDate } from "@/lib/format";
import type { ContentKind } from "@/lib/types";

export interface ContentRow {
  id: string;
  title: string;
  kind: ContentKind;
  subjectName: string;
  isPublic: boolean;
  createdAt: number;
}

const KIND_LABEL: Record<ContentKind, string> = {
  notes: "Notes",
  past_paper: "Past paper",
  marking_scheme: "Marking scheme",
  replay: "Class replay",
};

const KIND_ICON: Record<ContentKind, IconName> = {
  notes: "description",
  past_paper: "receipt_long",
  marking_scheme: "check_circle",
  replay: "videocam",
};

/** Everything uploaded so far, newest first, each removable in one tap. */
export function ContentList({ items }: { items: ContentRow[] }) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function remove(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setRemovingId(id);
    try {
      const res = await fetchWithSession(`/api/teacher/content/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      window.alert("Could not delete it. Try again.");
    } finally {
      setRemovingId(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-ict-ink-300">Nothing uploaded yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-ict-md border border-ict-border-dark bg-ict-ink-850 p-3.5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <IconBadge icon={KIND_ICON[item.kind]} tone="dark" size={40} round />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ict-paper-50">{item.title}</p>
              <p className="mt-0.5 truncate text-xs text-ict-ink-300">
                {item.subjectName} · {KIND_LABEL[item.kind]} · {formatDate(item.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge tone={item.isPublic ? "brand" : "neutral"}>{item.isPublic ? "Free" : "Paid only"}</Badge>
            <button
              type="button"
              onClick={() => remove(item.id, item.title)}
              disabled={removingId === item.id}
              aria-label={`Delete ${item.title}`}
              className="grid size-9 place-items-center rounded-full text-ict-ink-300 transition-colors duration-[120ms] hover:bg-ict-red-500/12 hover:text-ict-red-500 disabled:opacity-50"
            >
              <Icon name="delete" className="!text-base" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
