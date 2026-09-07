"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Field, Input } from "@/components/ds";
import { Icon } from "@/components/ui/Icon";
import { interpolate } from "@/lib/i18n/dictionary";
import { formatLocal } from "@/lib/phone";
import { formatWait } from "@/lib/auth/otp-budget";
import type { Attempt } from "./machine";
import type { SignInCopy } from "./copy";
import { Spinner } from "./Spinner";

/** After this many seconds with no code entered, the "SMS can be slow" line appears. */
const SLOW_SMS_AFTER_S = 45;

export function CodeStep({
  copy,
  attempt,
  status,
  code,
  onCodeChange,
  onVerify,
  onResend,
  onChangeNumber,
  onRetry,
  showRetry,
  secondsLeft,
  resending,
}: {
  copy: SignInCopy;
  attempt: Attempt;
  status: "waiting" | "verifying" | "opening";
  code: string;
  onCodeChange: (digits: string) => void;
  /** Called with the raw six digits — both by auto-verify and by a manual submit. */
  onVerify: (raw: string) => void;
  onResend: () => void;
  onChangeNumber: () => void;
  /** Retries opening the session for the already-verified code, no new SMS involved. */
  onRetry: () => void;
  showRetry: boolean;
  secondsLeft: number;
  resending: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prevWrongRef = useRef(attempt.wrongAttempts);
  const newestSentAt = attempt.sends.length > 0 ? attempt.sends[attempt.sends.length - 1].sentAt : 0;

  // A ticking clock, not derived state to keep resynced: `elapsedS` below is
  // computed fresh every render from `now` and `newestSentAt`, so a resend
  // (which moves `newestSentAt`) is reflected immediately without an effect
  // having to reset anything. Firebase's own `code-expired` is what actually
  // decides expiry — this is purely the "sent to … · Ns ago" display.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (status === "waiting") inputRef.current?.focus();
  }, [status]);

  // "Keep the digits in the field and select them" after a wrong code — so
  // the next keystroke naturally replaces the guess instead of appending to it.
  useEffect(() => {
    if (attempt.wrongAttempts > prevWrongRef.current) {
      inputRef.current?.select();
    }
    prevWrongRef.current = attempt.wrongAttempts;
  }, [attempt.wrongAttempts]);

  const busy = status === "verifying" || status === "opening";
  const elapsedS = Math.max(0, Math.floor((now - newestSentAt) / 1000));
  const ago = elapsedS < 60 ? `${elapsedS}s` : formatWait(elapsedS);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onVerify(code);
      }}
      className="ict-step-enter mt-8 space-y-4"
      noValidate
    >
      <Field
        label={copy.codeLabel}
        hint={interpolate(copy.sentTo, { phone: formatLocal(attempt.phone), ago })}
      >
        <Input
          ref={inputRef}
          size="lg"
          value={code}
          onChange={(e) => {
            // The fix for "auto-submits on the wrong digits": verify with the
            // event's own value, never with React state, which has not been
            // applied yet at this point in the same tick.
            const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
            onCodeChange(digits);
            if (digits.length === 6) onVerify(digits);
          }}
          readOnly={busy || showRetry}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          enterKeyHint="go"
          maxLength={6}
          placeholder="123456"
          aria-label={copy.codeLabel}
          autoFocus
        />
      </Field>

      {status === "waiting" && elapsedS >= SLOW_SMS_AFTER_S ? (
        <p className="text-xs text-ict-ink-300">{copy.slowSms}</p>
      ) : null}

      {showRetry ? (
        <Button type="button" onClick={onRetry} size="lg" arrow="none" className="w-full justify-center">
          {copy.retry}
        </Button>
      ) : (
        <Button
          type="submit"
          size="lg"
          arrow="none"
          disabled={busy || code.length < 6}
          className="w-full justify-center"
        >
          {status === "verifying" ? (
            <span className="inline-flex items-center gap-2">
              <Spinner />
              {copy.verifying}
            </span>
          ) : status === "opening" ? (
            <span className="inline-flex items-center gap-2">
              <Icon name="check_circle" className="!text-base" />
              {copy.opening}
            </span>
          ) : (
            copy.verify
          )}
        </Button>
      )}

      <Button
        type="button"
        variant="ghost"
        size="md"
        arrow="none"
        onClick={onResend}
        disabled={resending || secondsLeft > 0 || busy}
        className="w-full justify-center"
      >
        {resending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner />
            {copy.sending}
          </span>
        ) : secondsLeft > 0 ? (
          interpolate(copy.resendIn, { wait: formatWait(secondsLeft) })
        ) : (
          copy.resend
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="md"
        arrow="none"
        onClick={onChangeNumber}
        disabled={busy}
        className="w-full justify-center"
      >
        {copy.changeNumber}
      </Button>
    </form>
  );
}
