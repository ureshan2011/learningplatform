/*
 * ICT Campus service worker.
 *
 * The app has been installable since the manifest was added, but with no
 * service worker behind it: a student on a bus, or on the 30 seconds of dead
 * signal between two cell towers, lost the whole app and got Chrome's dinosaur.
 *
 * ## What this deliberately does NOT do
 *
 * It never caches an HTML document, and it never touches `/api/`. This is an
 * authenticated app, often on a shared phone — a cached dashboard is one
 * student's timetable, XP and payment history served to whoever picks the
 * handset up next, and a cached API response is worse. Every gated byte stays
 * network-only and keeps going through `hasAccess()` on the server.
 *
 * So the win here is narrower than a blog's offline mode and worth more than
 * it sounds: the ~1MB of JavaScript, CSS and fonts that make up the shell load
 * from disk instead of over a 3G connection on every visit, and a failed
 * navigation lands on a page that explains itself rather than on a browser
 * error.
 *
 * ## Why everything cached here is safe to cache forever
 *
 * Only `/_next/static/**` and the icons are stored, and Next content-hashes
 * those filenames. A deploy produces new URLs rather than new contents at old
 * URLs, so a stale entry is never served — it is simply never asked for again.
 * `activate` then deletes caches from older versions of this file, and a size
 * cap stops the store growing across a year of deploys.
 */

const VERSION = "v1";
const ASSETS = `ict-assets-${VERSION}`;
const SHELL = `ict-shell-${VERSION}`;
const OFFLINE_URL = "/offline";

/** Roughly a couple of deploys' worth of chunks. Oldest entries go first. */
const MAX_ASSET_ENTRIES = 160;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // If the offline page itself cannot be fetched at install time there is
      // nothing useful to do about it, and failing here would leave the worker
      // uninstalled and the app exactly as it was before.
      await cache.addAll([OFFLINE_URL]).catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("ict-") && name !== ASSETS && name !== SHELL)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

/**
 * The page asks for this after a deploy so a student is not left on yesterday's
 * chunks until every tab is closed — see `components/pwa/ServiceWorker.tsx`.
 */
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") void self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never: anything that answers with a student's own data, and anything that
  // carries a session. `/api/auth` most of all — a cached session response is
  // how somebody ends up signed in as somebody else.
  if (url.pathname.startsWith("/api/")) return;

  // Build output and icons: content-hashed, so cache-first is always correct.
  if (isImmutableAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else is a document or a data request. Straight to the network;
  // only the failure case is handled, and only for a navigation.
  if (request.mode === "navigate") {
    event.respondWith(networkThenOfflinePage(request));
  }
});

function isImmutableAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/pdf.worker.min.mjs"
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  // Opaque and error responses are not worth keeping; a 404 cached forever is
  // a bug that outlives the deploy that caused it.
  if (response.ok && response.type === "basic") {
    void cache.put(request, response.clone()).then(() => trim(cache));
  }
  return response;
}

async function networkThenOfflinePage(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(SHELL);
    const fallback = await cache.match(OFFLINE_URL);
    // If even the fallback is missing, let the browser show its own error
    // rather than a blank frame.
    return fallback ?? Response.error();
  }
}

/** Keeps the asset cache from growing without bound across deploys. */
async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_ASSET_ENTRIES) return;
  // `keys()` is insertion-ordered, so the front of the list is the oldest.
  await Promise.all(keys.slice(0, keys.length - MAX_ASSET_ENTRIES).map((key) => cache.delete(key)));
}

/*
 * Class reminders.
 *
 * Sent as a data-only message on purpose (see `lib/push/send.ts`): with a
 * `notification` block the browser renders its own and this handler never
 * runs, so a tap would land on the app's start URL rather than on the class
 * that is about to start.
 */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json().data ?? event.data.json();
  } catch {
    return;
  }

  const title = payload.title || "ICT Campus";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      // Replaces rather than stacks: two devices, or a re-send, should not
      // leave a pile of identical rows in the shade.
      tag: payload.tag || "ict-campus",
      renotify: true,
      data: { path: payload.path || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.path || "/dashboard";
  const target = new URL(path, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Reuse a tab that is already open rather than stacking another one —
      // a student who taps three reminders should not end with three copies
      // of the app fighting over the same session.
      for (const client of clients) {
        if (client.url === target) return client.focus();
      }
      const existing = clients[0];
      if (existing && "navigate" in existing) {
        await existing.focus();
        return existing.navigate(target);
      }
      return self.clients.openWindow(target);
    })(),
  );
});
