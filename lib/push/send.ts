import "server-only";

import { adminMessaging } from "@/lib/firebase/admin";
import { pruneDeadTokens, type PushToken } from "@/lib/push/tokens";

/**
 * Sending a notification, and cleaning up after it.
 *
 * Cloud Messaging is the same Firebase project as everything else, so this
 * needs no new account and no new secret — the service account already here
 * authorises the send, and only the *public* Web Push certificate goes in the
 * environment for the browser to subscribe with. That is the same reasoning
 * that put media on Cloud Storage rather than a second provider.
 *
 * Nothing in here is allowed to throw. A reminder is a nicety; a reminder that
 * takes down the route that sends it is a bug.
 */

export interface PushMessage {
  title: string;
  body: string;
  /** Where tapping the notification goes. Same-origin path, not a URL. */
  path: string;
  /**
   * Collapses repeats: a second reminder for the same class replaces the first
   * on the phone instead of stacking beside it.
   */
  tag: string;
}

export interface PushRecipient {
  uid: string;
  tokens: PushToken[];
}

/** How many notifications were actually delivered. */
export async function sendPush(
  recipients: PushRecipient[],
  message: PushMessage,
): Promise<{ sent: number; failed: number }> {
  const withTokens = recipients.filter((r) => r.tokens.length > 0);
  if (withTokens.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  // One multicast per student rather than one flat multicast for everybody:
  // FCM reports failures positionally, and a per-student call is what makes a
  // dead token attributable to the document it has to be removed from.
  for (const recipient of withTokens) {
    const tokens = recipient.tokens.map((t) => t.token);
    try {
      const result = await adminMessaging().sendEachForMulticast({
        tokens,
        // `data` only, no `notification` block: with a notification payload the
        // browser renders its own and the service worker's handler never runs,
        // so the click would not know where to go. See `public/sw.js`.
        data: {
          title: message.title,
          body: message.body,
          path: message.path,
          tag: message.tag,
        },
        webpush: {
          headers: {
            // Four hours. A reminder that arrives after the class has finished
            // is worse than no reminder.
            TTL: "14400",
            Urgency: "high",
          },
          fcmOptions: { link: message.path },
        },
      });

      sent += result.successCount;
      failed += result.failureCount;

      const dead = result.responses
        .map((response, i) => (isDeadToken(response.error?.code) ? tokens[i] : null))
        .filter((t): t is string => t !== null);
      await pruneDeadTokens(recipient.uid, dead);
    } catch (err) {
      failed += tokens.length;
      console.error("[push] send failed", err);
    }
  }

  return { sent, failed };
}

/**
 * The two codes that mean "this browser is never coming back" — the student
 * uninstalled, cleared site data, or revoked the permission. Every other
 * failure (a quota blip, a transient 503) is worth keeping the token for.
 */
function isDeadToken(code?: string): boolean {
  return (
    code === "messaging/registration-token-not-registered" ||
    code === "messaging/invalid-registration-token"
  );
}
