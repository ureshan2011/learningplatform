"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User as FirebaseUser,
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/env";
import { collectDeviceSignals } from "@/lib/auth/device-client";
import { toE164, formatLocal } from "@/lib/phone";
import { formatDate } from "@/lib/format";
import { track, identify } from "@/lib/analytics";
import { Icon } from "@/components/ui/Icon";

type Step = "restoring" | "phone" | "code" | "name";

interface BoundDeviceView {
  label: string;
  lastSeenAt: number;
}

interface DeviceLimit {
  devices: BoundDeviceView[];
  canSwap: boolean;
  swapAvailableAt?: number;
}

/** Seconds before "Resend code" becomes tappable. Every resend is a billed SMS. */
const RESEND_SECONDS = 45;

/** Resends per page load. Beyond this the SMS is not arriving and another one will not help. */
const MAX_RESENDS = 3;

/**
 * Why the student was sent here, worded so the page never looks like it simply
 * forgot them. "Your sign-in expired" is a fact; a blank form after being
 * kicked out of a mock exam reads as a bug.
 */
const REASON_COPY: Record<string, { si: string; en: string }> = {
  expired: {
    si: "ඔබේ පිවිසුම කල් ඉකුත් වී ඇත. නැවත පිවිසෙන්න — තත්පර කිහිපයයි.",
    en: "Your sign-in expired. Sign in again — it only takes a moment.",
  },
  revoked: {
    si: "ඔබේ ගිණුම සියලුම උපාංගවලින් ඉවත් කර ඇත. නැවත පිවිසෙන්න.",
    en: "You were signed out on every device. Sign in again.",
  },
  device_released: {
    si: "ඔබේ ගුරුවරයා මෙම උපාංගය ඉවත් කර ඇත. නැවත පිවිසෙන්න.",
    en: "Your teacher removed this device. Sign in again to use it.",
  },
  account_disabled: {
    si: "මෙම ගිණුම තාවකාලිකව අක්‍රියයි. ඔබේ ගුරුවරයා අමතන්න.",
    en: "This account is switched off. Please contact your teacher.",
  },
  invalid: {
    si: "ඔබේ පිවිසුම තහවුරු කළ නොහැකි විය. නැවත පිවිසෙන්න.",
    en: "We could not confirm your sign-in. Please sign in again.",
  },
};

export function SignInForm({
  next,
  referredBy,
  reason,
}: {
  next: string;
  referredBy?: string;
  reason?: string;
}) {
  const router = useRouter();
  // Starts at "restoring" only when there is a Firebase to restore from. The
  // value is identical on the server and the client (the config is inlined at
  // build time), so this cannot cause a hydration mismatch.
  const [step, setStep] = useState<Step>(() =>
    isFirebaseConfigured() ? "restoring" : "phone",
  );
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceLimit, setDeviceLimit] = useState<DeviceLimit | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resends, setResends] = useState(0);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  /** Kept so the device-limit retry can mint a fresh ID token without another SMS. */
  const firebaseUserRef = useRef<FirebaseUser | null>(null);

  const banner = reason ? REASON_COPY[reason] : undefined;

  /**
   * Tears the invisible reCAPTCHA down.
   *
   * It must happen after *every* send, not only after a failed one. A verifier
   * is single-use: keeping the consumed instance meant that tapping "Change
   * number" and sending again threw on an already-rendered widget, showed the
   * raw Firebase error in English, and left the student with no way forward
   * except reloading the page — which nobody thinks to do.
   */
  const resetVerifier = useCallback(() => {
    try {
      verifierRef.current?.clear();
    } catch {
      // Already torn down, or the container is gone. Nothing to recover.
    }
    verifierRef.current = null;
  }, []);

  /**
   * Restores the session without an SMS, when the browser can prove it already
   * signed in once.
   *
   * The Firebase refresh token outlives the session cookie by a wide margin, so
   * a student whose cookie lapsed is almost never a student who needs to
   * re-verify their phone — they just need a new cookie. This is what turns the
   * most common trip to this page into a redirect they never see.
   */
  useEffect(() => {
    let cancelled = false;

    // `clientAuth()` throws when Firebase config is missing, and throwing from
    // an effect blanks the page. A misconfigured deploy should still render the
    // form and fail with a readable message when the student taps Send.
    if (!isFirebaseConfigured()) return;

    const timeout = setTimeout(() => {
      // Never let a slow network hold the form hostage. Two seconds and the
      // student can start typing; if the restore lands later it still redirects.
      if (!cancelled) setStep((s) => (s === "restoring" ? "phone" : s));
    }, 2000);

    const unsubscribe = clientAuth().onAuthStateChanged(async (user) => {
      if (cancelled) return;
      if (!user) {
        setStep((s) => (s === "restoring" ? "phone" : s));
        return;
      }
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/auth/session", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken, device: collectDeviceSignals() }),
        });
        if (cancelled) return;
        if (res.ok) {
          router.replace(next);
          router.refresh();
          return;
        }
      } catch {
        // Offline, or the device slot is gone. Fall through to the form.
      }
      if (!cancelled) setStep((s) => (s === "restoring" ? "phone" : s));
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [next, router]);

  // Resend countdown.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  // Focus follows the step. On a phone this is the difference between one tap
  // and three, twice per sign-in.
  useEffect(() => {
    if (step === "phone") phoneInputRef.current?.focus();
    if (step === "code") codeInputRef.current?.focus();
  }, [step]);

  async function send(e164: string) {
    const auth = clientAuth();
    resetVerifier();
    verifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
    confirmationRef.current = await signInWithPhoneNumber(auth, e164, verifierRef.current);
    resetVerifier();
    setSecondsLeft(RESEND_SECONDS);
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDeviceLimit(null);

    const e164 = toE164(phone);
    if (!e164) {
      setError("වලංගු ශ්‍රී ලාංකික ජංගම අංකයක් ඇතුළත් කරන්න · Enter a valid Sri Lankan mobile number, e.g. 077 123 4567.");
      return;
    }

    setBusy(true);
    try {
      await send(e164);
      setStep("code");
    } catch (err) {
      setError(messageFor(err));
      resetVerifier();
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (secondsLeft > 0 || resends >= MAX_RESENDS) return;
    const e164 = toE164(phone);
    if (!e164) return;

    setError(null);
    setBusy(true);
    try {
      await send(e164);
      setResends((n) => n + 1);
      setCode("");
      codeInputRef.current?.focus();
    } catch (err) {
      setError(messageFor(err));
      resetVerifier();
    } finally {
      setBusy(false);
    }
  }

  /** Exchanges a verified Firebase user for our session cookie. Shared by verify and swap. */
  async function openSession(user: FirebaseUser, options: { swapDevice?: boolean } = {}) {
    const idToken = await user.getIdToken(true);
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        idToken,
        referredBy,
        swapDevice: options.swapDevice,
        device: collectDeviceSignals(),
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      isNewUser?: boolean;
      role?: "student" | "teacher" | "admin" | "parent";
      name?: string;
      devices?: BoundDeviceView[];
      canSwap?: boolean;
      swapAvailableAt?: number;
    };

    if (!res.ok) {
      if (data.error === "device_limit") {
        setDeviceLimit({
          devices: data.devices ?? [],
          canSwap: Boolean(data.canSwap),
          swapAvailableAt: data.swapAvailableAt,
        });
        return;
      }
      if (data.error === "account_disabled") {
        setError("මෙම ගිණුම අක්‍රියයි · This account is switched off. Please contact your teacher.");
        return;
      }
      throw new Error("could_not_sign_in");
    }

    setDeviceLimit(null);
    track(data.isNewUser ? "sign_up" : "login", { method: "phone", referred_by: referredBy });
    if (user.uid && data.role) identify(user.uid, data.role);

    // Ask for a name once, after the account exists, instead of demanding it
    // from every returning student on the way in.
    if (data.isNewUser) {
      setStep("name");
      return;
    }

    router.replace(next);
    router.refresh();
  }

  async function verifyCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const confirmation = confirmationRef.current;
      if (!confirmation) throw new Error("no_confirmation");

      const credential = await confirmation.confirm(code.replace(/\D/g, "").slice(0, 6));
      firebaseUserRef.current = credential.user;
      await openSession(credential.user);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmSwap() {
    const user = firebaseUserRef.current;
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await openSession(user, { swapDevice: true });
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const user = firebaseUserRef.current;
    setBusy(true);
    try {
      if (user && name.trim()) {
        const idToken = await user.getIdToken();
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken, name: name.trim(), device: collectDeviceSignals() }),
        });
      }
      router.replace(next);
      router.refresh();
    } catch {
      // The account exists either way — a missing name must not block entry.
      router.replace(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (step === "restoring") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-5 py-10">
        <Spinner className="size-6 border-(--color-awaken-accent)/30 border-t-(--color-awaken-accent)" />
        <p className="text-sm text-(--color-awaken-ink-soft)">පිවිසෙමින්… · Signing you in…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2 self-start">
        <span className="grid size-8 place-items-center rounded-ict-sm bg-ict-orange-500 text-white">
          <Icon name="school" className="!text-lg" />
        </span>
        <span className="font-display text-base font-extrabold tracking-[-0.02em] text-ict-paper-50">
          ICT<span className="text-ict-orange-500">CAMPUS</span>
        </span>
      </Link>

      <h1 className="text-2xl font-bold">පිවිසෙන්න · Sign in</h1>
      <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
        SMS මගින් එක් වරක් භාවිත කළ හැකි කේතයක් එවනවා. ඔබේ දුරකථන අංකයම ඔබේ ගිණුමයි.
        <span className="mt-1 block">
          We send a one-time code by SMS. Your phone number is your account.
        </span>
      </p>

      {banner ? (
        <p className="mt-4 flex gap-2 rounded-ict-md border border-ict-border-dark bg-ict-ink-850 p-3 text-sm">
          <Icon name="info" className="!text-base shrink-0 text-(--color-awaken-ink-soft)" />
          <span>
            {banner.si}
            <span className="mt-0.5 block text-(--color-awaken-ink-soft)">{banner.en}</span>
          </span>
        </p>
      ) : null}

      {referredBy ? (
        <p className="mt-4 rounded-ict-md border border-ict-orange-500/30 bg-ict-orange-500/10 p-3 text-sm text-ict-orange-300">
          You were invited with code {referredBy} — sign up and you&apos;ll both get 3 free days.
        </p>
      ) : null}

      {deviceLimit ? (
        <DeviceLimitPanel
          limit={deviceLimit}
          busy={busy}
          onSwap={confirmSwap}
          onCancel={() => setDeviceLimit(null)}
        />
      ) : step === "phone" ? (
        <form onSubmit={sendCode} className="mt-8 space-y-4" noValidate>
          <Field label="ජංගම දුරකථන අංකය · Mobile number">
            <div className="flex items-center rounded-ict-sm border border-ict-border-dark bg-ict-ink-800 focus-within:border-ict-orange-500">
              <span className="select-none border-r border-ict-border-dark px-3 py-3 text-base text-ict-ink-300">
                +94
              </span>
              <input
                ref={phoneInputRef}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="send"
                placeholder="077 123 4567"
                aria-label="Mobile number"
                className="w-full bg-transparent px-3 py-3 text-base text-ict-paper-50 placeholder:text-ict-ink-400 outline-none"
              />
            </div>
          </Field>
          <button type="submit" disabled={busy} className={buttonClass}>
            {busy ? (
              <span className="inline-flex w-full items-center justify-center gap-2">
                <Spinner />
                එවමින්… Sending…
              </span>
            ) : (
              "කේතය එවන්න · Send code"
            )}
          </button>
        </form>
      ) : step === "code" ? (
        <form onSubmit={verifyCode} className="mt-8 space-y-4" noValidate>
          <Field
            label="සත්‍යාපන කේතය · Verification code"
            hint={`${formatLocal(toE164(phone) ?? phone)} වෙත එවා ඇත · sent to this number`}
          >
            <input
              ref={codeInputRef}
              value={code}
              onChange={(e) => {
                // Students paste the whole SMS ("Your code is 123456"). Keep
                // the digits, drop everything else, and submit the moment six
                // of them are present — the extra "Verify" tap is pure friction.
                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(digits);
                if (digits.length === 6 && !busy) {
                  queueMicrotask(() => void verifyCode());
                }
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              enterKeyHint="go"
              maxLength={6}
              placeholder="123456"
              aria-label="Verification code"
              className={`${inputClass} text-center text-xl tracking-[0.5em]`}
            />
          </Field>
          <button type="submit" disabled={busy || code.length < 6} className={buttonClass}>
            {busy ? (
              <span className="inline-flex w-full items-center justify-center gap-2">
                <Spinner />
                පරීක්ෂා කරමින්… Verifying…
              </span>
            ) : (
              "ඉදිරියට · Verify and continue"
            )}
          </button>

          <div className="rounded-ict-md border border-ict-border-dark bg-ict-ink-850 p-3 text-sm">
            {resends >= MAX_RESENDS ? (
              <p className="text-(--color-awaken-ink-soft)">
                SMS ලැබුණේ නැද්ද? සංඥාව ඇති තැනකට ගොස් පිටුව නැවත විවෘත කරන්න.
                <span className="mt-0.5 block">
                  Still no SMS? Move somewhere with better signal and reload this page.
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={resend}
                disabled={busy || secondsLeft > 0}
                className="font-semibold text-(--color-awaken-deep) underline disabled:text-(--color-awaken-ink-soft) disabled:no-underline"
              >
                {secondsLeft > 0
                  ? `කේතය නැවත එවන්න · Resend code (${secondsLeft}s)`
                  : "කේතය නැවත එවන්න · Resend code"}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              // Everything from the previous attempt has to go: a consumed
              // verifier and a stale confirmation are exactly what made this
              // button a dead end before.
              resetVerifier();
              confirmationRef.current = null;
              setStep("phone");
              setCode("");
              setError(null);
              setSecondsLeft(0);
            }}
            className="w-full text-sm text-(--color-awaken-ink-soft) underline"
          >
            අංකය වෙනස් කරන්න · Change number
          </button>
        </form>
      ) : (
        <form onSubmit={saveName} className="mt-8 space-y-4" noValidate>
          <p className="text-sm text-(--color-awaken-ink-soft)">
            සාදරයෙන් පිළිගනිමු! ඔබේ නම කුමක්ද? · Welcome! What should we call you?
          </p>
          <Field label="ඔබේ නම · Your name" hint="Shown on the class leaderboard.">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              enterKeyHint="go"
              autoFocus
              placeholder="Nimal Perera"
              className={inputClass}
            />
          </Field>
          <button type="submit" disabled={busy} className={buttonClass}>
            {busy ? (
              <span className="inline-flex w-full items-center justify-center gap-2">
                <Spinner />
                ඉදිරියට…
              </span>
            ) : (
              "ඉදිරියට · Continue"
            )}
          </button>
        </form>
      )}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-(--color-awaken-danger-soft) p-3 text-sm text-(--color-awaken-danger)"
        >
          {error}
        </p>
      ) : null}

      <div id="recaptcha-container" />
    </main>
  );
}

/**
 * The device cap, explained instead of announced.
 *
 * This screen used to be one red sentence telling the student to go to "Teacher
 * console → Device reset" — a page they will never be able to open, about a
 * person who may be teaching. Now it shows which devices actually hold the
 * slots, and lets them free the stale one themselves.
 */
function DeviceLimitPanel({
  limit,
  busy,
  onSwap,
  onCancel,
}: {
  limit: DeviceLimit;
  busy: boolean;
  onSwap: () => void;
  onCancel: () => void;
}) {
  const oldest = [...limit.devices].sort((a, b) => a.lastSeenAt - b.lastSeenAt)[0];

  return (
    <div className="mt-8 rounded-xl border border-(--color-awaken-line) bg-(--color-awaken-card) p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <Icon name="smartphone" className="text-(--color-awaken-accent)" />
        උපාංග ගණන සම්පූර්ණයි · Device limit reached
      </h2>
      <p className="mt-2 text-sm text-(--color-awaken-ink-soft)">
        ඔබේ ගිණුම දැනටමත් මෙම උපාංගවල භාවිත වේ · Your account is already in use on these devices:
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        {limit.devices.map((device) => (
          <li
            key={`${device.label}-${device.lastSeenAt}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-(--color-awaken-line) px-3 py-2"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Icon name="smartphone" className="!text-base text-(--color-awaken-ink-soft)" />
              {device.label}
            </span>
            <span className="text-xs text-(--color-awaken-ink-soft)">
              last used {formatDate(device.lastSeenAt)}
            </span>
          </li>
        ))}
      </ul>

      {limit.canSwap && oldest ? (
        <>
          <button
            onClick={onSwap}
            disabled={busy}
            className={`${buttonClass} mt-4`}
          >
            {busy ? (
              <span className="inline-flex w-full items-center justify-center gap-2">
                <Spinner />
                ඉවත් කරමින්…
              </span>
            ) : (
              `Sign out “${oldest.label}” and use this device`
            )}
          </button>
          <p className="mt-2 text-xs text-(--color-awaken-ink-soft)">
            සතියකට එක් වරක් පමණක් මෙය කළ හැක · You can do this once a week. Your other devices stay
            signed in.
          </p>
        </>
      ) : (
        <p className="mt-4 rounded-lg bg-(--color-awaken-danger-soft) p-3 text-sm text-(--color-awaken-danger)">
          {limit.swapAvailableAt
            ? `You already swapped a device recently. You can swap again after ${formatDate(limit.swapAvailableAt)}, or ask your teacher to free a slot now.`
            : "Ask your teacher to free a device slot."}
        </p>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="mt-3 w-full text-sm text-(--color-awaken-ink-soft) underline"
      >
        ආපසු · Back
      </button>
    </div>
  );
}

const inputClass =
  "w-full rounded-ict-sm border border-ict-border-dark bg-ict-ink-800 px-4 py-3 text-base text-ict-paper-50 placeholder:text-ict-ink-400 outline-none focus:border-ict-orange-500";
// A full-width pill, per the system: flat orange, never a gradient.
const buttonClass =
  "ict-press w-full rounded-full bg-ict-orange-500 px-4 py-3 font-semibold text-white shadow-ict-brand transition-colors duration-[120ms] hover:bg-ict-orange-600 disabled:opacity-45";

/** Spins while a phone verification round trip (SMS send or code check) is in flight. */
function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={
        className ??
        "size-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
      }
    />
  );
}

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
      <span className="mb-1.5 block text-sm font-medium text-(--color-awaken-ink-soft)">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-(--color-awaken-ink-soft)">{hint}</span> : null}
    </label>
  );
}

/**
 * Turns anything that can go wrong into something a 16-year-old can act on.
 *
 * Never surfaces `err.message`: the unmapped case used to print "Failed to
 * fetch" — in English, on the flakiest step of the flow, to a student on mobile
 * data who has just been told to check their connection by a message that does
 * not say so.
 */
function messageFor(err: unknown): string {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "අන්තර්ජාල සම්බන්ධතාවයක් නැත · No internet. Turn on mobile data or Wi-Fi and try again.";
  }

  const code = (err as { code?: string })?.code ?? "";
  const name = (err as { message?: string })?.message ?? "";

  if (code.includes("invalid-verification-code")) return "එම කේතය වැරදියි · That code is not correct.";
  if (code.includes("code-expired")) return "කේතයේ කාලය ඉකුත් වී ඇත · That code expired. Tap resend.";
  if (code.includes("too-many-requests"))
    return "උත්සාහ කිරීම් වැඩියි · Too many attempts. Try again in a few minutes.";
  if (code.includes("invalid-phone-number"))
    return "දුරකථන අංකය වලංගු නැත · That phone number is not valid.";
  if (code.includes("operation-not-allowed") || code.includes("quota-exceeded"))
    return "SMS එවීම දැන් කළ නොහැක · SMS sign-in is unavailable right now. Please tell your teacher.";
  if (name === "no_confirmation")
    return "කේතයේ කාලය ඉකුත් වී ඇත · That code request expired. Enter your number again.";
  if (err instanceof TypeError)
    return "සම්බන්ධතාවය අඩාළ විය · Connection lost. Check your data and try again.";

  return "යමක් වැරදී ඇත · Something went wrong. Please try again.";
}
