"use client";

import { Button, Field, Input } from "@/components/ds";
import { formatWait } from "@/lib/auth/otp-budget";
import type { SignInCopy } from "./copy";
import { Spinner } from "./Spinner";

export function PhoneStep({
  copy,
  phone,
  onPhoneChange,
  onSubmit,
  busy,
  secondsLeft,
}: {
  copy: SignInCopy;
  phone: string;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
  secondsLeft: number;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="ict-step-enter mt-8 space-y-4"
      noValidate
    >
      <Field label={copy.phoneLabel}>
        <Input
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          prefix="+94"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="send"
          placeholder={copy.phonePlaceholder}
          aria-label={copy.phoneLabel}
          autoFocus
        />
      </Field>
      <Button
        type="submit"
        size="lg"
        arrow="none"
        disabled={busy || secondsLeft > 0}
        className="w-full justify-center"
      >
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Spinner />
            {copy.sending}
          </span>
        ) : secondsLeft > 0 ? (
          formatWait(secondsLeft)
        ) : (
          copy.sendCode
        )}
      </Button>
    </form>
  );
}
