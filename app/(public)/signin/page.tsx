"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { collectDeviceSignals } from "@/lib/auth/device-client";
import { toE164 } from "@/lib/phone";

type Step = "phone" | "code";

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referredBy, setReferredBy] = useState<string | undefined>(undefined);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  // Read from window.location rather than useSearchParams: this page is
  // entirely client-rendered, and useSearchParams would force a Suspense
  // boundary just to read a one-off referral code.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase();
    // One-off read of the URL on mount, not a sync loop — window is unavailable
    // during server render, so this can't move into the initial state without
    // causing a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ref) setReferredBy(ref);
  }, []);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const e164 = toE164(phone);
    if (!e164) {
      setError("Enter a valid Sri Lankan mobile number, e.g. 077 123 4567.");
      return;
    }

    setBusy(true);
    try {
      const auth = clientAuth();
      // The verifier must survive re-renders; recreating it invalidates the
      // pending challenge and the OTP silently never arrives.
      verifierRef.current ??= new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
      confirmationRef.current = await signInWithPhoneNumber(auth, e164, verifierRef.current);
      setStep("code");
    } catch (err) {
      setError(messageFor(err));
      // A failed attempt burns the reCAPTCHA token; force a fresh one.
      verifierRef.current?.clear();
      verifierRef.current = null;
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const confirmation = confirmationRef.current;
      if (!confirmation) throw new Error("Session expired. Request a new code.");

      const credential = await confirmation.confirm(code.trim());
      const idToken = await credential.user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idToken,
          name: name.trim() || undefined,
          referredBy,
          device: collectDeviceSignals(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Could not sign you in. Try again.");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="mt-2 text-sm text-white/60">
        We send a one-time code by SMS. Your phone number is your account.
      </p>

      {referredBy ? (
        <p className="mt-4 rounded-lg border border-[--color-brand]/30 bg-[--color-brand]/10 p-3 text-sm text-[--color-brand]">
          You were invited with code {referredBy} — sign up and you&apos;ll both get 3 free days.
        </p>
      ) : null}

      {step === "phone" ? (
        <form onSubmit={sendCode} className="mt-8 space-y-4">
          <Field label="Mobile number">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="077 123 4567"
              className={inputClass}
            />
          </Field>
          <Field label="Your name" hint="Shown on the class leaderboard.">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Nimal Perera"
              className={inputClass}
            />
          </Field>
          <button type="submit" disabled={busy} className={buttonClass}>
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-8 space-y-4">
          <Field label="Verification code" hint={`Sent to ${phone}`}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              className={`${inputClass} tracking-[0.4em]`}
            />
          </Field>
          <button type="submit" disabled={busy} className={buttonClass}>
            {busy ? "Verifying…" : "Verify and continue"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError(null);
            }}
            className="w-full text-sm text-white/50 underline"
          >
            Change number
          </button>
        </form>
      )}

      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div id="recaptcha-container" />
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-base outline-none focus:border-[--color-brand]";
const buttonClass =
  "w-full rounded-lg bg-[--color-brand] px-4 py-3 font-semibold text-black disabled:opacity-50";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/80">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-white/45">{hint}</span> : null}
    </label>
  );
}

function messageFor(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("invalid-verification-code")) return "That code is not correct.";
  if (code.includes("code-expired")) return "That code expired. Request a new one.";
  if (code.includes("too-many-requests")) return "Too many attempts. Try again in a few minutes.";
  if (code.includes("invalid-phone-number")) return "That phone number is not valid.";
  return err instanceof Error ? err.message : "Something went wrong. Try again.";
}
