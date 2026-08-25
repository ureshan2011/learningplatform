/**
 * WhatsApp share links.
 *
 * `wa.me` is a free deep link Meta hosts — no WhatsApp Business API, no
 * per-message cost, no approval process. It opens WhatsApp with the message
 * pre-filled so the student just picks who to send it to. This is the
 * channel Sri Lankan students and parents actually live in, at zero cost.
 */
/**
 * `phone` (E.164, e.g. +94771234567) opens the chat with that specific
 * person pre-selected — used for the teacher's at-risk nudge, where the
 * whole point is reaching one named student, not "share with anyone."
 * Omit it for a generic share where the sender picks the recipient.
 */
export function waShareUrl(text: string, phone?: string): string {
  const target = phone ? phone.replace(/\D/g, "") : "";
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}
