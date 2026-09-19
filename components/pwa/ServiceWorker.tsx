"use client";

import { useEffect } from "react";

/**
 * Registers the service worker, and gets a new deploy onto the screen.
 *
 * Registration itself is three lines. The rest is the part that goes wrong if
 * it is left out: a service worker that has installed a new version sits in
 * `waiting` until every tab of the site is closed, which on a phone is
 * approximately never. A student would then keep running last week's chunks
 * for days after a fix shipped, and report the bug as still present.
 *
 * So a waiting worker is told to take over, and the page reloads once — once,
 * guarded by a flag, because `controllerchange` fires again for the worker
 * that reload installs and an unguarded reload there is an infinite loop.
 *
 * Nothing here blocks rendering: it runs after mount, and a browser with no
 * service-worker support (or a private window that refuses one) simply gets
 * the app exactly as it was before.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const promote = (registration: ServiceWorkerRegistration) => {
      const waiting = registration.waiting;
      // Only when a controller already exists: on a first-ever visit there is
      // nothing to replace, and reloading would be a pointless flash.
      if (waiting && navigator.serviceWorker.controller) waiting.postMessage("skip-waiting");
    };

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        promote(registration);
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed") promote(registration);
          });
        });
      })
      .catch(() => {
        // A refused registration is not something a student can act on, and
        // the app works without it.
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
