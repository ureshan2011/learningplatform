import { CopyButton } from "@/components/packs/CopyButton";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import { Card, Eyebrow } from "@/components/ds";
import type { Translator } from "@/lib/i18n/server";

/**
 * "Invite a friend", in one implementation.
 *
 * The referral machinery has always been complete — `/signin?ref=CODE` is read
 * by the sign-in screen, carried through the session route, written to the user
 * document by `provision.ts`, and cashed in by `lib/referrals.ts` when the
 * referred student's first payment lands. What it lacked was a place a student
 * would ever see it: the only entry point was the third card down the
 * right-hand column of `/account`, under Language, which is a screen you open
 * to check a receipt.
 *
 * So it moves to the dashboard as well, and both copies come from here. Copy
 * is offered beside WhatsApp because not every student shares that way, and a
 * link you cannot copy is a link you cannot share at all.
 *
 * There is no "already claimed" state, deliberately: `referralRewarded` is set
 * on the *referred* student to stop them claiming twice. A referrer can invite
 * as many friends as they like, so saying otherwise here would be a lie.
 */
export function ReferralCard({ link, t }: { link: string; t: Translator }) {
  return (
    <Card radius="card" className="p-5">
      <Eyebrow>{t("dash.inviteTitle")}</Eyebrow>
      <p className="mt-2 text-sm text-ict-fg-soft">{t("invite.body")}</p>
      <p className="mt-3 truncate rounded-ict-sm border border-ict-line bg-ict-surface-raised px-3 py-2 font-mono text-xs text-ict-fg-soft">
        {link}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <WhatsAppShareButton
          text={`${t("invite.message")}\n${link}`}
          label={t("invite.share")}
          className="ict-press inline-flex h-8 items-center gap-2 rounded-full bg-[#25D366] px-3.5 text-sm font-semibold text-black transition-transform duration-[120ms]"
        />
        <CopyButton text={link} label={t("invite.copy")} copiedLabel={t("invite.copied")} />
      </div>
    </Card>
  );
}
