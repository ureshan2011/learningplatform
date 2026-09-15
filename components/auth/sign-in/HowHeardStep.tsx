"use client";

import { useState } from "react";
import { Button, Card, Field, Input } from "@/components/ds";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { HowHeardSource } from "@/lib/types";
import type { SignInCopy } from "./copy";
import { Spinner } from "./Spinner";

const OPTIONS: { value: Exclude<HowHeardSource, "other">; icon: IconName; labelKey: keyof SignInCopy }[] = [
  { value: "friend", icon: "group", labelKey: "howHeardFriend" },
  { value: "youtube", icon: "play_circle", labelKey: "howHeardYoutube" },
  { value: "social", icon: "share", labelKey: "howHeardSocial" },
  { value: "messaging_group", icon: "send", labelKey: "howHeardMessagingGroup" },
  { value: "google", icon: "search", labelKey: "howHeardGoogle" },
];

/**
 * Asked once, right after the name step, on a brand-new account only — never
 * demanded of a returning student, and never able to block entry: skipping
 * or a failed save both still let the student through (see `saveHowHeard` /
 * `skipHowHeard` in `SignInScreen`).
 *
 * A tap on any fixed option saves and advances immediately — no separate
 * "Continue" needed — because the whole point is that this costs the student
 * as little as a name field they can also skip. "Other" is the one option
 * that needs a second tap, since it needs typed text first.
 */
export function HowHeardStep({
  copy,
  busy,
  onSave,
  onSkip,
}: {
  copy: SignInCopy;
  busy: boolean;
  onSave: (source: HowHeardSource, otherText?: string) => void;
  onSkip: () => void;
}) {
  const [picking, setPicking] = useState<HowHeardSource | null>(null);
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");

  function pick(source: HowHeardSource) {
    if (busy) return;
    setPicking(source);
    onSave(source);
  }

  return (
    <div className="ict-step-enter mt-8">
      <Card variant="raised" radius="card" className="p-5">
        <p className="text-sm text-ict-ink-300">{copy.howHeardTitle}</p>

        <div className="mt-4 space-y-2">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => pick(option.value)}
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-ict-md border border-ict-border-dark px-3.5 py-3 text-left text-sm font-medium text-ict-paper-50 transition-colors duration-[120ms] ease-ict hover:border-ict-ink-500 hover:bg-ict-ink-800 disabled:opacity-45"
            >
              <Icon name={option.icon} className="!text-base shrink-0 text-ict-ink-300" />
              <span className="min-w-0 flex-1">{copy[option.labelKey]}</span>
              {busy && picking === option.value ? <Spinner /> : null}
            </button>
          ))}

          {!showOther ? (
            <button
              type="button"
              onClick={() => setShowOther(true)}
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-ict-md border border-ict-border-dark px-3.5 py-3 text-left text-sm font-medium text-ict-paper-50 transition-colors duration-[120ms] ease-ict hover:border-ict-ink-500 hover:bg-ict-ink-800 disabled:opacity-45"
            >
              <Icon name="help" className="!text-base shrink-0 text-ict-ink-300" />
              <span className="min-w-0 flex-1">{copy.howHeardOther}</span>
            </button>
          ) : (
            <div className="rounded-ict-md border border-ict-border-dark p-3.5">
              <Field label={copy.howHeardOther}>
                <Input
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder={copy.howHeardOtherPlaceholder}
                  aria-label={copy.howHeardOther}
                  enterKeyHint="done"
                  autoFocus
                  maxLength={120}
                />
              </Field>
              <Button
                type="button"
                size="md"
                arrow="none"
                disabled={busy}
                onClick={() => {
                  setPicking("other");
                  onSave("other", otherText);
                }}
                className="mt-3 w-full justify-center"
              >
                {busy && picking === "other" ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner />
                    {copy.continueLabel}
                  </span>
                ) : (
                  copy.continueLabel
                )}
              </Button>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="md"
          arrow="none"
          onClick={onSkip}
          disabled={busy}
          className="mt-3 w-full justify-center"
        >
          {copy.skip}
        </Button>
      </Card>
    </div>
  );
}
