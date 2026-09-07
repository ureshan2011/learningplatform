"use client";

import { useState } from "react";
import { Button, Field, Input } from "@/components/ds";
import type { SignInCopy } from "./copy";
import { Spinner } from "./Spinner";

/**
 * Asks for a name once, after the account already exists — never demanded
 * from a returning student on the way in, and never able to block entry: a
 * failed save here still lets the student through (see `saveName` in
 * `SignInScreen`).
 */
export function NameStep({
  copy,
  busy,
  onSave,
  onSkip,
}: {
  copy: SignInCopy;
  busy: boolean;
  onSave: (name: string) => void;
  onSkip: () => void;
}) {
  const [name, setName] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(name);
      }}
      className="ict-step-enter mt-8 space-y-4"
      noValidate
    >
      <p className="text-sm text-ict-ink-300">{copy.nameTitle}</p>
      <Field label={copy.nameLabel} hint={copy.nameHint}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          enterKeyHint="go"
          placeholder={copy.namePlaceholder}
          aria-label={copy.nameLabel}
          autoFocus
        />
      </Field>
      <Button type="submit" size="lg" arrow="none" disabled={busy} className="w-full justify-center">
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Spinner />
            {copy.continueLabel}
          </span>
        ) : (
          copy.continueLabel
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="md"
        arrow="none"
        onClick={onSkip}
        disabled={busy}
        className="w-full justify-center"
      >
        {copy.skip}
      </Button>
    </form>
  );
}
