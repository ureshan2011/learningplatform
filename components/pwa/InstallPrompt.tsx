"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import { IconBadge } from "@/components/ds";
import { Icon } from "@/components/ui/Icon";

const DISMISSED_KEY = "ict-install-dismissed-at";
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const VISITS_KEY = "ict-install-visits";
// Skip the very first page load — a nudge to install lands better once
// someone has come back at least once than in the first second of a click
// from an ad or a WhatsApp link.
const MIN_VISITS_BEFORE_PROMPT = 2;
const SHOW_DELAY_MS = 2000;

type Variant = "install" | "ios";

/** Not yet in `lib.dom.d.ts` — Chromium-only event, feature-detected below. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * iOS (every browser on it — Safari, Chrome, Firefox — all run on WebKit and
 * share the same system Share sheet) has no `beforeinstallprompt` event.
 * "Install" only exists as manual Share → Add to Home Screen, so that is the
 * only thing the banner can tell someone to do there.
 */
function isIOSDevice() {
  const ua = window.navigator.userAgent;
  const isIPhoneFamily = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as "Macintosh" with touch support, so a touch-capable
  // "Mac" is actually an iPad.
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isIPhoneFamily || isIPadOS;
}

function dismissedRecently() {
  const raw = window.localStorage.getItem(DISMISSED_KEY);
  if (!raw) return false;
  const at = Number(raw);
  return Number.isFinite(at) && Date.now() - at < DISMISS_COOLDOWN_MS;
}

/**
 * A small, dismissible nudge to install the site as an app — the state of the
 * art here is not a native app or an iOS App Clip (both need an Apple
 * developer account and a codebase this project doesn't have) but a PWA
 * install prompt: same home-screen icon and full-screen window, and it works
 * from the manifest and service worker already shipped in `public/`.
 *
 * Styled as fixed dark chrome (literal ink, not the `ict-surface-*` role
 * tokens) on purpose, the same way `AppShell`'s bars are: this floats above
 * both the cream and dark worlds and has to read the same on either, rather
 * than blending into whichever one it happens to land on.
 */
export function InstallPrompt() {
  const [variant, setVariant] = useState<Variant | null>(null);
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || dismissedRecently()) return;

    const visits = Number(window.localStorage.getItem(VISITS_KEY)) || 0;
    window.localStorage.setItem(VISITS_KEY, String(Math.min(visits + 1, 99)));
    if (visits + 1 < MIN_VISITS_BEFORE_PROMPT) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const onBeforeInstall = (event: Event) => {
      // Stops Chromium's own mini-infobar so only this banner offers the install.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      timer = setTimeout(() => {
        setVariant("install");
        setVisible(true);
      }, SHOW_DELAY_MS);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    if (isIOSDevice()) {
      timer = setTimeout(() => {
        setVariant("ios");
        setVisible(true);
      }, SHOW_DELAY_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }, [deferred, dismiss]);

  if (!variant || !visible) return null;

  return (
    <div
      className={clsx(
        "ict-enter fixed inset-x-4 bottom-24 z-40",
        "md:inset-x-auto md:right-6 md:bottom-6 md:w-96",
        "flex items-start gap-3 rounded-ict-panel border border-ict-border-dark bg-ict-ink-900/95 p-4",
        "shadow-(--shadow-ict-inset) backdrop-blur-[14px]",
      )}
    >
      <IconBadge icon="school" tone="brand" size={40} />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold text-ict-paper-50">
          {variant === "install" ? "Install ICT Campus" : "Add to your Home Screen"}
        </p>
        <p className="mt-1 text-xs text-ict-ink-300">
          {variant === "install" ? (
            "One-tap access from your home screen, like an app — no app store needed."
          ) : (
            <>
              Tap <Icon name="share" className="!text-sm align-[-2px]" /> then &ldquo;Add to Home
              Screen&rdquo;.
            </>
          )}
        </p>
        {variant === "install" ? (
          <button
            type="button"
            onClick={install}
            className="ict-press mt-3 inline-flex h-8 items-center rounded-full bg-ict-orange-500 px-3.5 text-xs font-semibold text-white transition-colors duration-[120ms] ease-ict hover:bg-ict-orange-600"
          >
            Install
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 text-ict-ink-400 transition-colors duration-[120ms] ease-ict hover:bg-ict-ink-800 hover:text-ict-paper-50"
      >
        <Icon name="close" className="!text-base" />
      </button>
    </div>
  );
}
