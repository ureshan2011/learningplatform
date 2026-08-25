/**
 * WhatsApp share links.
 *
 * `wa.me` is a free deep link Meta hosts — no WhatsApp Business API, no
 * per-message cost, no approval process. It opens WhatsApp with the message
 * pre-filled so the student just picks who to send it to. This is the
 * channel Sri Lankan students and parents actually live in, at zero cost.
 */
export function waShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
