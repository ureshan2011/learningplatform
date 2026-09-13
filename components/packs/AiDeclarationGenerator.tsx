"use client";

import { useState } from "react";
import { Card, Field, Input, SectionHeading } from "@/components/ds";
import { CopyButton } from "@/components/packs/CopyButton";

export interface AiDeclarationCopy {
  heading: string;
  toolLabel: string;
  toolPlaceholder: string;
  usesLabel: string;
  /** The checkbox wording, in the reader's language. */
  uses: { key: string; label: string }[];
  outputLabel: string;
  emptyHint: string;
  copyLabel: string;
  copiedLabel: string;
}

/**
 * Builds the declaration paragraph from what the student ticks.
 *
 * Pure client logic — it does not call an AI to write a statement about AI,
 * which would be both absurd and slow. The sentences are fixed; the student
 * chooses which of them are true.
 *
 * The output is English in both mediums on purpose: it is pasted into an
 * assignment that is marked in English, and a Sinhala paragraph in an English
 * submission is the kind of thing that gets queried.
 */
export function AiDeclarationGenerator({ copy }: { copy: AiDeclarationCopy }) {
  const [tool, setTool] = useState("");
  const [checked, setChecked] = useState<string[]>([]);

  function toggle(key: string) {
    setChecked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  const phrases = checked.map((key) => USE_PHRASES[key]).filter(Boolean);
  const toolName = tool.trim() || "an AI assistant";
  const paragraph = phrases.length > 0 ? buildParagraph(toolName, phrases) : "";

  return (
    <Card radius="card" className="p-5">
      <SectionHeading as="h3" className="!text-lg">
        {copy.heading}
      </SectionHeading>

      <div className="mt-4 space-y-4">
        <Field label={copy.toolLabel}>
          <Input
            value={tool}
            onChange={(e) => setTool(e.target.value)}
            maxLength={60}
            placeholder={copy.toolPlaceholder}
          />
        </Field>

        <div>
          <span className="mb-2 block text-sm font-medium text-ict-ink-300">{copy.usesLabel}</span>
          <div className="space-y-2">
            {copy.uses.map((use) => (
              <label key={use.key} className="flex items-start gap-2.5 text-sm text-ict-ink-200">
                <input
                  type="checkbox"
                  checked={checked.includes(use.key)}
                  onChange={() => toggle(use.key)}
                  className="mt-0.5 size-4 shrink-0 rounded border-ict-border-dark accent-ict-orange-500"
                />
                <span>{use.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-ict-ink-300">{copy.outputLabel}</span>
          {paragraph ? (
            <>
              <p className="rounded-ict-card border border-ict-border-dark bg-ict-ink-800 p-4 text-sm leading-relaxed text-ict-paper-50">
                {paragraph}
              </p>
              <div className="mt-3">
                <CopyButton text={paragraph} label={copy.copyLabel} copiedLabel={copy.copiedLabel} />
              </div>
            </>
          ) : (
            <p className="text-sm text-ict-ink-300">{copy.emptyHint}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * What each tick becomes in the paragraph.
 *
 * Keyed rather than taken from the label, so the English sentence is the same
 * whichever language the student read the checkbox in.
 */
const USE_PHRASES: Record<string, string> = {
  brainstorming: "brainstorm ideas and plan the structure",
  grammar: "check my grammar and spelling",
  summarising: "summarise sources I had already read myself",
  code: "explain and debug code that I wrote",
  translation: "translate my own notes into English",
};

function buildParagraph(toolName: string, phrases: string[]): string {
  return [
    `I used ${toolName} while preparing this assignment.`,
    `I used it to ${joinList(phrases)}.`,
    "The analysis, the argument and the final wording are my own.",
    "I opened and read every source I cite.",
    "I take full responsibility for the content of this submission.",
  ].join(" ");
}

function joinList(items: string[]): string {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
