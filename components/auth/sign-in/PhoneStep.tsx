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

      <ConsentNote copy={copy} />
    </form>
  );
}

/**
 * "By continuing you agree to our Terms and Privacy policy."
 *
 * Placed on the first step, under the button that acts on it, because this is
 * the moment an account comes into existence — most of these students are
 * under 18, and terms nobody was shown are terms that do not hold when a
 * parent disputes a charge or an account is closed for sharing a login.
 *
 * The sentence is one dictionary string carrying `{terms}` and `{privacy}`
 * markers rather than five glued fragments, so a translator sees a whole
 * sentence and Sinhala can put the links where its own word order wants them.
 *
 * Both open in a new tab. Navigating away mid-sign-in discards the reCAPTCHA
 * challenge and the attempt behind it, so a student who tapped "Terms" out of
 * curiosity would come back to a screen that has to start over.
 */
function ConsentNote({ copy }: { copy: SignInCopy }) {
  const label: Record<string, string> = {
    terms: copy.consentTerms,
    privacy: copy.consentPrivacy,
  };
  const href: Record<string, string> = { terms: "/terms", privacy: "/privacy" };

  return (
    <p className="text-center text-xs text-ict-ink-300">
      {copy.consent.split(/\{(terms|privacy)\}/).map((part, i) =>
        // Odd indices are the captured marker names; even ones are the text
        // between them. A marker a translation dropped simply does not appear.
        i % 2 === 1 ? (
          <a
            key={i}
            href={href[part]}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {label[part]}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}
