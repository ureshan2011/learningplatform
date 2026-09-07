"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clientAuth } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/env";
import { collectDeviceSignals } from "@/lib/auth/device-client";
import { cooldownSeconds, recordSend, recordRateLimit } from "@/lib/auth/otp-budget";
import { toE164 } from "@/lib/phone";
import { interpolate } from "@/lib/i18n/dictionary";
import { track, identify } from "@/lib/analytics";
import { Icon } from "@/components/ui/Icon";
import { Notice as NoticeCard } from "@/components/ds";
import { signInReducer, initialState, type BoundDeviceView } from "./machine";
import { readAttempt, writeAttempt, clearAttempt } from "./attempt-store";
import { sendOtp, verifyAgainstSends, type FirebaseUser } from "./phone-auth";
import { errorNotice } from "./messages";
import { reasonText, type SignInCopy } from "./copy";
import { PhoneStep } from "./PhoneStep";
import { CodeStep } from "./CodeStep";
import { NameStep } from "./NameStep";
import { DeviceLimitStep } from "./DeviceLimitStep";
import { Spinner } from "./Spinner";

/** The last phone number that completed sign-in on this browser, prefilled next time. */
const LAST_PHONE_KEY = "ictclass.lastPhone";

type SessionApiResult =
  | { kind: "network_fail" }
  | { kind: "server_error" }
  | { kind: "device_limit"; devices: BoundDeviceView[]; canSwap: boolean; swapAvailableAt?: number }
  | { kind: "account_disabled" }
  | { kind: "other_error" }
  | { kind: "success"; isNewUser: boolean; role?: string };

/**
 * The sign-in screen: a phone number, a code, occasionally a name or a
 * device-limit choice. One reducer drives all of it — see `machine.ts` for
 * why that is what stops a wrong-code error and a signed-in success ever
 * appearing together.
 */
export function SignInScreen({
  next,
  referredBy,
  reason,
  copy,
}: {
  next: string;
  referredBy?: string;
  reason?: string;
  copy: SignInCopy;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(signInReducer, isFirebaseConfigured(), initialState);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);

  /** The Firebase user from a verified code — kept so a device-limit swap or a session-open retry never needs another SMS. */
  const firebaseUserRef = useRef<FirebaseUser | null>(null);
  const sendInFlightRef = useRef(false);
  const verifyInFlightRef = useRef(false);
  const openInFlightRef = useRef(false);
  const namingRef = useRef(false);
  /**
   * Once this tab has verified a code itself, the passive "am I already
   * signed in somewhere?" listener below must stop acting — otherwise it
   * races this tab's own session exchange and can stomp its state. Before
   * that point it stays live, which is what lets a *second* tab complete on
   * its own the moment sign-in finishes in this one.
   */
  const ownFlowRef = useRef(false);

  const banner = reasonText(copy, reason);

  // Keep the in-progress attempt in sessionStorage so a refresh on the code
  // step resumes it instead of throwing away a code that would still work.
  useEffect(() => {
    writeAttempt(state.attempt);
  }, [state.attempt]);

  // Restore: a code sent moments ago in this tab, a phone number that signed
  // in here before, or a browser that can already prove it signed in once —
  // all without asking for anything.
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    let cancelled = false;

    const attempt = readAttempt();
    if (attempt) {
      dispatch({ type: "RESTORE_ATTEMPT", attempt });
      // Deliberately synchronous: `sessionStorage` is browser-only, so this
      // has to run after mount rather than in the initial render (which the
      // server shares and must not disagree with) — there is no external
      // source to "subscribe" to here, just a one-time read right after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSecondsLeft(cooldownSeconds(attempt.phone));
    }

    try {
      const saved = window.localStorage.getItem(LAST_PHONE_KEY);
      if (saved) {
        const local = saved.replace("+94", "0");
        setPhone((current) => current || local);
      }
    } catch {
      // Private mode or blocked storage — nothing to prefill with.
    }

    const timeout = setTimeout(() => {
      // Never let a slow network hold the form hostage. Two seconds and the
      // student can start typing; if the restore lands later it still redirects.
      if (!cancelled) dispatch({ type: "RESTORE_TO_PHONE" });
    }, 2000);

    const unsubscribe = clientAuth().onAuthStateChanged(async (user) => {
      if (cancelled || ownFlowRef.current) return;
      if (!user) {
        dispatch({ type: "RESTORE_TO_PHONE" });
        return;
      }
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/auth/session", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken, device: collectDeviceSignals() }),
        });
        if (cancelled || ownFlowRef.current) return;
        if (res.ok) {
          dispatch({ type: "OPEN_DONE" });
          router.replace(next);
          router.refresh();
          return;
        }
      } catch {
        // Offline, or the device slot changed. Fall through to the form.
      }
      if (!cancelled) dispatch({ type: "RESTORE_TO_PHONE" });
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsubscribe();
    };
    // Deliberately mount-only: `next` and `router` are stable for the life of
    // this page, and re-subscribing on every render would let a stray render
    // tear down and rebuild the "second tab finished" listener mid-flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resend / send cooldown countdown, shared by the phone and code steps.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  /** One POST to `/api/auth/session`, with the one retry §3.5 asks for on a network failure or a 5xx. */
  async function postSession(
    user: FirebaseUser,
    options: { swapDevice?: boolean },
  ): Promise<SessionApiResult> {
    async function attempt(): Promise<Response> {
      const idToken = await user.getIdToken(true);
      return fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idToken,
          referredBy,
          swapDevice: options.swapDevice,
          device: collectDeviceSignals(),
        }),
      });
    }

    let res: Response | null = null;
    try {
      res = await attempt();
    } catch {
      res = null;
    }
    if (!res || res.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      try {
        res = await attempt();
      } catch {
        res = null;
      }
    }
    if (!res) return { kind: "network_fail" };
    if (res.status >= 500) return { kind: "server_error" };

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      isNewUser?: boolean;
      role?: "student" | "teacher" | "admin" | "parent";
      devices?: BoundDeviceView[];
      canSwap?: boolean;
      swapAvailableAt?: number;
    };

    if (!res.ok) {
      if (data.error === "device_limit") {
        return {
          kind: "device_limit",
          devices: data.devices ?? [],
          canSwap: Boolean(data.canSwap),
          swapAvailableAt: data.swapAvailableAt,
        };
      }
      if (data.error === "account_disabled") return { kind: "account_disabled" };
      return { kind: "other_error" };
    }

    clearAttempt();
    try {
      const e164 = toE164(phone) ?? state.attempt?.phone;
      if (e164) window.localStorage.setItem(LAST_PHONE_KEY, e164);
    } catch {
      // Private mode or blocked storage.
    }
    track(data.isNewUser ? "sign_up" : "login", { method: "phone", referred_by: referredBy });
    if (user.uid && data.role) identify(user.uid, data.role);

    return { kind: "success", isNewUser: Boolean(data.isNewUser), role: data.role };
  }

  function finishSuccess(isNewUser: boolean) {
    // Ask for a name once, after the account exists, instead of demanding it
    // from every returning student on the way in.
    if (isNewUser) {
      dispatch({ type: "OPEN_NEW_USER" });
      return;
    }
    dispatch({ type: "OPEN_DONE" });
    // A brief, visible "Signed in. Opening…" beat before navigating away, so
    // the screen never jumps straight from a spinner to a different page.
    window.setTimeout(() => {
      router.replace(next);
      router.refresh();
    }, 300);
  }

  async function openSession(user: FirebaseUser) {
    if (openInFlightRef.current) return;
    openInFlightRef.current = true;
    dispatch({ type: "OPEN_START" });
    const result = await postSession(user, {});
    openInFlightRef.current = false;

    if (result.kind === "network_fail" || result.kind === "server_error") {
      // Never worded as a wrong code — the code was fine, the session
      // exchange failed, and a retry needs no new SMS.
      dispatch({ type: "OPEN_FAILED", notice: { tone: "warning", text: copy.sessionFailed } });
    } else if (result.kind === "device_limit") {
      dispatch({
        type: "OPEN_DEVICE_LIMIT",
        devices: result.devices,
        canSwap: result.canSwap,
        swapAvailableAt: result.swapAvailableAt,
      });
    } else if (result.kind === "account_disabled") {
      dispatch({ type: "OPEN_ACCOUNT_DISABLED", notice: { tone: "danger", text: copy.accountDisabled } });
    } else if (result.kind === "other_error") {
      dispatch({ type: "OPEN_FAILED", notice: { tone: "danger", text: copy.genericError } });
    } else {
      finishSuccess(result.isNewUser);
    }
  }

  async function handleSwap() {
    const user = firebaseUserRef.current;
    if (!user || openInFlightRef.current) return;
    openInFlightRef.current = true;
    dispatch({ type: "SWAP_START" });
    const result = await postSession(user, { swapDevice: true });
    openInFlightRef.current = false;

    if (result.kind === "network_fail" || result.kind === "server_error") {
      dispatch({ type: "SWAP_FAILED", notice: { tone: "warning", text: copy.sessionFailed } });
    } else if (result.kind === "account_disabled") {
      dispatch({ type: "OPEN_ACCOUNT_DISABLED", notice: { tone: "danger", text: copy.accountDisabled } });
    } else if (result.kind === "success") {
      finishSuccess(result.isNewUser);
    } else {
      // A fresh device_limit (another tab swapped first) or any other
      // rejection — stay on this screen and say so plainly.
      dispatch({ type: "SWAP_FAILED", notice: { tone: "danger", text: copy.genericError } });
    }
  }

  async function handleSend(e164: string) {
    if (sendInFlightRef.current) return;
    sendInFlightRef.current = true;
    dispatch({ type: "SEND_START" });
    try {
      const verificationId = await sendOtp(e164);
      recordSend(e164);
      setSecondsLeft(cooldownSeconds(e164));
      dispatch({ type: "SEND_SUCCESS", phone: e164, verificationId, sentAt: Date.now() });
    } catch (err) {
      if (String((err as { code?: string })?.code ?? "").includes("too-many-requests")) {
        recordRateLimit(e164);
        setSecondsLeft(cooldownSeconds(e164));
      }
      dispatch({ type: "SEND_FAILURE", notice: errorNotice(err, copy) });
    } finally {
      sendInFlightRef.current = false;
    }
  }

  function handleSendCode() {
    const e164 = toE164(phone);
    if (!e164) {
      dispatch({ type: "SEND_FAILURE", notice: { tone: "danger", text: copy.invalidPhone } });
      return;
    }
    const wait = cooldownSeconds(e164);
    if (wait > 0) {
      setSecondsLeft(wait);
      return;
    }
    void handleSend(e164);
  }

  async function handleResend() {
    if (!state.attempt || sendInFlightRef.current || secondsLeft > 0) return;
    const e164 = state.attempt.phone;
    sendInFlightRef.current = true;
    dispatch({ type: "RESEND_START" });
    try {
      const verificationId = await sendOtp(e164);
      recordSend(e164);
      setSecondsLeft(cooldownSeconds(e164));
      dispatch({
        type: "RESEND_SUCCESS",
        verificationId,
        sentAt: Date.now(),
        notice: { tone: "info", text: copy.resent },
      });
    } catch (err) {
      if (String((err as { code?: string })?.code ?? "").includes("too-many-requests")) {
        recordRateLimit(e164);
        setSecondsLeft(cooldownSeconds(e164));
      }
      dispatch({ type: "RESEND_FAILURE", notice: errorNotice(err, copy) });
    } finally {
      sendInFlightRef.current = false;
    }
  }

  /**
   * The one path to Firebase for a typed code. Called with the raw digits —
   * from the input's own change event on auto-verify, or from `code` state on
   * a manual submit — never from stale React state, which is what let the
   * old screen verify the code that used to be in the field.
   */
  async function verify(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    if (digits.length !== 6) return;
    if (verifyInFlightRef.current) return;
    const attempt = state.attempt;
    if (!attempt) return;

    verifyInFlightRef.current = true;
    ownFlowRef.current = true;
    dispatch({ type: "VERIFY_START" });

    const outcome = await verifyAgainstSends(attempt.sends, digits);
    if (!outcome.ok) {
      verifyInFlightRef.current = false;
      if (outcome.kind === "expired") {
        dispatch({ type: "VERIFY_ERROR", notice: { tone: "warning", text: copy.expired } });
      } else if (outcome.kind === "wrong") {
        const willBeWrongCount = attempt.wrongAttempts + 1;
        dispatch({
          type: "VERIFY_WRONG",
          notice: {
            tone: "danger",
            text: willBeWrongCount >= 3 ? copy.wrongCodeAgain : copy.wrongCode,
          },
        });
      } else {
        dispatch({ type: "VERIFY_ERROR", notice: errorNotice(outcome.error, copy) });
      }
      return;
    }

    firebaseUserRef.current = outcome.user;
    verifyInFlightRef.current = false;
    await openSession(outcome.user);
  }

  function handleChangeNumber() {
    // Everything from the previous attempt has to go — a stale verification
    // id is exactly what made this button a dead end before.
    clearAttempt();
    dispatch({ type: "CHANGE_NUMBER" });
    setCode("");
  }

  async function saveName(name: string) {
    const user = firebaseUserRef.current;
    if (namingRef.current) return;
    namingRef.current = true;
    dispatch({ type: "NAME_START" });
    try {
      if (user && name.trim()) {
        const idToken = await user.getIdToken();
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken, name: name.trim(), device: collectDeviceSignals() }),
        });
      }
    } catch {
      // The account exists either way — a missing name must not block entry.
    } finally {
      namingRef.current = false;
      dispatch({ type: "NAME_DONE" });
      router.replace(next);
      router.refresh();
    }
  }

  function skipName() {
    dispatch({ type: "NAME_DONE" });
    router.replace(next);
    router.refresh();
  }

  if (state.phase.kind === "restoring") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-5 py-10">
        <Spinner className="size-6 border-ict-orange-500/30 border-t-ict-orange-500" />
        <p className="text-sm text-ict-ink-300">{copy.restoring}</p>
      </main>
    );
  }

  if (state.phase.kind === "done") {
    // A redirect is already in flight — nothing left to show.
    return <main className="min-h-dvh" />;
  }

  const showRetry = state.notice?.text === copy.sessionFailed;

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

      <h1 className="text-2xl font-bold text-ict-paper-50">{copy.title}</h1>
      <p className="mt-2 text-sm text-ict-ink-300">{copy.lead}</p>

      {banner ? (
        <p className="mt-4 flex items-start gap-2 rounded-ict-md border border-ict-border-dark bg-ict-ink-850 p-3 text-sm text-ict-paper-50">
          <Icon name="info" className="!text-base shrink-0 text-ict-ink-300" />
          <span>{banner}</span>
        </p>
      ) : null}

      {referredBy ? (
        <p className="mt-4 rounded-ict-md border border-ict-orange-500/30 bg-ict-orange-500/10 p-3 text-sm text-ict-orange-300">
          {interpolate(copy.referredBy, { code: referredBy })}
        </p>
      ) : null}

      {state.phase.kind === "phone" || state.phase.kind === "sending" ? (
        <PhoneStep
          copy={copy}
          phone={phone}
          onPhoneChange={(value) => {
            setPhone(value);
            // A cooldown outlives the page load. The moment the number is
            // complete, show what is still running on it rather than a Send
            // button that is only going to be refused.
            const e164 = toE164(value);
            setSecondsLeft(e164 ? cooldownSeconds(e164) : 0);
          }}
          onSubmit={handleSendCode}
          busy={state.phase.kind === "sending"}
          secondsLeft={secondsLeft}
        />
      ) : null}

      {state.phase.kind === "code" && state.attempt ? (
        <CodeStep
          copy={copy}
          attempt={state.attempt}
          status={state.phase.status}
          code={code}
          onCodeChange={setCode}
          onVerify={(raw) => void verify(raw)}
          onResend={() => void handleResend()}
          onChangeNumber={handleChangeNumber}
          onRetry={() => {
            const user = firebaseUserRef.current;
            if (user) void openSession(user);
          }}
          showRetry={showRetry}
          secondsLeft={secondsLeft}
          resending={state.busy}
        />
      ) : null}

      {state.phase.kind === "name" ? (
        <NameStep copy={copy} busy={state.busy} onSave={(n) => void saveName(n)} onSkip={skipName} />
      ) : null}

      {state.phase.kind === "device_limit" ? (
        <DeviceLimitStep
          copy={copy}
          devices={state.phase.devices}
          canSwap={state.phase.canSwap}
          swapAvailableAt={state.phase.swapAvailableAt}
          busy={state.busy}
          onSwap={() => void handleSwap()}
          onBack={() => dispatch({ type: "DEVICE_LIMIT_BACK" })}
        />
      ) : null}

      {/*
        One element, present for every phase — a resend from the code step
        needs it exactly as much as the first send from the phone step does.
        Placed here, right after the form, so a visible challenge (Google
        escalates to one only occasionally) renders in flow under the button
        the student just pressed rather than off-screen.
      */}
      <div id="recaptcha-container" />

      {state.notice ? (
        <div className="mt-4">
          <NoticeCard tone={state.notice.tone}>{state.notice.text}</NoticeCard>
        </div>
      ) : null}
    </main>
  );
}
