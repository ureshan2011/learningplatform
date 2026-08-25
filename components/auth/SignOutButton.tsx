"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";

/**
 * Signs out of this device only.
 *
 * Clears both the Firebase client session and our httpOnly cookie — leaving
 * either behind puts the app into a half-signed-in state that looks like a bug.
 * The device stays bound so signing back in does not consume a new slot.
 */
export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await signOut(clientAuth()).catch(() => {});
      router.replace("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={handleSignOut} disabled={busy} className="btn btn-secondary w-full">
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
