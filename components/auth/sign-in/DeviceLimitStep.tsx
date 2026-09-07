"use client";

import { Button, Card, Notice } from "@/components/ds";
import { Icon } from "@/components/ui/Icon";
import { interpolate } from "@/lib/i18n/dictionary";
import { formatDate } from "@/lib/format";
import type { BoundDeviceView } from "./machine";
import type { SignInCopy } from "./copy";
import { Spinner } from "./Spinner";

/**
 * The device cap, explained instead of announced.
 *
 * Shows which devices actually hold the slots, when each was last used, and —
 * usually — a button to free the stale one right here, rather than sending
 * the student to a teacher console they cannot open.
 */
export function DeviceLimitStep({
  copy,
  devices,
  canSwap,
  swapAvailableAt,
  busy,
  onSwap,
  onBack,
}: {
  copy: SignInCopy;
  devices: BoundDeviceView[];
  canSwap: boolean;
  swapAvailableAt?: number;
  busy: boolean;
  onSwap: () => void;
  onBack: () => void;
}) {
  const oldest = [...devices].sort((a, b) => a.lastSeenAt - b.lastSeenAt)[0];

  return (
    <div className="ict-step-enter mt-8">
      <Card variant="raised" radius="card" className="p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-ict-paper-50">
          <Icon name="smartphone" className="text-ict-orange-400" />
          {copy.deviceLimitTitle}
        </h2>
        <p className="mt-2 text-sm text-ict-ink-300">{copy.deviceLimitBody}</p>
        <ul className="mt-3 space-y-2 text-sm">
          {devices.map((device) => (
            <li
              key={`${device.label}-${device.lastSeenAt}`}
              className="flex items-center justify-between gap-3 rounded-ict-md border border-ict-border-dark px-3 py-2"
            >
              <span className="flex items-center gap-1.5 font-medium text-ict-paper-50">
                <Icon name="smartphone" className="!text-base text-ict-ink-300" />
                {device.label}
              </span>
              <span className="text-xs text-ict-ink-300">
                {interpolate(copy.deviceLastUsed, { date: formatDate(device.lastSeenAt) })}
              </span>
            </li>
          ))}
        </ul>

        {canSwap && oldest ? (
          <>
            <Button onClick={onSwap} disabled={busy} size="lg" arrow="none" className="mt-4 w-full justify-center">
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner />
                  {copy.deviceSwapping}
                </span>
              ) : (
                interpolate(copy.deviceSwapCta, { label: oldest.label })
              )}
            </Button>
            <p className="mt-2 text-xs text-ict-ink-300">{copy.deviceSwapHint}</p>
          </>
        ) : (
          <div className="mt-4">
            <Notice tone="warning">
              {swapAvailableAt
                ? interpolate(copy.deviceSwapCooldown, { date: formatDate(swapAvailableAt) })
                : copy.deviceAskTeacher}
            </Notice>
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="md"
          arrow="none"
          onClick={onBack}
          disabled={busy}
          className="mt-3 w-full justify-center"
        >
          {copy.back}
        </Button>
      </Card>
    </div>
  );
}
